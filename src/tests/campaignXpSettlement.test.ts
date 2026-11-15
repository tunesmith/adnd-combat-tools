import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  beginXpCorrection,
  confirmXpAward,
  newXpPoint,
  pointRewards,
  previewXpAward,
  recipientSettlement,
  resolveXpReward,
  rewardSettlement,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
  stageXpAward,
  xpBalance,
} from '../helpers/campaignXp';
import {
  xpAt,
  xpCastleDraft,
  pendingFungus,
  xpTestIds,
} from './fixtures/xpCampaign';
import type { CampaignDocument } from '../helpers/campaignDocument';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw Error('Missing fixture');
  return value;
}
function confirm(doc: CampaignDocument, id: string) {
  const preview = previewXpAward(doc, id);
  const next = confirmXpAward(
    doc,
    id,
    preview.fingerprint,
    `${id}-confirmed`,
    xpAt,
    true
  );
  validateHistoryTransition(doc, next, '');
  return parseCampaign(serializeCampaign(next));
}
function fixture() {
  let doc = confirm(xpCastleDraft(), 'refuge-point');
  doc.sessions.push(
    { id: 'day3', label: 'Day3', notes: '' },
    { id: 'day5', label: 'Day5', notes: '' }
  );
  const names = ['Reatha', 'Stan', 'Vitameno', 'Chocolato', 'Imunoanne'];
  if (!doc.party) throw Error('Missing party');
  doc.party.roster.forEach((c) => {
    const i = xpTestIds.indexOf(c.id);
    if (i >= 0) c.name = names[i] || c.name;
  });
  doc.party.profiles.push(
    ...doc.party.profiles
      .filter(
        (p) => p.sessionId === 'session-2' && p.characterId !== xpTestIds[1]
      )
      .flatMap((p) =>
        ['day3', 'day5'].map((sessionId) => ({ ...p, sessionId }))
      )
  );
  doc = saveXpReward(doc, pendingFungus(doc));
  doc = saveXpPoint(doc, newXpPoint(doc, 'day3', 'day3-award'));
  doc = selectXpRewards(doc, 'day3-award', ['later-fungus']);
  const point = required(
    required(doc.xp).points.find((p) => p.id === 'day3-award')
  );
  doc = saveXpPoint(doc, {
    ...point,
    settlements: [
      {
        rewardId: 'later-fungus',
        characterId: required(xpTestIds[1]),
        decision: 'forfeit',
        reason: 'Lost share',
      },
      {
        rewardId: 'later-fungus',
        characterId: required(xpTestIds[2]),
        decision: 'later',
        reason: '',
      },
    ],
  });
  return doc;
}
test('shrieker whole shares settle on Day3 and Day5 without redistribution or duplicate claims', () => {
  const draft = fixture();
  const source = required(
    required(draft.xp).rewards.find((r) => r.id === 'later-fungus')
  );
  expect(resolveXpReward(source).allocations.map((a) => a.accepted)).toEqual([
    '23',
    '23',
    '23',
    '23',
  ]);
  const preview = previewXpAward(draft, 'day3-award');
  expect(preview.rows.map((r) => [r.name, r.award, r.after])).toEqual([
    ['Reatha', 25, 532],
    ['Chocolato', 23, 484],
  ]);
  expect(
    recipientSettlement(draft, source.id, required(xpTestIds[1]))
  ).toBeUndefined(); // preview/cancel is provisional
  let doc = confirm(draft, 'day3-award');
  expect(required(doc.xp).rewards.find((r) => r.id === source.id)).toEqual(
    source
  );
  expect(rewardSettlement(doc, source.id)).toBeUndefined();
  expect(
    recipientSettlement(doc, source.id, required(xpTestIds[1]))
  ).toBeDefined();
  expect(
    recipientSettlement(doc, source.id, required(xpTestIds[2]))
  ).toBeUndefined();
  doc = saveXpPoint(doc, newXpPoint(doc, 'day5', 'day5-award'));
  doc = selectXpRewards(doc, 'day5-award', [source.id]);
  const later = previewXpAward(doc, 'day5-award');
  expect(later.rows.map((r) => [r.name, r.base, r.award, r.after])).toEqual([
    ['Vitameno', '23', 25, 532],
  ]);
  doc = confirm(doc, 'day5-award');
  expect(rewardSettlement(doc, source.id)).toBeDefined();
  expect(
    confirmXpAward(
      doc,
      'day5-award',
      later.fingerprint,
      'day5-award-confirmed',
      xpAt
    )
  ).toBe(doc);
  expect(
    xpBalance(doc, required(xpTestIds[1]), {
      sessionId: 'day5',
      phase: 'end',
      order: 9999,
    })
  ).toBe(507);
  expect(required(required(doc.xp).events[0]).rows.map((r) => r.after)).toEqual(
    [507, 507, 507, 461, 507]
  );
  let correction = beginXpCorrection(doc, 'day3-award-confirmed', 'correction');
  const point = required(
    required(correction.xp).points.find((p) => p.id === 'correction')
  );
  correction = saveXpPoint(correction, {
    ...point,
    label: 'Reviewed forfeiture',
    settlements: point.settlements?.map((s) => ({
      ...s,
      reason: s.decision === 'forfeit' ? 'Confirmed ruling' : s.reason,
    })),
  });
  expect(previewXpAward(correction, 'correction').later).toEqual([]);
  const corrected = confirm(correction, 'correction');
  expect(corrected.xp?.events).toHaveLength((doc.xp?.events.length ?? 0) + 1);
  expect(
    recipientSettlement(corrected, source.id, required(xpTestIds[2]))?.id
  ).toBe('day5-award-confirmed');
  expect(
    xpBalance(corrected, required(xpTestIds[2]), {
      sessionId: 'day5',
      phase: 'end',
      order: 9999,
    })
  ).toBe(532);
  expect(pointRewards(corrected, point)[0]).toEqual(source);
});
test('a forfeiture-only award needs neither a profile nor bonus/cap review', () => {
  let doc = fixture();
  const point = required(
    required(doc.xp).points.find((p) => p.id === 'day3-award')
  );
  doc = saveXpPoint(doc, {
    ...point,
    settlements: xpTestIds.slice(0, 4).map((characterId) => ({
      rewardId: 'later-fungus',
      characterId,
      decision: 'forfeit',
      reason: '',
    })),
    bonuses: [],
  });
  expect(previewXpAward(doc, point.id).rows).toEqual([]);
  expect(
    rewardSettlement(confirm(doc, point.id), 'later-fungus')
  ).toBeDefined();
});
test('settled treasure cannot change disposition in a subsequent payment draft', () => {
  const doc = fixture();
  expect(() =>
    stageXpAward(
      doc,
      { ...newXpPoint(doc, 'day3', 'bad'), rewardIds: ['scroll'] },
      { scroll: 'sell' }
    )
  ).toThrow('frozen');
});

test('absent recipient can be paid using explicitly reviewed bonus and cap basis', () => {
  let doc = fixture();
  const point = required(
    required(doc.xp).points.find((p) => p.id === 'day3-award')
  );
  doc = saveXpPoint(doc, {
    ...point,
    settlements: xpTestIds.slice(0, 4).map((characterId) => ({
      rewardId: 'later-fungus',
      characterId,
      decision: characterId === xpTestIds[1] ? 'award' : 'later',
      reason: '',
    })),
    bonuses: point.bonuses.map((b) => ({ ...b, percent: '10' })),
    caps: [
      {
        characterId: required(xpTestIds[1]),
        basis: {
          characterClass: 'fighter',
          baseLevel: 1,
          mode: 'standard',
          limit: 2001,
          reason: 'Explicit Day3 review',
        },
      },
    ],
  });
  expect(previewXpAward(doc, point.id).rows.map((r) => r.after)).toEqual([532]);
  expect(confirm(doc, point.id).xp?.events.at(-1)?.rows[0]?.name).toBe('Stan');
});

test('retirement automatically forfeits Stan without changing allocations or confirmed XP', () => {
  let doc = fixture();
  if (!doc.party) throw Error('Fixture');
  const stan = required(xpTestIds[1]);
  doc.party.roster = doc.party.roster.map((c) =>
    c.id === stan ? { ...c, lastEligibleSessionId: 'session-2' } : c
  );
  const point = required(
    required(doc.xp).points.find((p) => p.id === 'day3-award')
  );
  // Even an older saved draft cannot award a now-retired recipient.
  doc = saveXpPoint(doc, {
    ...point,
    settlements: [
      {
        rewardId: 'later-fungus',
        characterId: stan,
        decision: 'award',
        reason: '',
      },
      {
        rewardId: 'later-fungus',
        characterId: required(xpTestIds[2]),
        decision: 'later',
        reason: '',
      },
    ],
  });
  const preview = previewXpAward(doc, point.id);
  expect(preview.rows.map((r) => r.after)).toEqual([532, 484]);
  expect(
    preview.point.settlements?.find((s) => s.characterId === stan)?.decision
  ).toBe('forfeit');
  const accepted = confirm(doc, point.id);
  expect(
    xpBalance(accepted, stan, { sessionId: 'day3', phase: 'end', order: 9999 })
  ).toBe(507);
  expect(
    resolveXpReward(
      required(
        required(accepted.xp).rewards.find((r) => r.id === 'later-fungus')
      )
    ).allocations.map((a) => a.accepted)
  ).toEqual(['23', '23', '23', '23']);
});
