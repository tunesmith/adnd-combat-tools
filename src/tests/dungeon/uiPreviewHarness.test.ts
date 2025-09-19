import {
  createFeedSnapshot,
  resolvePendingPreview,
  renderCompact,
  listPendingPreviewTargets,
} from './uiPreviewHarness';

describe('uiPreviewHarness', () => {
  test('resolves door continuation chain without residual pending nodes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 3,
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'doorLocation', 1);
    feed = resolvePendingPreview(feed, 'periodicCheckDoorOnly', 3);
    feed = resolvePendingPreview(feed, 'doorLocation', 4);

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
    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 6);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);

    expect(feed.pendingCount).toBe(1);
    expect(listPendingPreviewTargets(feed)).toHaveLength(1);

    const compactText = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    expect(compactText).toContain(
      'Add 2000 sq. ft. (current total 2,000 sq. ft.) and roll again.'
    );
    expect(compactText).toContain(
      'Add 2000 sq. ft. (current total 4,000 sq. ft.) and roll again.'
    );
    expect(compactText).not.toContain('It is about 4,500 sq. ft.');
  });

  test('chamber unusual size resolves fully when reroll finishes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });
    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 6);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 1);

    expect(feed.pendingCount).toBe(0);
    expect(listPendingPreviewTargets(feed)).toHaveLength(0);

    const compactView = renderCompact(feed);
    const compactText = compactView
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    // expect(compactText).toContain(
    //   'Add 2000 sq. ft. (current total 2,000 sq. ft.) and roll again.'
    // );
    // expect(compactText).toContain(
    //   'Add 2000 sq. ft. (current total 4,000 sq. ft.) and roll again.'
    // );
    expect(compactText).toContain('It is about 4,500 sq. ft.');
    // expect(compactText).toBe(
    //   'The passage opens into a chamber. The chamber has an unusual shape and size. It is triangular. It is about 4,500 sq. ft. Determine exits, contents, and treasure separately.'
    // );
  });
});
