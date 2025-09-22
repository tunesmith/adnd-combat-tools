import {
  createFeedSnapshot,
  resolvePendingPreview,
  listPendingPreviewTargets,
  renderCompact,
  renderDetail,
} from '../../../../support/dungeon/uiPreviewHarness';

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
    expect(listPendingPreviewTargets(snapshot)).toHaveLength(
      snapshot.pendingCount
    );
  });

  it('preserves pending chasm previews when toggling modes mid-resolution', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 12,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'passageTurns', 1);
    feed = resolvePendingPreview(feed, 'passageWidth', 19);
    feed = resolvePendingPreview(feed, 'specialPassage', 20);

    const pendingBefore = listPendingPreviewTargets(feed);
    expect(pendingBefore).toHaveLength(2);
    expect(
      pendingBefore.some((id) => id.endsWith('chasmDepth')) &&
        pendingBefore.some((id) => id.endsWith('chasmConstruction'))
    ).toBe(true);

    const detailParagraphs = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());

    expect(
      detailParagraphs.some((text) =>
        text.includes("A chasm, 20' wide, bisects the passage")
      )
    ).toBe(true);
    expect(detailParagraphs.some((text) => text.includes('The chasm is'))).toBe(
      false
    );
    expect(
      detailParagraphs.some((text) => text.includes('There is a jumping place'))
    ).toBe(false);

    const compactParagraphs = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());

    const compactText = compactParagraphs.join(' ');
    expect(compactText).toContain("A chasm, 20' wide, bisects the passage.");
    expect(compactText).not.toContain('The chasm is');
    expect(compactText).not.toContain('There is a jumping place');

    const detailAfterToggle = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());
    expect(detailAfterToggle).toEqual(detailParagraphs);
    expect(listPendingPreviewTargets(feed)).toEqual(pendingBefore);

    const compactAfterToggle = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ');
    expect(compactAfterToggle).toBe(compactText);
  });

  it('renders jumping place width exactly once after resolving chasm follow-ups', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 12,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'passageTurns', 1);
    feed = resolvePendingPreview(feed, 'passageWidth', 19);
    feed = resolvePendingPreview(feed, 'specialPassage', 20);
    feed = resolvePendingPreview(feed, 'chasmDepth', 2);
    feed = resolvePendingPreview(feed, 'chasmConstruction', 12);
    feed = resolvePendingPreview(feed, 'jumpingPlaceWidth', 2);

    const detailParagraphs = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());

    const jumpingPlaceMentions = detailParagraphs.filter((text) =>
      text.startsWith('There is a jumping place')
    );
    expect(jumpingPlaceMentions).toEqual(['There is a jumping place.']);

    const widthMentions = detailParagraphs.filter((text) =>
      text === "It is 6' wide."
    );
    expect(widthMentions).toHaveLength(1);

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ');

    const jumpingPlaceMatches = compactText.match(/There is a jumping place\./g);
    expect(jumpingPlaceMatches?.length ?? 0).toBe(1);

    const widthMatches = compactText.match(/It is 6' wide\./g);
    expect(widthMatches?.length ?? 0).toBe(1);
  });
});
