import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  activeXpEvents,
  beginXpCorrection,
  confirmXpAward,
  previewXpAward,
  resolveXpReward,
  rewardSettlement,
  saveXpOpening,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
  sessionXpBalances,
  xpBalance,
  xpLedger,
  newXpPoint,
  deleteXpReward,
} from '../helpers/campaignXp';
import {
  xpCastleDraft,
  xpTestIds,
  xpAt,
  xpCampaign,
  xpTestReward,
  pendingFungus,
} from './fixtures/xpCampaign';
import {
  xpAdd,
  xpExact,
  xpMultiply,
  xpNumber,
  xpRound,
} from '../helpers/xpArithmetic';
import {
  calculateMonster,
  monsterCoefficients,
  monsterXpBands,
} from '../tables/monsterExperience';
import {
  startNextSession,
  sessionFingerprint,
} from '../helpers/campaignContinuity';
import baseline from './fixtures/campaignB1V2.json';
import type { CampaignDocument } from '../helpers/campaignDocument';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture');
  return value;
}
function confirmed(doc = xpCastleDraft()) {
  const p = previewXpAward(doc, 'refuge-point');
  return confirmXpAward(
    doc,
    'refuge-point',
    p.fingerprint,
    'refuge-confirmed',
    xpAt
  );
}
test('historical award freezes the 25.8-to-26 allocation separately from final rounding and preserves origin timing', () => {
  const doc = xpCastleDraft(),
    preview = previewXpAward(doc, 'refuge-point');
  expect(preview.resolutions[0]).toMatchObject({
    calculatedRaw: '129',
    raw: '129',
    proposedRatio: '1',
    ratio: '1',
    allocationAdjustment: { direction: 'increase', amount: '1' },
  });
  expect(preview.rows.map((r) => r.award)).toEqual([507, 507, 507, 461, 507]);
  expect(preview.rows[0]).toMatchObject({
    base: '461',
    bonus: '461/10',
    unrounded: '5071/10',
    rounded: 507,
    before: 0,
    after: 507,
  });
  expect(preview.rows[0]?.allocations[0]).toMatchObject({
    calculated: '129/5',
    accepted: '26',
    reason: 'Recorded historical award-row rounding',
  });
  const accepted = confirmed(doc),
    reopen = parseCampaign(serializeCampaign(accepted));
  for (const id of xpTestIds)
    expect(sessionXpBalances(reopen, id, 'session-1')).toEqual({
      opening: 0,
      closing: 0,
    });
  expect(
    xpTestIds.map((id) => sessionXpBalances(reopen, id, 'session-2').closing)
  ).toEqual([507, 507, 507, 461, 507]);
  expect(reopen.records).toEqual(baseline.records);
  expect(validateHistoryTransition(doc, accepted, '')).toBeUndefined();
  expect(
    confirmXpAward(
      reopen,
      'refuge-point',
      preview.fingerprint,
      'refuge-confirmed',
      xpAt
    )
  ).toBe(reopen);
  expect(() =>
    confirmXpAward(
      reopen,
      'refuge-point',
      preview.fingerprint,
      'different-retry',
      xpAt
    )
  ).toThrow('already');
});
test('ordinary fractional calculations aggregate exactly and round only the final total after bonus', () => {
  const preview = previewXpAward(xpCastleDraft(false), 'refuge-point');
  expect(preview.rows[0]).toMatchObject({
    base: '2304/5',
    bonus: '1152/25',
    unrounded: '12672/25',
    award: 507,
  });
  expect(preview.rows[3]).toMatchObject({
    base: '2304/5',
    bonus: '0',
    unrounded: '2304/5',
    award: 461,
  });
  expect(xpExact(xpAdd(xpNumber('0.1'), xpNumber('0.2')))).toBe('3/10');
  expect(xpRound(xpNumber('1/2'))).toBe(1);
  expect(xpRound(xpNumber('0.49999999'))).toBe(0);
  expect(xpExact(xpMultiply(xpNumber('999999.99'), xpNumber('0.1')))).toBe(
    '99999999/1000'
  );
});
test('all printed monster bands and lower-HD/HP-addition/class-level boundaries use distinct coefficients and difficulty', () => {
  const sample = required(
    xpTestReward(xpCampaign(), 'test', 'monster', false).input.category ===
      'monster'
      ? xpTestReward(xpCampaign(), 'test', 'monster', false).input
      : undefined
  );
  if (sample.category !== 'monster') throw Error('Fixture');
  const m = required(sample.monsters[0]);
  expect(
    monsterCoefficients({ ...m, hitDice: '1', hpAdjustment: -2 }).base
  ).toBe(5);
  expect(
    monsterCoefficients({ ...m, hitDice: '1', hpAdjustment: -1 }).base
  ).toBe(10);
  expect(
    monsterCoefficients({ ...m, hitDice: '1', hpAdjustment: 0 }).base
  ).toBe(10);
  expect(
    monsterCoefficients({ ...m, hitDice: '1', hpAdjustment: 1 }).base
  ).toBe(20);
  expect(monsterCoefficients({ ...m, hitDice: '1', basis: 'level' }).base).toBe(
    20
  );
  const hds = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 21];
  hds.forEach((hd, i) =>
    expect(
      monsterCoefficients({ ...m, hitDice: String(hd), hpAdjustment: 0 }).id
    ).toBe(monsterXpBands[i]?.id)
  );
  expect(
    calculateMonster({
      ...m,
      count: 1,
      hitDice: '2',
      hpAdjustment: 1,
      startingHp: '14',
      special: 1,
    })
  ).toMatchObject({ raw: '92', difficulty: '4' });
  expect(
    calculateMonster({
      ...m,
      count: 1,
      hitDice: '3',
      hpAdjustment: 0,
      startingHp: '14',
      special: 0,
    })
  ).toMatchObject({ raw: '77', difficulty: '3' });
  expect(() => calculateMonster({ ...m, startingHp: null })).toThrow(
    'starting HP'
  );
  expect(() => calculateMonster({ ...m, hitDice: null })).toThrow('actual HD');
});
test('later fungus remains pending and retains the historical excess and recorded ratio independently of printed calculation', () => {
  let doc = confirmed();
  doc = saveXpReward(doc, pendingFungus(doc));
  const fungus = required(
    xpLedger(doc).rewards.find((r) => r.id === 'later-fungus')
  );
  expect(resolveXpReward(fungus)).toMatchObject({
    calculatedRaw: '77',
    raw: '92',
    proposedRatio: '3/4',
    recordedProposal: '1/2',
    ratio: '1',
  });
  expect(resolveXpReward(fungus).allocations.map((a) => a.accepted)).toEqual([
    '23',
    '23',
    '23',
    '23',
  ]);
  expect(rewardSettlement(doc, fungus.id)).toBeUndefined();
  expect(
    xpTestIds.map((id) => sessionXpBalances(doc, id, 'session-2').closing)
  ).toEqual([507, 507, 507, 461, 507]);
  let draft = xpCastleDraft();
  draft = saveXpReward(draft, pendingFungus(draft));
  draft = selectXpRewards(draft, 'refuge-point', [
    'raiders',
    'money',
    'scroll',
    'later-fungus',
  ]);
  expect(() => previewXpAward(draft, 'refuge-point')).toThrow('after');
});
test('unknown opening balances and bonuses stay unknown; recipient levels, shares and decisions remain explicit', () => {
  const blank = xpCampaign(false);
  expect(
    xpBalance(blank, required(xpTestIds[0]), {
      sessionId: 'session-1',
      phase: 'end',
      order: 0,
    })
  ).toBeNull();
  let doc = xpCastleDraft();
  doc = { ...doc, xp: { ...xpLedger(doc), openings: [] } };
  expect(() => previewXpAward(doc, 'refuge-point')).toThrow('opening');
  doc = xpCastleDraft();
  const point = required(xpLedger(doc).points[0]);
  doc = saveXpPoint(doc, {
    ...point,
    bonuses: point.bonuses.map((b) => ({ ...b, percent: null })),
  });
  expect(() => previewXpAward(doc, 'refuge-point')).toThrow('bonus');
  const reward = xpTestReward(xpCampaign(), 'shared', 'money');
  reward.recipients = reward.recipients.slice(0, 2);
  required(reward.recipients[0]).shares = '2';
  expect(resolveXpReward(reward).allocations.map((a) => a.accepted)).toEqual([
    '450',
    '225',
  ]);
  const treasure = xpTestReward(xpCampaign(), 'sale', 'treasure');
  if (treasure.input.category === 'treasure')
    treasure.input = {
      ...treasure.input,
      disposition: 'sell',
      proceeds: '100',
    };
  expect(resolveXpReward(treasure).raw).toBe('100');
  if (treasure.input.category === 'treasure')
    treasure.input.disposition = 'defer';
  expect(() => resolveXpReward(treasure)).toThrow('pending');
});
test('profile edits, custody changes, labels and continuation do not rewrite accepted awards or pending state', () => {
  const original = confirmed();
  let doc = saveXpReward(original, pendingFungus(original));
  doc = {
    ...doc,
    sessions: doc.sessions.map((s) => ({ ...s, label: 'Renamed' })),
    party: doc.party
      ? {
          ...doc.party,
          profiles: doc.party.profiles.map((p) => ({
            ...p,
            baseLevel: 9,
            reference: p.reference
              ? {
                  ...p.reference,
                  bonuses: { ...p.reference.bonuses, xpPercent: 0 },
                }
              : undefined,
          })),
        }
      : undefined,
  };
  const next = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'session-2',
    sourceFingerprint: sessionFingerprint(doc, 'session-2'),
    destinationId: 'session-3',
    label: 'Later',
    combats: [],
    inventory: null,
    copyNotes: false,
    partyCharacterIds: xpTestIds,
    capturedAt: xpAt,
  });
  expect(sessionXpBalances(next, required(xpTestIds[0]), 'session-3')).toEqual({
    opening: 507,
    closing: 507,
  });
  expect(xpLedger(next).events).toEqual(xpLedger(original).events);
  expect(rewardSettlement(next, 'later-fungus')).toBeUndefined();
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
});
test('corrections retain originals, reject stale previews/retries and atomically review later dependent balances', () => {
  let doc = confirmed();
  const later = xpTestReward(doc, 'later-cash', 'money');
  later.origin = { sessionId: 'session-2', phase: 'end', order: 0 };
  if (later.input.category === 'money') later.input.gp = '50';
  doc = saveXpReward(doc, later);
  doc = saveXpPoint(doc, {
    ...newXpPoint(doc, 'session-2', 'later-point'),
    label: 'Later award',
  });
  doc = selectXpRewards(doc, 'later-point', [later.id]);
  let preview = previewXpAward(doc, 'later-point');
  doc = confirmXpAward(
    doc,
    'later-point',
    preview.fingerprint,
    'later-confirmed',
    xpAt
  );
  const before = doc;
  doc = beginXpCorrection(doc, 'refuge-confirmed', 'correct-refuge');
  const point = required(
    xpLedger(doc).points.find((p) => p.id === 'correct-refuge')
  );
  doc = saveXpPoint(doc, {
    ...point,
    correctionReason: 'Synthetic historical correction',
  });
  const reward = required(point.rewardOverrides.find((r) => r.id === 'money'));
  if (reward.input.category !== 'money') throw Error('Fixture');
  doc = saveXpReward(
    doc,
    {
      ...reward,
      version: reward.version + 1,
      input: { category: 'money', gp: '725' },
    },
    point.id
  );
  preview = previewXpAward(doc, point.id);
  expect(preview.rows[0]?.award).toBe(518);
  expect(preview.later[0]?.rows[0]?.after).toBe(529);
  expect(() =>
    confirmXpAward(
      doc,
      point.id,
      preview.fingerprint,
      'correction-confirmed',
      xpAt
    )
  ).toThrow('later balances');
  const changed = confirmXpAward(
    doc,
    point.id,
    preview.fingerprint,
    'correction-confirmed',
    xpAt,
    true
  );
  expect(xpLedger(changed).events.slice(0, 2)).toEqual(xpLedger(before).events);
  expect(activeXpEvents(xpLedger(changed).events)).toHaveLength(2);
  expect(
    sessionXpBalances(changed, required(xpTestIds[0]), 'session-2').closing
  ).toBe(529);
  expect(parseCampaign(serializeCampaign(changed))).toEqual(changed);
  expect(() => validateHistoryTransition(before, changed, '')).not.toThrow();
  const tampered: CampaignDocument = JSON.parse(JSON.stringify(changed));
  required(tampered.xp).events[0] = required(required(tampered.xp).events[1]);
  expect(() => validateHistoryTransition(changed, tampered, '')).toThrow(
    'immutable'
  );
  const stale = xpCastleDraft(),
    snapshot = previewXpAward(stale, 'refuge-point');
  const edited = saveXpPoint(stale, {
    ...required(xpLedger(stale).points[0]),
    label: 'Changed',
  });
  expect(() =>
    confirmXpAward(edited, 'refuge-point', snapshot.fingerprint, 'stale', xpAt)
  ).toThrow('changed');
  expect(() =>
    saveXpOpening(before, {
      id: 'new',
      characterId: required(xpTestIds[0]),
      sessionId: 'session-1',
      balance: 12,
      reason: 'no',
    })
  ).toThrow('fixed');
});
test('migration creates no rewards or balances, and confirms invalid confirmed calculations cannot reach disk', () => {
  const doc = parseCampaign(JSON.stringify(baseline));
  expect(doc.schemaVersion).toBe(18);
  expect(doc.xp).toBeUndefined();
  expect(doc.records).toEqual(baseline.records);
  const tampered = confirmed();
  required(required(tampered.xp).events[0]).rows[0] = {
    ...required(required(required(tampered.xp).events[0]).rows[0]),
    award: 999,
  };
  expect(() => parseCampaign(JSON.stringify(tampered))).toThrow('inconsistent');
});

test('missing starting HP can be explicitly overridden without erasing the independent difficulty proposal', () => {
  const reward = xpTestReward(xpCampaign(), 'missing-hp', 'monster', false);
  if (reward.input.category !== 'monster') throw Error('Fixture');
  required(reward.input.monsters[0]).startingHp = null;
  reward.rawOverride = {
    amount: '129',
    reason: 'Recorded historical total with unavailable individual starting HP',
  };
  expect(resolveXpReward(reward)).toMatchObject({
    calculatedRaw: null,
    raw: '129',
    difficulty: '17/2',
    proposedRatio: '1',
    ratio: '1',
  });
});
test('a second point cannot select a settled reward, and confirmed history cannot be cleared through a title/notes save', () => {
  let doc = confirmed();
  doc = saveXpPoint(doc, newXpPoint(doc, 'session-2', 'duplicate-point'));
  doc = selectXpRewards(doc, 'duplicate-point', ['raiders']);
  expect(() => previewXpAward(doc, 'duplicate-point')).toThrow(
    'already awarded'
  );
  const removed = { ...doc, xp: undefined };
  expect(() => validateHistoryTransition(doc, removed, '')).toThrow(
    'immutable'
  );
});

test('a secured XP event needs no reviewed-checkbox flag to be awarded', () => {
  const draft = xpCastleDraft();
  for (const reward of draft.xp?.rewards || []) delete reward.reviewed;
  const preview = previewXpAward(draft, 'refuge-point');
  expect(preview.rows.map((r) => r.award)).toEqual([507, 507, 507, 461, 507]);
  const confirmed = confirmXpAward(
    draft,
    'refuge-point',
    preview.fingerprint,
    'without-checkbox',
    xpAt
  );
  expect(parseCampaign(serializeCampaign(confirmed))).toEqual(confirmed);
});

test('recorded events need no recovery decision and legacy flags remain inert', () => {
  const doc = xpCastleDraft();
  const reward = doc.xp?.rewards.find((r) => r.id === 'raiders');
  if (!reward) throw Error('Fixture');
  for (const r of doc.xp?.rewards || []) r.eligibility = 'pending';
  const preview = previewXpAward(doc, 'refuge-point');
  expect(preview.rows.map((r) => r.award)).toEqual([507, 507, 507, 461, 507]);
  expect(
    parseCampaign(
      serializeCampaign(
        confirmXpAward(
          doc,
          'refuge-point',
          preview.fingerprint,
          'no-monster-gate',
          xpAt
        )
      )
    )
  ).toBeDefined();
  reward.eligibility = 'excluded';
  expect(previewXpAward(doc, 'refuge-point').rows.map((r) => r.award)).toEqual([
    507, 507, 507, 461, 507,
  ]);
});

test('deleting an unawarded mistake removes draft references, invalidates a preview and preserves accepted history', () => {
  let doc = confirmed();
  const original = doc.xp?.events;
  doc = saveXpReward(doc, pendingFungus(doc));
  const later = newXpPoint(doc, 'session-2', 'later-award');
  later.label = 'Later award';
  doc = saveXpPoint(doc, later);
  doc = selectXpRewards(doc, later.id, ['later-fungus']);
  const preview = previewXpAward(doc, later.id);
  expect(() => deleteXpReward(doc, 'later-fungus', 99)).toThrow('changed');
  const next = deleteXpReward(doc, 'later-fungus', 1);
  expect(next.xp?.rewards.some((r) => r.id === 'later-fungus')).toBe(false);
  expect(next.xp?.timeline?.['session-2']).not.toContain('later-fungus');
  expect(next.xp?.points.find((p) => p.id === later.id)).toMatchObject({
    rewardIds: [],
    rewardOverrides: [],
    bonuses: [],
  });
  expect(next.xp?.events).toEqual(original);
  expect(() =>
    confirmXpAward(next, later.id, preview.fingerprint, 'stale-deleted', xpAt)
  ).toThrow();
  validateHistoryTransition(doc, next, '');
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
  expect(() => deleteXpReward(next, 'raiders', 1)).toThrow('cannot be deleted');
});

test('money defaults to full XP for older unset drafts and retains an explicit reduction', () => {
  const doc = xpCastleDraft();
  const money = required(doc.xp?.rewards.find((r) => r.id === 'money'));
  money.ratio.proposed = null;
  money.eligibility = 'pending';
  expect(resolveXpReward(money).ratio).toBe('1');
  expect(resolveXpReward(money).allocations.map((a) => a.accepted)).toEqual([
    '135',
    '135',
    '135',
    '135',
    '135',
  ]);
  money.ratio.override = '1/2';
  money.ratio.reason = 'DM reduction';
  expect(resolveXpReward(money).ratio).toBe('1/2');
  const accepted = confirmed();
  expect(parseCampaign(serializeCampaign(accepted)).xp?.events).toEqual(
    accepted.xp?.events
  );
});

test('sale value prefers a recorded sale amount, falls back to a legacy GP value and preserves explicit zero', () => {
  const doc = xpCastleDraft();
  const reward = required(doc.xp?.rewards.find((r) => r.id === 'scroll'));
  if (reward.input.category !== 'treasure') throw Error('Fixture');
  reward.input.disposition = 'sell';
  expect(resolveXpReward(reward).raw).toBe('7500');
  reward.input.proceeds = '6000';
  expect(resolveXpReward(reward).raw).toBe('6000');
  reward.input.proceeds = '0';
  expect(resolveXpReward(reward).raw).toBe('0');
  reward.input.proceeds = null;
  reward.input.marketGp = null;
  expect(() => resolveXpReward(reward)).toThrow('sale value');
  reward.input.disposition = 'keep';
  expect(resolveXpReward(reward).raw).toBe('1500');
});

test('accepted treasure override snapshots retain their original ratio proposal when round-tripped', () => {
  const doc = xpCastleDraft();
  const scroll = required(doc.xp?.rewards.find((r) => r.id === 'scroll'));
  scroll.ratio.proposed = null;
  scroll.ratio.override = '1';
  scroll.ratio.reason = 'Recorded DM decision';
  const accepted = confirmed(doc);
  expect(accepted.xp?.events[0]?.resolutions[2]).toMatchObject({
    proposedRatio: null,
    ratio: '1',
  });
  expect(parseCampaign(serializeCampaign(accepted)).xp?.events).toEqual(
    accepted.xp?.events
  );
});
