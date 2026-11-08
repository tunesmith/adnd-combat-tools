import replay from './fixtures/xpSyntheticReplay.json';
import { xpCampaign, xpTestReward, xpAt } from './fixtures/xpCampaign';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  saveXpReward,
  saveXpPoint,
  newXpPoint,
  selectXpRewards,
  previewXpAward,
  confirmXpAward,
  xpLedger,
  sessionXpBalances,
} from '../helpers/campaignXp';
import {
  moveXpTimelineEntry,
  xpTimelineEntries,
} from '../helpers/campaignXpTimeline';
test('old XP ordering migrates into a shared list without rewriting accepted data or balances', () => {
  const doc = parseCampaign(JSON.stringify(replay.confirmed));
  expect(doc.schemaVersion).toBe(12);
  expect(doc.xp?.version).toBe(2);
  expect(xpTimelineEntries(doc, 'session-1').map((e) => e.id)).toEqual([
    'raiders',
    'money',
    'scroll',
  ]);
  expect(xpTimelineEntries(doc, 'session-2').map((e) => e.id)).toEqual([
    'refuge-point',
    'later-fungus',
  ]);
  expect(doc.xp?.events).toEqual(replay.confirmed.xp.events);
  expect(doc.xp?.rewards).toEqual(replay.confirmed.xp.rewards);
  expect(sessionXpBalances(doc, 'xp-mira', 'session-1')).toEqual({
    opening: 0,
    closing: 0,
  });
  expect(sessionXpBalances(doc, 'xp-mira', 'session-2')).toEqual({
    opening: 0,
    closing: 507,
  });
  expect(() =>
    moveXpTimelineEntry(doc, 'session-2', 'refuge-point', 1)
  ).toThrow('Confirmed');
  const invalid = JSON.parse(JSON.stringify(doc)) as typeof doc;
  if (!invalid.xp?.timeline) throw Error('Fixture');
  invalid.xp.timeline['session-2'] = ['refuge-point', 'refuge-point'];
  expect(() => parseCampaign(JSON.stringify(invalid))).toThrow('duplicate');
});
test('list position controls the award cutoff independently of legacy phase/order fields', () => {
  let doc = xpCampaign();
  const reward = xpTestReward(doc, 'ordered-money', 'money');
  reward.origin = { sessionId: 'session-2', phase: 'end', order: 9999 };
  doc = saveXpReward(doc, reward);
  const point = newXpPoint(doc, 'session-2', 'ordered-award');
  doc = saveXpPoint(doc, point);
  doc = selectXpRewards(doc, point.id, [reward.id]);
  expect(previewXpAward(doc, point.id).rows[0]?.award).toBe(149);
  const late = moveXpTimelineEntry(doc, 'session-2', reward.id, 1);
  expect(() => previewXpAward(late, point.id)).toThrow('after');
  expect(late.xp?.rewards[0]?.origin).toEqual(reward.origin);
  const restored = moveXpTimelineEntry(late, 'session-2', reward.id, -1);
  const confirmed = confirmXpAward(
    restored,
    point.id,
    previewXpAward(restored, point.id).fingerprint,
    'ordered-confirmed',
    xpAt
  );
  expect(parseCampaign(serializeCampaign(confirmed))).toEqual(confirmed);
  expect(() =>
    validateHistoryTransition(restored, confirmed, '')
  ).not.toThrow();
  expect(() =>
    moveXpTimelineEntry(confirmed, 'session-2', reward.id, 1)
  ).toThrow('Confirmed');
  const changed = {
    ...confirmed,
    xp: {
      ...xpLedger(confirmed),
      timeline: {
        ...confirmed.xp?.timeline,
        'session-2': [point.id, reward.id],
      },
    },
  };
  expect(() => validateHistoryTransition(confirmed, changed, '')).toThrow(
    'immutable'
  );
});

test('a timeline change requires a fresh preview even when the selected award totals are unchanged', () => {
  const old = parseCampaign(JSON.stringify(replay.confirmed));
  const xp = old.xp;
  if (!xp) throw Error('Fixture');
  // An unconfirmed copy of the accepted setup, retaining its ordered events.
  const doc = {
    ...old,
    xp: {
      ...xp,
      events: [],
      points: xp.points.map((p) => ({ ...p, confirmedEventId: null })),
    },
  };
  const preview = previewXpAward(doc, 'refuge-point');
  const moved = moveXpTimelineEntry(doc, 'session-2', 'later-fungus', -1);
  expect(previewXpAward(moved, 'refuge-point').rows).toEqual(preview.rows);
  expect(() =>
    confirmXpAward(
      moved,
      'refuge-point',
      preview.fingerprint,
      'stale-order',
      xpAt
    )
  ).toThrow('changed');
});
