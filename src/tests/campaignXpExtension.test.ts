import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import type { CampaignDocument } from '../helpers/campaignDocument';
import {
  beginXpCorrection,
  confirmXpAward,
  confirmXpExtension,
  historicalXpReward,
  newXpPoint,
  previewXpAward,
  previewXpExtension,
  rewardSettlement,
  saveXpOpening,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
  sessionXpBalances,
  xpLedger,
  xpRewardFitsAward,
} from '../helpers/campaignXp';
import {
  placeHistoricalSession,
  reorderCampaignSession,
} from '../helpers/campaignSessionOrder';
import {
  acceptExtension,
  backfillSession,
  extensionBaseline,
  extensionDrafts,
  firstRequest,
  secondExtensionDraft,
  secondRequest,
} from './fixtures/xpExtensionCampaign';
import { xpAt } from './fixtures/xpCampaign';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing synthetic fixture value.');
  return value;
}

const reopen = (doc: CampaignDocument) => parseCampaign(serializeCampaign(doc));
const balances = (
  doc: CampaignDocument,
  sessionId: string,
  field: 'opening' | 'closing'
) =>
  ['amber', 'birch', 'cedar'].map(
    (id) => sessionXpBalances(doc, id, sessionId)[field]
  );

test('reconcile cap-aware drafts twice without rewriting any later history', () => {
  const original = extensionBaseline();
  const initial = extensionDrafts();
  validateHistoryTransition(original, initial, '');
  expect(initial.sessions.slice(2)).toEqual(original.sessions);
  const draft = reopen(initial);
  expect(
    xpLedger(draft).points.filter((p) => !p.confirmedEventId)
  ).toHaveLength(2);
  expect(balances(draft, 's70', 'closing')).toEqual([null, null, null]);
  expect(balances(draft, 's90', 'closing')).toEqual([10500, 8200, 77]);
  expect(xpLedger(draft).events).toEqual(xpLedger(original).events);
  const preview = previewXpExtension(draft, firstRequest);
  expect(
    preview.rows.map((r) => [r.applied, r.reconstructed, r.difference])
  ).toEqual([
    [4000, 10000, 0],
    [3000, 8000, 0],
  ]);
  expect(preview.awards[0]?.rows[0]).toMatchObject({
    award: 1500,
    fullAward: 1800,
    discarded: 300,
    after: 7500,
  });
  const confirmed = confirmXpExtension(
    draft,
    firstRequest,
    preview.fingerprint,
    'backfill-one',
    xpAt
  );
  validateHistoryTransition(draft, confirmed, '');
  expect(
    confirmXpExtension(
      confirmed,
      firstRequest,
      preview.fingerprint,
      'backfill-one',
      xpAt
    )
  ).toBe(confirmed);
  const first = reopen(confirmed);
  expect(balances(first, 's85', 'opening')).toEqual([10000, 8000, null]);
  expect(balances(first, 's90', 'closing')).toEqual([10500, 8200, 77]);
  expect(xpLedger(first).events[0]).toEqual(xpLedger(original).events[0]);
  expect(xpLedger(first).openings[2]).toEqual(xpLedger(original).openings[2]);
  expect(rewardSettlement(first, 'First backfill award-coins')?.id).toBe(
    'backfill-one-award-0'
  );
  const secondDraft = reopen(secondExtensionDraft(first));
  const second = acceptExtension(secondDraft, secondRequest, 'backfill-two');
  validateHistoryTransition(secondDraft, second, '');
  const final = reopen(second);
  expect(balances(final, 's50', 'opening')).toEqual([4000, 3000, null]);
  expect(balances(final, 's70', 'opening')).toEqual([6000, 5000, null]);
  expect(balances(final, 's85', 'opening')).toEqual([10000, 8000, null]);
  expect(balances(final, 's90', 'closing')).toEqual([10500, 8200, 77]);
  expect(xpLedger(final).events.slice(0, 3)).toEqual(xpLedger(first).events);
  expect(
    xpLedger(final).extensions?.map((x) => x.openings[0]?.previous.sessionId)
  ).toEqual(['s85', 's70']);
});

test('unknowns, signed mismatches, changed inputs and forgery leave the baseline intact', () => {
  const draft = extensionDrafts();
  const mismatch = {
    ...firstRequest,
    openings: firstRequest.openings.map((o) =>
      o.characterId === 'amber' ? { ...o, balance: 5999 } : o
    ),
  };
  const review = previewXpExtension(draft, mismatch);
  // The fixed cap still tops the character up to 7500, so use an uncapped draft
  // to verify a one-point mismatch independent of the cap.
  expect(review.rows[0]?.difference).toBe(0);
  const noCap = extensionDrafts(false);
  const point = required(
    xpLedger(draft).points.find((p) => p.id === 'First backfill award')
  );
  const minusOne = previewXpExtension(noCap, mismatch);
  expect(minusOne.rows[0]?.difference).toBe(-1);
  expect(() =>
    confirmXpExtension(noCap, mismatch, minusOne.fingerprint, 'bad', xpAt)
  ).toThrow('match');
  const unknown = { ...firstRequest, openings: firstRequest.openings.slice(1) };
  expect(previewXpExtension(draft, unknown).rows[0]?.difference).toBeNull();
  const good = previewXpExtension(draft, firstRequest);
  const changed = saveXpPoint(draft, {
    ...point,
    label: 'Edited after review',
  });
  expect(() =>
    confirmXpExtension(changed, firstRequest, good.fingerprint, 'stale', xpAt)
  ).toThrow('fresh');
  expect(() =>
    saveXpOpening(draft, {
      ...required(xpLedger(draft).openings[0]),
      balance: 6000,
    })
  ).toThrow('fixed');
  expect(balances(reopen(draft), 's90', 'closing')).toEqual([10500, 8200, 77]);
  const accepted = acceptExtension(draft, firstRequest, 'accepted');
  const corrupt = JSON.parse(serializeCampaign(accepted));
  corrupt.xp.extensions[0].openings[0].applied += 1;
  expect(() => parseCampaign(JSON.stringify(corrupt))).toThrow(
    'reconciliation'
  );
  const rewritten = {
    ...accepted,
    xp: {
      ...xpLedger(accepted),
      events: xpLedger(accepted).events.map((e, i) =>
        i === 0 ? { ...e, confirmedAt: '2026-11-08T12:00:00.000Z' } : e
      ),
    },
  };
  expect(() =>
    validateHistoryTransition(draft, rewritten, 'xp-extension')
  ).toThrow('immutable');
});

test('historical entries cannot leak into ordinary awards, even after moving the opening earlier', () => {
  let draft = extensionDrafts();
  const first = required(
    xpLedger(draft).rewards.find((r) => r.id === 'First backfill award-coins')
  );
  const leftover = {
    ...first,
    id: 'leftover',
    title: 'Unselected historical coins',
  };
  draft = saveXpReward(draft, leftover);
  const point = newXpPoint(draft, 's90', 'ordinary');
  draft = saveXpPoint(draft, point);
  expect(historicalXpReward(draft, first)).toBe(true);
  expect(xpRewardFitsAward(draft, point, first)).toBe(false);
  expect(() => previewXpAward(draft, 'First backfill award')).toThrow(
    'Historical drafts'
  );
  draft = selectXpRewards(draft, point.id, [first.id]);
  expect(() => previewXpAward(draft, point.id)).toThrow('Historical drafts');
  const accepted = acceptExtension(draft, firstRequest, 'recorded');
  expect(historicalXpReward(accepted, leftover)).toBe(true);
  expect(xpRewardFitsAward(accepted, point, leftover)).toBe(false);
  expect(() =>
    saveXpReward(accepted, { ...first, title: 'Renamed settled source' })
  ).toThrow();
  const correction = beginXpCorrection(accepted, 'later-event', 'fix-later');
  const later = required(
    xpLedger(correction).points.find((p) => p.id === 'fix-later')
  );
  const reviewed = saveXpPoint(correction, {
    ...later,
    correctionReason: 'Fix later recorded amount',
    bonuses: later.bonuses.map((b) =>
      b.characterId === 'amber'
        ? { ...b, finalOverride: 501, finalReason: 'Synthetic correction' }
        : b
    ),
  });
  const attempted = selectXpRewards(reviewed, later.id, [
    ...later.rewardIds,
    leftover.id,
  ]);
  expect(() => previewXpAward(attempted, later.id)).toThrow(
    'Historical drafts'
  );
  const next = confirmXpAward(
    reviewed,
    later.id,
    previewXpAward(reviewed, later.id).fingerprint,
    'fixed-later',
    xpAt
  );
  validateHistoryTransition(reviewed, next, '');
  expect(balances(reopen(next), 's90', 'closing')).toEqual([10501, 8200, 77]);
});

test('per-character cutoffs and safe moves preserve unrelated sessions and balances', () => {
  const original = extensionDrafts();
  const extra = { id: 's60', label: 'Session 60', notes: 'Already entered' };
  const appended = { ...original, sessions: [...original.sessions, extra] };
  const moved = placeHistoricalSession(appended, 's70', extra);
  validateHistoryTransition(appended, moved, '');
  expect(moved.sessions).toEqual([extra, ...original.sessions]);
  expect(() =>
    placeHistoricalSession(moved, 's70', required(moved.sessions.at(-1)))
  ).toThrow();
  expect(() => reorderCampaignSession(moved, 's90', 's85')).toThrow('fixed');
  const mixed = {
    ...firstRequest,
    openings: firstRequest.openings.map((o) =>
      o.characterId === 'birch' ? { ...o, sessionId: 's60' } : o
    ),
  };
  const accepted = acceptExtension(moved, mixed, 'mixed');
  validateHistoryTransition(moved, accepted, '');
  expect(balances(reopen(accepted), 's60', 'opening')).toEqual([
    null,
    5000,
    null,
  ]);
  expect(balances(accepted, 's90', 'closing')).toEqual([10500, 8200, 77]);
  const reordering = {
    ...moved,
    sessions: [
      required(moved.sessions[1]),
      required(moved.sessions[0]),
      ...moved.sessions.slice(2),
    ],
  };
  expect(() => validateHistoryTransition(moved, reordering, '')).toThrow(
    'chronology'
  );
  expect(
    backfillSession(extensionBaseline(), 72, 85).sessions.map((s) => s.id)
  ).toEqual(['s72', 's85', 's90']);
});

test('backward extension settles two recipients of one event at separate historical awards', () => {
  let doc = extensionDrafts();
  const first = required(
    xpLedger(doc).points.find((p) => p.id === 'First backfill award')
  );
  const rewardId = required(first.rewardIds[0]);
  doc = saveXpPoint(doc, {
    ...first,
    settlements: [
      { rewardId, characterId: 'birch', decision: 'later', reason: '' },
    ],
  });
  const second = required(
    xpLedger(doc).points.find((p) => p.id === 'Second backfill award')
  );
  doc = selectXpRewards(doc, second.id, [...second.rewardIds, rewardId]);
  const preview = previewXpExtension(doc, firstRequest);
  expect(preview.awards[0]?.rows.map((r) => r.characterId)).toEqual(['amber']);
  expect(
    preview.awards[1]?.rows.find((r) => r.characterId === 'birch')?.award
  ).toBe(3000);
  const accepted = confirmXpExtension(
    doc,
    firstRequest,
    preview.fingerprint,
    'split-extension',
    xpAt
  );
  validateHistoryTransition(doc, accepted, '');
  expect(balances(reopen(accepted), 's90', 'closing')).toEqual([
    10500, 8200, 77,
  ]);
  expect(rewardSettlement(accepted, rewardId)).toBeDefined();
});
