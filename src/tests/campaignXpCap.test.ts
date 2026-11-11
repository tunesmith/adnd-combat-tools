import { emptyProfileReference } from '../helpers/campaignPartyModel';
import {
  capCampaign,
  capMoneyAward,
  capCharacter,
  xpAt,
} from './fixtures/xpCapCampaign';
import {
  previewXpAward,
  confirmXpAward,
  beginXpCorrection,
  saveXpPoint,
  saveXpOpening,
  selectXpRewards,
  xpLedger,
  sessionXpBalances,
} from '../helpers/campaignXp';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import { updatePartyProfile } from '../helpers/campaignParty';
import { profileXpCap } from '../helpers/campaignXpCap';
import type { CampaignDocument } from '../helpers/campaignDocument';
import replay from './fixtures/xpSyntheticReplay.json';
const accept = (
  d: CampaignDocument,
  id: string,
  event = `event-${id}`,
  review = false
) =>
  confirmXpAward(d, id, previewXpAward(d, id).fingerprint, event, xpAt, review);
const train = (d: CampaignDocument, session: string, level: number) => {
  const p = d.party?.profiles.find(
    (p) => p.characterId === capCharacter && p.sessionId === session
  );
  if (!p) throw Error('Fixture');
  return updatePartyProfile(d, { ...p, baseLevel: level });
};
test('bonus and rounding precede the trained cap; repeated confirmation is idempotent', () => {
  const draft = capMoneyAward(capCampaign(), 'first', '500');
  const preview = previewXpAward(draft, 'first');
  expect(preview.rows[0]).toMatchObject({
    base: '500',
    bonus: '50',
    rounded: 550,
    fullAward: 550,
    award: 201,
    discarded: 349,
    before: 34800,
    after: 35001,
    cap: {
      characterClass: 'fighter',
      baseLevel: 5,
      limit: 35001,
      mode: 'standard',
    },
  });
  const confirmed = accept(draft, 'first');
  expect(confirmed.xp?.events[0]?.calculatorVersion).toBe(2);
  expect(
    confirmXpAward(confirmed, 'first', preview.fingerprint, 'event-first', xpAt)
  ).toBe(confirmed);
  expect(parseCampaign(serializeCampaign(confirmed))).toEqual(confirmed);
});
test.each([
  [34800, '201', 201, 0, 35001],
  [34800, '100', 100, 0, 34900],
  [35001, '500', 0, 500, 35001],
  [40000, '500', 0, 500, 40000],
])(
  'cap at balance %s/full %s preserves old balance',
  (balance, amount, added, discarded, after) => {
    const p = previewXpAward(
      capMoneyAward(capCampaign(balance, 5, 0), 'boundary', String(amount)),
      'boundary'
    );
    expect(p.rows[0]).toMatchObject({ award: added, discarded, after });
  }
);
test('manual training raises only the new session cap and never recovers discarded XP', () => {
  let doc = accept(capMoneyAward(capCampaign(), 'first', '500'), 'first');
  const frozen = JSON.stringify(doc.xp?.events);
  doc = train(doc, 'session-2', 6);
  const p = doc.party?.profiles.find(
    (p) => p.characterId === capCharacter && p.sessionId === 'session-2'
  );
  if (!p) throw Error('Fixture');
  doc = updatePartyProfile(doc, {
    ...p,
    reference: {
      ...(p.reference ?? emptyProfileReference()),
      bonuses: {
        ...(p.reference ?? emptyProfileReference()).bonuses,
        xpPercent: 0,
      },
    },
    adjustment: { name: 'Synthetic +1', enabled: true },
  });
  expect(
    profileXpCap(
      doc.party?.profiles.find(
        (p) => p.characterId === capCharacter && p.sessionId === 'session-1'
      )
    )?.limit
  ).toBe(35001);
  expect(
    profileXpCap(
      doc.party?.profiles.find(
        (p) => p.characterId === capCharacter && p.sessionId === 'session-2'
      )
    )?.limit
  ).toBe(70001);
  doc = capMoneyAward(doc, 'trained', '100', 'session-2');
  expect(previewXpAward(doc, 'trained').rows[0]).toMatchObject({
    fullAward: 100,
    award: 100,
    discarded: 0,
    before: 35001,
    after: 35101,
    cap: { baseLevel: 6, limit: 70001 },
  });
  expect(JSON.stringify(doc.xp?.events)).toBe(frozen);
});
test('profile changes invalidate previews; effective-level effects do not change caps', () => {
  let doc = capMoneyAward(capCampaign(), 'first', '500');
  const old = previewXpAward(doc, 'first');
  const p = doc.party?.profiles.find(
    (p) => p.characterId === capCharacter && p.sessionId === 'session-1'
  );
  if (!p) throw Error('Fixture');
  const stone = updatePartyProfile(doc, {
    ...p,
    adjustment: { name: 'Synthetic stone', enabled: true },
  });
  expect(previewXpAward(stone, 'first').fingerprint).toBe(old.fingerprint);
  doc = train(doc, 'session-1', 6);
  expect(() =>
    confirmXpAward(doc, 'first', old.fingerprint, 'stale', xpAt)
  ).toThrow('changed');
});
test('unknown caps and opening balances block; reviewed cap and uncapped exceptions are distinct', () => {
  let doc = capMoneyAward(capCampaign(), 'first', '500');
  const profile = doc.party?.profiles.find(
    (p) => p.characterId === capCharacter && p.sessionId === 'session-1'
  );
  if (!profile) throw Error('Fixture');
  doc = updatePartyProfile(doc, { ...profile, characterClass: 'manual' });
  expect(() => previewXpAward(doc, 'first')).toThrow('cap is unknown');
  let point = xpLedger(doc).points.find((p) => p.id === 'first');
  if (!point) throw Error('Fixture');
  point = {
    ...point,
    caps: [
      {
        characterId: capCharacter,
        basis: {
          characterClass: 'manual',
          baseLevel: 5,
          mode: 'override',
          limit: 35001,
          reason: 'Custom creature cap',
        },
      },
    ],
  };
  doc = saveXpPoint(doc, point);
  expect(previewXpAward(doc, 'first').rows[0]?.award).toBe(201);
  doc = saveXpPoint(doc, {
    ...point,
    caps: point.caps?.map((c) => ({
      ...c,
      basis: {
        ...c.basis,
        mode: 'uncapped',
        limit: null,
        reason: 'Explicit custom exception',
      },
    })),
  });
  expect(previewXpAward(doc, 'first').rows[0]).toMatchObject({
    fullAward: 550,
    award: 550,
    discarded: 0,
    after: 35350,
  });
  expect(() =>
    previewXpAward(
      capMoneyAward(capCampaign(null), 'unknown', '500'),
      'unknown'
    )
  ).toThrow('opening');
});
test('an earlier correction recalculates later caps from frozen full amounts and trained bases', () => {
  let doc = accept(
    capMoneyAward(capCampaign(34800, 5, 0), 'first', '100'),
    'first'
  );
  doc = accept(capMoneyAward(doc, 'later', '200'), 'later');
  expect(doc.xp?.events[1]?.rows[0]).toMatchObject({
    fullAward: 200,
    award: 101,
    discarded: 99,
  });
  const originals = JSON.parse(JSON.stringify(doc.xp?.events));
  doc = train(doc, 'session-1', 6);
  doc = beginXpCorrection(doc, 'event-first', 'fix');
  let point = xpLedger(doc).points.find((p) => p.id === 'fix');
  if (!point) throw Error('Fixture');
  expect(point.caps?.[0]?.basis.baseLevel).toBe(5);
  point = {
    ...point,
    correctionReason: 'Correct earlier amount',
    bonuses: point.bonuses.map((b) => ({
      ...b,
      finalOverride: 50,
      finalReason: 'Historical corrected full award',
    })),
  };
  doc = saveXpPoint(doc, point);
  const p = previewXpAward(doc, 'fix');
  expect(p.rows[0]).toMatchObject({
    fullAward: 50,
    award: 50,
    cap: { baseLevel: 5, limit: 35001 },
  });
  expect(p.later[0]?.rows[0]).toMatchObject({
    fullAward: 200,
    award: 151,
    discarded: 49,
    before: 34850,
    after: 35001,
    cap: { baseLevel: 5, limit: 35001 },
  });
  expect(() =>
    confirmXpAward(doc, 'fix', p.fingerprint, 'fixed', xpAt)
  ).toThrow('later balances');
  const next = confirmXpAward(doc, 'fix', p.fingerprint, 'fixed', xpAt, true);
  expect(next.xp?.events.slice(0, 2)).toEqual(originals);
  validateHistoryTransition(doc, next, '');
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
  expect(sessionXpBalances(next, capCharacter, 'session-1').closing).toBe(
    35001
  );
});
test('V11 accepted awards migrate exactly without fabricated cap history, even above today’s cap', () => {
  const legacy = JSON.parse(JSON.stringify(replay.confirmed));
  legacy.schemaVersion = 11;
  legacy.xp.openings[0].balance = 34000;
  legacy.xp.events[0].rows[0].before = 34000;
  legacy.xp.events[0].rows[0].after = 34507;
  const doc = parseCampaign(JSON.stringify(legacy));
  expect(doc.schemaVersion).toBe(18);
  expect(doc.xp?.events).toEqual(legacy.xp.events);
  expect(doc.xp?.events[0]?.rows[0]?.cap).toBeUndefined();
  expect(sessionXpBalances(doc, capCharacter, 'session-2').closing).toBe(34507);
  const reopened = parseCampaign(serializeCampaign(doc));
  expect(reopened.xp?.events).toEqual(legacy.xp.events);
  const old = doc.xp?.events[0];
  if (!old) throw Error('Fixture');
  const correction = beginXpCorrection(doc, old.id, 'legacy-fix');
  expect(() => previewXpAward(correction, 'legacy-fix')).toThrow('reason');
  const draft = xpLedger(correction).points.find((p) => p.id === 'legacy-fix');
  if (!draft) throw Error('Fixture');
  const reviewed = saveXpPoint(correction, {
    ...draft,
    correctionReason: 'Historical review',
  });
  expect(() => previewXpAward(reviewed, 'legacy-fix')).toThrow(
    'historical trained level'
  );
});

test('discarded XP is not redistributed and a full-award override is capped afterward', () => {
  let doc = capMoneyAward(capCampaign(), 'shared', '1000');
  const tal = doc.party?.roster.find((c) => c.name === 'Tal');
  if (!tal) throw Error('Fixture');
  const reward = doc.xp?.rewards.find((r) => r.id === 'shared-money');
  if (!reward) throw Error('Fixture');
  const mira = reward.recipients[0];
  if (!mira) throw Error('Fixture');
  reward.recipients.push({ ...mira, characterId: tal.id, name: tal.name });
  // This is a synthetic draft, not a change to accepted source evidence.
  doc = saveXpOpening(doc, {
    id: 'tal-opening',
    characterId: tal.id,
    sessionId: 'session-1',
    balance: 0,
    reason: 'Synthetic known opening',
  });
  doc = selectXpRewards(doc, 'shared', ['shared-money']);
  const preview = previewXpAward(doc, 'shared');
  expect(preview.rows.map((r) => [r.fullAward, r.award, r.discarded])).toEqual([
    [550, 201, 349],
    [550, 550, 0],
  ]);
  const point = doc.xp?.points.find((p) => p.id === 'shared');
  if (!point) throw Error('Fixture');
  doc = saveXpPoint(doc, {
    ...point,
    bonuses: point.bonuses.map((b) =>
      b.characterId === capCharacter
        ? {
            ...b,
            finalOverride: 1000,
            finalReason: 'Synthetic full adjustment',
          }
        : b
    ),
  });
  expect(previewXpAward(doc, 'shared').rows[0]).toMatchObject({
    rounded: 550,
    fullAward: 1000,
    award: 201,
    discarded: 799,
  });
});

test('a later capped balance-review version can itself be revised using its recorded basis', () => {
  let doc = accept(
    capMoneyAward(capCampaign(34800, 5, 0), 'first', '100'),
    'first'
  );
  doc = accept(capMoneyAward(doc, 'later', '200'), 'later');
  doc = beginXpCorrection(doc, 'event-first', 'fix');
  let point = xpLedger(doc).points.find((p) => p.id === 'fix');
  if (!point) throw Error('Fixture');
  doc = saveXpPoint(doc, {
    ...point,
    correctionReason: 'Earlier correction',
    bonuses: point.bonuses.map((b) => ({
      ...b,
      finalOverride: 50,
      finalReason: 'Correct full amount',
    })),
  });
  doc = confirmXpAward(
    doc,
    'fix',
    previewXpAward(doc, 'fix').fingerprint,
    'fixed',
    xpAt,
    true
  );
  doc = train(doc, 'session-1', 6);
  const old = JSON.parse(JSON.stringify(doc.xp?.events));
  doc = beginXpCorrection(doc, 'fixed-balance-0', 'later-fix');
  point = xpLedger(doc).points.find((p) => p.id === 'later-fix');
  if (!point) throw Error('Fixture');
  doc = saveXpPoint(doc, { ...point, correctionReason: 'Review later award' });
  const preview = previewXpAward(doc, 'later-fix');
  expect(preview.rows[0]).toMatchObject({
    before: 34850,
    fullAward: 200,
    award: 151,
    discarded: 49,
    cap: { baseLevel: 5, limit: 35001 },
  });
  const next = confirmXpAward(
    doc,
    'later-fix',
    preview.fingerprint,
    'later-fixed',
    xpAt
  );
  validateHistoryTransition(doc, next, '');
  expect(next.xp?.events.slice(0, 4)).toEqual(old);
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
});
