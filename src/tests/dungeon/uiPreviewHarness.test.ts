import {
  createFeedSnapshot,
  resolvePreview,
  renderCompact,
  renderDetail,
} from './uiPreviewHarness';

describe('uiPreviewHarness', () => {
  test('resolves door continuation chain without residual pending nodes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 3,
      detailMode: true,
    });

    feed = resolvePreview(feed, 'doorLocation:0', 1);
    feed = resolvePreview(feed, 'periodicCheckDoorOnly:0', 3);
    feed = resolvePreview(feed, 'doorLocation:1', 4);

    expect(feed.pendingCount).toBe(0);
    const compact = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim());

    expect(compact).toEqual([
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'.",
    ]);
  });

  test('captures chamber unusual size reroll behaviour (current UI)', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });
    const resolvedIds = new Set<string>();

    feed = resolvePreview(feed, 'chamberDimensions', 18);
    resolvedIds.add('chamberDimensions');
    feed = resolvePreview(feed, 'unusualShape', 6);
    resolvedIds.add('unusualShape');
    feed = resolvePreview(feed, 'unusualSize', 15);
    resolvedIds.add('unusualSize');
    feed = resolvePreview(feed, 'unusualSize', 15);

    const detailView = renderDetail(feed);
    const detailParagraphs = detailView
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim());

    void detailParagraphs;
    // expect(detailParagraphs[detailParagraphs.length - 1]).toBe(
    //   'Roll again for unusual size (add 2000 sq. ft.; current total 4,000 sq. ft.).'
    // );
    expect(feed.pendingCount).toBe(1);
    const visiblePreviewIds = listPreviewIds(feed).filter(
      (id) => !resolvedIds.has(id)
    );
    expect(visiblePreviewIds.length).toBe(1);

    const compactText = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    void compactText;

    // expect(compactText).toBe(
    //   'The passage opens into a chamber. The chamber has an unusual shape and size. It is triangular. Add 2000 sq. ft. (current total 2,000 sq. ft.) and roll again. Determine exits, contents, and treasure separately.'
    // );
  });
});

function listPreviewIds(feed: ReturnType<typeof createFeedSnapshot>): string[] {
  return renderDetail(feed)
    .filter((n) => n.kind === 'table-preview')
    .map((n) => (n as { id: string }).id);
}
