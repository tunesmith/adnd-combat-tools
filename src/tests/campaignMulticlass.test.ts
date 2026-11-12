import {
  multiclassCampaign,
  multiMoneyAward,
  multiCharacter,
  acceptMulti,
  xpAt,
} from './fixtures/multiclassCampaign';
import {
  calculatedSaves,
  combatValuesForProfile,
  copyPartyProfile,
  encounterLevel,
  profileLabel,
  updatePartyProfile,
} from '../helpers/campaignParty';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import { baseSavingThrows } from '../tables/savingThrows';
import { FIGHTER, THIEF } from '../tables/attackerClass';
import {
  beginXpCorrection,
  confirmXpExtension,
  resolveXpReward,
  newXpPoint,
  previewXpAward,
  previewXpExtension,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
  stageXpAward,
  xpClassBalances,
  xpLedger,
} from '../helpers/campaignXp';
import { newXpReward } from '../helpers/campaignXpSources';
import { profileXpCap } from '../helpers/campaignXpCap';
const required = <T>(v: T | undefined): T => {
  if (v === undefined) throw Error('Fixture value');
  return v;
};
const profile = (
  doc: ReturnType<typeof multiclassCampaign>,
  sessionId = 'session-1'
) =>
  required(
    doc.party?.profiles.find(
      (p) => p.characterId === multiCharacter && p.sessionId === sessionId
    )
  );
const reopen = (doc: ReturnType<typeof multiclassCampaign>) =>
  parseCampaign(serializeCampaign(doc));
test('one shared profile, category-wise saves, explicit tracker basis and independent session copies', () => {
  const doc = multiclassCampaign(),
    p = profile(doc);
  expect(profileLabel(p)).toBe('Fighter 1 / Thief 1');
  expect(calculatedSaves(p)).toEqual([13, 12, 14, 16, 15]);
  expect(combatValuesForProfile(p)).toEqual({ class: FIGHTER, level: 1 });
  expect(p.reference?.maxHp).toBe(6);
  expect(encounterLevel(p)).toBe('1');
  const next = copyPartyProfile(p, 'session-2');
  required(next.classes?.[1]).baseLevel = 5;
  expect(required(p.classes?.[1]).baseLevel).toBe(1);
  expect(encounterLevel(next)).toBeNull();
  expect(calculatedSaves(next)).toEqual(baseSavingThrows('thief', 5));
  expect(
    combatValuesForProfile({ ...next, combatClassId: 'multi-thief' })
  ).toEqual({ class: THIEF, level: 5 });
  expect(
    calculatedSaves({
      ...p,
      adjustment: { name: 'Stone', enabled: true, classId: 'multi-fighter' },
      classes: p.classes?.map((c) => ({
        ...c,
        baseLevel: c.characterClass === 'fighter' ? 2 : 1,
      })),
    })
  ).toEqual([13, 12, 14, 16, 15]);
  expect(reopen(doc)).toEqual(doc);
});
test('one recipient share splits exactly before separate bonuses, rounding and caps', () => {
  const draft = multiMoneyAward(multiclassCampaign(), 'first', '100');
  const row = required(previewXpAward(draft, 'first').rows[0]);
  expect(row.base).toBe('100');
  expect(row.award).toBe(110);
  expect(
    row.classes?.map((c) => [c.base, c.bonus, c.fullAward, c.award, c.after])
  ).toEqual([
    ['50', '5', 55, 55, 55],
    ['50', '5', 55, 55, 55],
  ]);
  const confirmed = acceptMulti(draft, 'first');
  validateHistoryTransition(draft, confirmed, '');
  expect(reopen(confirmed)).toEqual(confirmed);
  const reward = newXpReward(
    multiclassCampaign(),
    'session-1',
    'party',
    'money'
  );
  reward.input = { category: 'money', gp: '200' };
  reward.recipients = reward.recipients
    .slice(0, 2)
    .map((r) => ({ ...r, participated: true, eligible: true }));
  let party = saveXpReward(multiclassCampaign(), reward);
  party = saveXpPoint(party, {
    ...newXpPoint(party, 'session-1', 'party-award'),
    label: 'Party shares',
  });
  party = selectXpRewards(party, 'party-award', [reward.id]);
  expect(
    resolveXpReward(reward).allocations.find(
      (a) => a.characterId === multiCharacter
    )?.accepted
  ).toBe('100');
  // Each character receives one share before any per-class split.
  expect(
    xpLedger(party).points[0]?.bonuses.find(
      (b) => b.characterId === multiCharacter
    )?.classes
  ).toHaveLength(2);
});
test('fighter cap discards excess without redistribution; manual training only changes future proposals', () => {
  const draft = multiMoneyAward(
    multiclassCampaign(1990, 1100),
    'capped',
    '100'
  );
  const row = required(previewXpAward(draft, 'capped').rows[0]);
  expect(row).toMatchObject({
    fullAward: 110,
    award: 66,
    discarded: 44,
    before: 3090,
    after: 3156,
  });
  expect(
    row.classes?.map((c) => [
      c.fullAward,
      c.award,
      c.discarded,
      c.after,
      c.cap?.limit,
    ])
  ).toEqual([
    [55, 11, 44, 2001, 2001],
    [55, 55, 0, 1155, 1251],
  ]);
  const confirmed = acceptMulti(draft, 'capped');
  const frozen = JSON.stringify(confirmed.xp?.events);
  const p = profile(confirmed, 'session-2');
  let trained = updatePartyProfile(confirmed, {
    ...p,
    classes: p.classes?.map((c) =>
      c.characterClass === 'thief' ? { ...c, baseLevel: 2 } : c
    ),
  });
  trained = multiMoneyAward(trained, 'next', '100', 'session-2');
  const next = required(previewXpAward(trained, 'next').rows[0]);
  expect(
    next.classes?.map((c) => [c.baseLevel, c.award, c.cap?.limit, c.after])
  ).toEqual([
    [1, 0, 2001, 2001],
    [2, 55, 2501, 1210],
  ]);
  expect(JSON.stringify(trained.xp?.events)).toBe(frozen);
  expect(reopen(acceptMulti(trained, 'next'))).toBeDefined();
  expect(profileXpCap({ characterClass: 'thief', baseLevel: 2 })?.limit).toBe(
    2501
  );
});
test('class corrections atomically rebase later capped balances and retain immutable snapshots', () => {
  let doc = acceptMulti(
    multiMoneyAward(multiclassCampaign(1990, 1100), 'one', '100'),
    'one'
  );
  doc = acceptMulti(multiMoneyAward(doc, 'two', '100', 'session-2'), 'two');
  const before = doc;
  doc = beginXpCorrection(doc, 'event-one', 'fix');
  let point = required(doc.xp?.points.find((p) => p.id === 'fix'));
  const source = required(doc.xp?.events[0]?.rewards[0]);
  point = {
    ...point,
    correctionReason: 'Synthetic correction',
    rewardOverrides: [{ ...source, input: { category: 'money', gp: '40' } }],
  };
  doc = saveXpPoint(doc, point);
  const preview = previewXpAward(doc, 'fix');
  expect(preview.rows[0]?.classes?.map((c) => c.award)).toEqual([11, 22]);
  expect(preview.later[0]?.rows[0]?.classes?.map((c) => c.after)).toEqual([
    2001, 1177,
  ]);
  const accepted = acceptMulti(doc, 'fix', 'fix-event', true);
  validateHistoryTransition(before, accepted, '');
  expect(accepted.xp?.events.slice(0, 2)).toEqual(before.xp?.events);
  expect(reopen(accepted)).toEqual(accepted);
});
test('live Keep/Sell/Defer calculations are hypothetical until one atomic confirmation', () => {
  let doc = multiclassCampaign();
  let reward = newXpReward(doc, 'session-1', 'gem', 'treasure');
  reward = {
    ...reward,
    title: 'Synthetic gem',
    input: {
      category: 'treasure',
      retainedXp: '100',
      proceeds: '200',
      marketGp: null,
      disposition: 'defer',
    },
    recipients: reward.recipients
      .filter((r) => r.characterId === multiCharacter)
      .map((r) => ({ ...r, eligible: true, participated: true })),
  };
  doc = saveXpReward(doc, reward);
  const point = {
    ...newXpPoint(doc, 'session-1', 'gem-point'),
    label: 'Gem scenarios',
  };
  const selected = { ...point, rewardIds: [reward.id] };
  const keep = stageXpAward(doc, selected, { gem: 'keep' }),
    sell = stageXpAward(doc, selected, { gem: 'sell' });
  expect(
    previewXpAward(keep, point.id).rows[0]?.classes?.map((c) => c.award)
  ).toEqual([55, 55]);
  expect(
    previewXpAward(sell, point.id).rows[0]?.classes?.map((c) => c.award)
  ).toEqual([110, 110]);
  expect(doc.xp?.rewards[0]?.input).toMatchObject({ disposition: 'defer' });
  expect(
    stageXpAward(doc, selected, { gem: 'defer' }).xp?.points[0]?.rewardIds
  ).toEqual([]);
  const accepted = acceptMulti(keep, point.id);
  expect(accepted.xp?.rewards[0]?.input).toMatchObject({ disposition: 'keep' });
  expect(reopen(accepted)).toEqual(accepted);
});
test('unknown class openings block, and converting confirmed single-class XP requires a reviewed mapping', () => {
  expect(() =>
    previewXpAward(
      multiMoneyAward(multiclassCampaign(null, 0), 'unknown', '100'),
      'unknown'
    )
  ).toThrow('opening');
  let doc = multiclassCampaign();
  const p = profile(doc);
  doc = updatePartyProfile(doc, {
    ...p,
    classes: undefined,
    combatClassId: undefined,
    reference: p.reference
      ? { ...p.reference, bonuses: { ...p.reference.bonuses, xpPercent: 10 } }
      : undefined,
  });
  doc = {
    ...doc,
    xp: {
      ...xpLedger(doc),
      openings: xpLedger(doc).openings.map((o) => ({
        ...o,
        classes: undefined,
      })),
    },
  };
  doc = acceptMulti(multiMoneyAward(doc, 'legacy', '100'), 'legacy');
  const prior = JSON.stringify(doc.xp?.events);
  doc = updatePartyProfile(doc, p);
  doc = multiMoneyAward(doc, 'converted', '100');
  expect(() => previewXpAward(doc, 'converted')).toThrow('per-class opening');
  const point = required(doc.xp?.points.find((p) => p.id === 'converted'));
  doc = saveXpPoint(doc, {
    ...point,
    bonuses: point.bonuses.map((b) => ({
      ...b,
      classes: b.classes?.map((c, i) => ({ ...c, opening: i === 0 ? 60 : 50 })),
    })),
  });
  expect(
    previewXpAward(doc, 'converted').rows[0]?.classes?.map((c) => c.after)
  ).toEqual([115, 105]);
  const accepted = acceptMulti(doc, 'converted');
  expect(JSON.stringify(accepted.xp?.events.slice(0, 1))).toBe(prior);
  expect(reopen(accepted)).toEqual(accepted);
});
test('backward per-class openings reconcile separately; same-total mismatches cannot swap class XP', () => {
  let baseline = multiclassCampaign(2001, 1155);
  baseline = {
    ...baseline,
    xp: {
      ...xpLedger(baseline),
      openings: xpLedger(baseline).openings.map((o) => ({
        ...o,
        sessionId: 'session-2',
      })),
    },
  };
  baseline = acceptMulti(
    multiMoneyAward(baseline, 'later', '40', 'session-2'),
    'later'
  );
  const frozen = JSON.stringify(baseline.xp?.events);
  const drafts = multiMoneyAward(baseline, 'earlier', '100');
  const request = {
    pointIds: ['earlier'],
    openings: [
      {
        characterId: multiCharacter,
        sessionId: 'session-1',
        balance: 3090,
        classes: [
          {
            classId: 'multi-fighter',
            characterClass: 'fighter' as const,
            balance: 1990,
          },
          {
            classId: 'multi-thief',
            characterClass: 'thief' as const,
            balance: 1100,
          },
        ],
      },
    ],
  };
  const preview = previewXpExtension(drafts, request);
  expect(preview.rows[0]?.difference).toBe(0);
  expect(preview.awards[0]?.rows[0]?.award).toBe(66);
  const confirmed = confirmXpExtension(
    drafts,
    request,
    preview.fingerprint,
    'extend',
    xpAt
  );
  validateHistoryTransition(drafts, confirmed, '');
  expect(JSON.stringify(confirmed.xp?.events.slice(0, 1))).toBe(frozen);
  expect(reopen(confirmed)).toEqual(confirmed);
  expect(
    xpClassBalances(confirmed, multiCharacter, {
      sessionId: 'session-2',
      phase: 'end',
      order: 9999,
    })
  ).toEqual({ 'multi-fighter': 2001, 'multi-thief': 1177 });
  const bad = {
    ...request,
    openings: request.openings.map((o) => ({
      ...o,
      classes: o.classes.map((c) => ({
        ...c,
        balance: c.balance + (c.characterClass === 'fighter' ? -1 : 1),
      })),
    })),
  };
  const mismatch = previewXpExtension(drafts, bad);
  expect(mismatch.rows[0]?.classes?.some((c) => c.difference !== 0)).toBe(true);
  expect(() =>
    confirmXpExtension(
      drafts,
      bad,
      mismatch.fingerprint,
      'bad-class-extension',
      xpAt
    )
  ).toThrow('match');
});

test('class XP bonuses are independent and fractional shares remain exact until class award rounding', () => {
  let doc = multiclassCampaign();
  const p = profile(doc);
  doc = updatePartyProfile(doc, {
    ...p,
    classes: p.classes?.map((c) =>
      c.characterClass === 'thief' ? { ...c, xpPercent: 0 } : c
    ),
  });
  const draft = multiMoneyAward(doc, 'fractions', '101');
  const row = required(previewXpAward(draft, 'fractions').rows[0]);
  expect(
    row.classes?.map((c) => [c.base, c.bonusPercent, c.unrounded, c.fullAward])
  ).toEqual([
    ['101/2', '10', '1111/20', 56],
    ['101/2', '0', '101/2', 51],
  ]);
  expect(
    reopen(acceptMulti(draft, 'fractions')).xp?.events[0]?.rows[0]?.award
  ).toBe(107);
  const mixed = {
    ...p,
    classes: p.classes?.map((c) =>
      c.characterClass === 'fighter'
        ? { ...c, baseLevel: 5 }
        : { ...c, characterClass: 'magic-user' as const }
    ),
  };
  expect(calculatedSaves(mixed)).toEqual([11, 12, 11, 13, 12]);
});

test('a second backward stretch preserves later per-class history and both original cutoffs', () => {
  let doc = multiclassCampaign(2001, 1155);
  doc = {
    ...doc,
    xp: {
      ...xpLedger(doc),
      openings: xpLedger(doc).openings.map((o) => ({
        ...o,
        sessionId: 'session-2',
      })),
    },
  };
  doc = acceptMulti(multiMoneyAward(doc, 'later', '40', 'session-2'), 'later');
  doc = multiMoneyAward(doc, 'middle', '100');
  const first = {
    pointIds: ['middle'],
    openings: [
      {
        characterId: multiCharacter,
        sessionId: 'session-1',
        balance: 3090,
        classes: [
          {
            classId: 'multi-fighter',
            characterClass: 'fighter' as const,
            balance: 1990,
          },
          {
            classId: 'multi-thief',
            characterClass: 'thief' as const,
            balance: 1100,
          },
        ],
      },
    ],
  };
  doc = confirmXpExtension(
    doc,
    first,
    previewXpExtension(doc, first).fingerprint,
    'extension-first',
    xpAt
  );
  const frozen = JSON.stringify(doc.xp?.events);
  doc = {
    ...doc,
    sessions: [
      { id: 'session-zero', label: 'Synthetic earlier trip', notes: '' },
      ...doc.sessions,
    ],
  };
  doc = updatePartyProfile(doc, copyPartyProfile(profile(doc), 'session-zero'));
  doc = multiMoneyAward(doc, 'earliest', '100', 'session-zero');
  const request = {
    pointIds: ['earliest'],
    openings: [
      {
        characterId: multiCharacter,
        sessionId: 'session-zero',
        balance: 2980,
        classes: [
          {
            classId: 'multi-fighter',
            characterClass: 'fighter' as const,
            balance: 1935,
          },
          {
            classId: 'multi-thief',
            characterClass: 'thief' as const,
            balance: 1045,
          },
        ],
      },
    ],
  };
  const review = previewXpExtension(doc, request);
  expect(
    review.rows[0]?.classes?.map((c) => [
      c.applied,
      c.reconstructed,
      c.difference,
    ])
  ).toEqual([
    [55, 1990, 0],
    [55, 1100, 0],
  ]);
  const after = confirmXpExtension(
    doc,
    request,
    review.fingerprint,
    'extension-second',
    xpAt
  );
  validateHistoryTransition(doc, after, '');
  expect(JSON.stringify(after.xp?.events.slice(0, 2))).toBe(frozen);
  expect(reopen(after).xp?.extensions).toHaveLength(2);
});

test('mixed parties divide once per character and independently cap single-class recipients too', () => {
  let doc = multiclassCampaign(1990, 1100);
  const single = required(
    doc.party?.roster.find((c) => c.id !== multiCharacter)
  );
  doc = {
    ...doc,
    xp: {
      ...xpLedger(doc),
      openings: [
        ...xpLedger(doc).openings,
        {
          id: 'single-opening',
          characterId: single.id,
          sessionId: 'session-1',
          balance: 1995,
          reason: 'Synthetic scalar opening',
        },
      ],
    },
  };
  const reward = newXpReward(doc, 'session-1', 'mixed-party', 'money');
  reward.input = { category: 'money', gp: '200' };
  reward.recipients = reward.recipients
    .filter(
      (r) => r.characterId === multiCharacter || r.characterId === single.id
    )
    .map((r) => ({ ...r, participated: true, eligible: true }));
  doc = saveXpReward(doc, reward);
  doc = saveXpPoint(doc, {
    ...newXpPoint(doc, 'session-1', 'mixed-award'),
    label: 'Mixed party',
  });
  doc = selectXpRewards(doc, 'mixed-award', [reward.id]);
  const preview = previewXpAward(doc, 'mixed-award');
  expect(preview.rows.map((r) => [r.base, r.award])).toEqual([
    ['100', 66],
    ['100', 6],
  ]);
  const after = acceptMulti(doc, 'mixed-award');
  validateHistoryTransition(doc, after, '');
  expect(reopen(after)).toEqual(after);
});

test('a delayed multiclass share stays whole and splits into classes only at payment', () => {
  let doc = multiMoneyAward(multiclassCampaign(), 'deferred-multi', '100');
  const reward = xpLedger(doc).rewards.find(
    (r) => r.id === 'deferred-multi-money'
  );
  const point = xpLedger(doc).points.find((p) => p.id === 'deferred-multi');
  const other = doc.party?.roster.find((c) => c.id !== multiCharacter);
  if (!reward || !point || !other || !reward.recipients[0])
    throw Error('Fixture');
  doc = saveXpReward(doc, {
    ...reward,
    version: reward.version + 1,
    recipients: [
      ...reward.recipients,
      { ...reward.recipients[0], characterId: other.id, name: other.name },
    ],
  });
  doc = saveXpPoint(doc, {
    ...point,
    settlements: [
      {
        rewardId: reward.id,
        characterId: multiCharacter,
        decision: 'later',
        reason: '',
      },
      {
        rewardId: reward.id,
        characterId: other.id,
        decision: 'forfeit',
        reason: '',
      },
    ],
  });
  doc = acceptMulti(doc, point.id);
  doc = saveXpPoint(doc, {
    ...newXpPoint(doc, 'session-2', 'later-multi'),
    rewardIds: [reward.id],
  });
  doc = selectXpRewards(doc, 'later-multi', [reward.id]);
  const preview = previewXpAward(doc, 'later-multi');
  expect(preview.rows).toHaveLength(1);
  expect(preview.rows[0]?.base).toBe('50');
  expect(preview.rows[0]?.classes?.map((c) => [c.base, c.award])).toEqual([
    ['25', 28],
    ['25', 28],
  ]);
  expect(
    reopen(acceptMulti(doc, 'later-multi')).xp?.events.at(-1)?.rows[0]?.award
  ).toBe(56);
});
