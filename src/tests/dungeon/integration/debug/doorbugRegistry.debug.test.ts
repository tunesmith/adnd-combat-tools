import {
  createFeedSnapshot,
  renderDetail,
} from '../../../support/dungeon/uiPreviewHarness';
import {
  resolveViaRegistry,
  type FeedLike,
} from '../../../../dungeon/helpers/registry';
import type { DungeonTablePreview } from '../../../../types/dungeon';

describe.skip('door location registry resolution', () => {
  it('marks normalized preview keys as collapsed/resolved', () => {
    const feed = createFeedSnapshot({
      action: 'passage',
      roll: 3,
      detailMode: true,
    });
    const preview = renderDetail(feed).find(
      (node): node is DungeonTablePreview =>
        node.kind === 'table-preview' && node.title === 'Door Location'
    );
    if (!preview) {
      throw new Error('Door Location preview missing for initial roll');
    }

    let collapsed: Record<string, boolean> = {};
    let resolved: Record<string, boolean> = {};
    let feedState: FeedLike[] = [
      {
        id: feed.id,
        messages: feed.messages,
        outcome: feed.outcome,
        renderCache: feed.renderCache,
        pendingCount: feed.pendingCount,
      },
    ];

    const handled = resolveViaRegistry(
      preview,
      feed.id,
      13,
      (updater) => {
        feedState =
          typeof updater === 'function' ? updater(feedState) : updater;
        return feedState;
      },
      (updater) => {
        collapsed =
          typeof updater === 'function' ? updater(collapsed) : updater;
        return collapsed;
      },
      (updater) => {
        resolved = typeof updater === 'function' ? updater(resolved) : updater;
        return resolved;
      }
    );

    expect(handled).toBe(true);
    // Accept either normalized or sequence-suffixed keys, depending on renderer.
    const kNorm = `${feed.id}:root.periodicCheck.0.doorLocation`;
    const kSeq = `${feed.id}:root.periodicCheck.0.doorLocation:0`;
    expect(collapsed[kNorm] || collapsed[kSeq]).toBe(true);
    expect(resolved[kNorm] || resolved[kSeq]).toBe(true);
  });
});
