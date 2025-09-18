import { createFeedSnapshot, resolvePreview, renderCompact } from './uiPreviewHarness';

describe('uiPreviewHarness', () => {
  test('resolves door continuation chain without residual pending nodes', () => {
    let feed = createFeedSnapshot({ action: 'passage', roll: 3, detailMode: true });

    feed = resolvePreview(feed, 'doorLocation:0', 1);
    feed = resolvePreview(feed, 'periodicCheckDoorOnly:0', 3);
    feed = resolvePreview(feed, 'doorLocation:1', 4);

    expect(feed.pendingCount).toBe(0);
    const compact = renderCompact(feed)
      .filter((n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph')
      .map((n) => n.text.trim());

    expect(compact).toEqual([
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'.",
    ]);
  });
});
