import {
  createFeedSnapshot,
  resolvePendingPreview,
  listPendingPreviewTargets,
} from './uiPreviewHarness';

describe('dungeon feed toggling confidence', () => {
  it('reduces pending count as registry resolutions complete a passage chain', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 12,
      dungeonLevel: 1,
      detailMode: true,
    });
    expect(feed.pendingCount).toBeGreaterThan(0);

    feed = resolvePendingPreview(feed, 'passageTurns', 1);
    expect(feed.pendingCount).toBeGreaterThan(0);

    feed = resolvePendingPreview(feed, 'passageWidth', 19);
    expect(feed.pendingCount).toBeGreaterThan(0);

    feed = resolvePendingPreview(feed, 'specialPassage', 20);
    expect(feed.pendingCount).toBeGreaterThan(0);

    feed = resolvePendingPreview(feed, 'chasmDepth', 6);
    expect(feed.pendingCount).toBeGreaterThan(0);

    feed = resolvePendingPreview(feed, 'chasmConstruction', 1);
    expect(feed.pendingCount).toBe(0);
    expect(listPendingPreviewTargets(feed)).toHaveLength(0);
  });

  it('reports pending previews for unresolved passage outcomes', () => {
    const snapshot = createFeedSnapshot({
      action: 'passage',
      roll: 12,
      detailMode: true,
      dungeonLevel: 1,
    });
    expect(listPendingPreviewTargets(snapshot)).toHaveLength(snapshot.pendingCount);
  });
});
