import {
  createFeedSnapshot,
  resolvePendingPreview,
  listPendingPreviewTargets,
  renderCompact,
  renderDetail,
} from '../../../../support/dungeon/uiPreviewHarness';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../../../dungeon/domain/outcome';

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

    const widthMentions = detailParagraphs.filter(
      (text) => text === "It is 6' wide."
    );
    expect(widthMentions).toHaveLength(1);

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ');

    const jumpingPlaceMatches = compactText.match(
      /There is a jumping place\./g
    );
    expect(jumpingPlaceMatches?.length ?? 0).toBe(1);

    const widthMatches = compactText.match(/It is 6' wide\./g);
    expect(widthMatches?.length ?? 0).toBe(1);
  });

  it('preserves circular pool previews while modes toggle before resolving the chain', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 2);
    feed = resolvePendingPreview(feed, 'unusualSize', 1);

    const pendingBefore = listPendingPreviewTargets(feed);
    expect(pendingBefore).toHaveLength(3);
    expect(pendingBefore.some((id) => id.endsWith('chamberRoomContents'))).toBe(
      true
    );
    expect(pendingBefore.some((id) => id.endsWith('circularContents'))).toBe(
      true
    );
    expect(pendingBefore.some((id) => id.endsWith('numberOfExits'))).toBe(true);

    const detailParagraphs = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());

    expect(detailParagraphs).toContain('It is circular.');
    expect(
      detailParagraphs.some((text) => text.includes('There is a pool.'))
    ).toBe(false);

    const compactParagraphs = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());

    const compactText = compactParagraphs.join(' ');
    expect(compactText).toContain('It is circular.');
    expect(compactText).not.toContain('There is a pool.');

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

  it('outputs circular magic pool chains without duplicate sentences after resolution', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 2);
    feed = resolvePendingPreview(feed, 'unusualSize', 1);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 1);
    feed = resolvePendingPreview(feed, 'circularContents', 1);
    feed = resolvePendingPreview(feed, 'circularPool', 19);
    feed = resolvePendingPreview(feed, 'circularMagicPool', 18);
    feed = resolvePendingPreview(feed, 'transporterLocation', 8);
    feed = resolvePendingPreview(feed, 'numberOfExits', 1);
    feed = resolvePendingPreview(feed, 'passageExitLocation', 6);
    feed = resolvePendingPreview(feed, 'exitDirection', 1);
    feed = resolvePendingPreview(feed, 'exitAlternative', 4);

    expect(listPendingPreviewTargets(feed)).toHaveLength(0);

    const detailParagraphs = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());

    expect(
      detailParagraphs.filter((text) => text === 'It is circular.')
    ).toHaveLength(1);
    expect(
      detailParagraphs.filter((text) =>
        text.startsWith('There is a pool. It is a magical pool.')
      )
    ).not.toHaveLength(0);
    expect(
      detailParagraphs.filter((text) => text === 'It is a transporter.')
    ).not.toHaveLength(0);
    expect(
      detailParagraphs.filter(
        (text) =>
          text === 'It transports characters elsewhere on the same level.'
      )
    ).not.toHaveLength(0);

    const compactParagraphs = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());
    const compactJoined = compactParagraphs.join(' ');
    const expectedSentences = [
      'It is circular.',
      'There is a pool.',
      'It is a magical pool. (In order to find out what it is, characters must enter the magic pool.)',
      'It transports characters elsewhere on the same level.',
      'It is about 500 sq. ft.',
    ];
    for (const sentence of expectedSentences) {
      const occurrences = compactJoined.match(
        new RegExp(sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      );
      expect(occurrences?.length ?? 0).toBe(1);
    }
    expect(compactJoined).toContain('There is 1 additional passage');
    expect(compactJoined).toContain('Passage 1 is on the opposite wall.');
  });

  it('keeps independent previews for multiple exit locations', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'numberOfExits', 5);

    const exitEvent = findEvent(feed.outcome, 'numberOfExits');
    expect(exitEvent).toBeDefined();
    if (!exitEvent) throw new Error('missing exits');
    expect(
      exitEvent.children?.filter((child) => child.type === 'pending-roll')
    ).not.toHaveLength(0);

    const initialPending = listPendingPreviewTargets(feed);
    expect(initialPending).toHaveLength(4);
    expect(
      initialPending.some((id) => id.endsWith('chamberRoomContents'))
    ).toBe(true);
    expect(
      initialPending.some((id) => id.endsWith('.0.passageExitLocation'))
    ).toBe(true);
    expect(
      initialPending.some((id) => id.endsWith('.1.passageExitLocation'))
    ).toBe(true);
    expect(
      initialPending.some((id) => id.endsWith('.2.passageExitLocation'))
    ).toBe(true);

    feed = resolvePendingPreview(feed, 'passageExitLocation', 1);

    const afterFirst = listPendingPreviewTargets(feed);
    const locationTargets = afterFirst.filter((id) =>
      id.endsWith('.passageExitLocation')
    );
    expect(locationTargets).toHaveLength(2);
    expect(
      locationTargets.some((id) => id.endsWith('.1.passageExitLocation'))
    ).toBe(true);
    expect(
      locationTargets.some((id) => id.endsWith('.2.passageExitLocation'))
    ).toBe(true);
    expect(afterFirst.some((id) => id.endsWith('.0.passageExitLocation'))).toBe(
      false
    );
    expect(afterFirst.some((id) => id.endsWith('.exitDirection'))).toBe(true);
    expect(afterFirst.some((id) => id.endsWith('.exitAlternative'))).toBe(true);
  });

  it('shows resolved exit placement in compact mode after chamber resolution', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 1);
    feed = resolvePendingPreview(feed, 'numberOfExits', 1);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 1);
    feed = resolvePendingPreview(feed, 'passageExitLocation', 1);
    feed = resolvePendingPreview(feed, 'exitDirection', 1);

    let pendingTargets = listPendingPreviewTargets(feed);
    expect(
      pendingTargets.some((target) => target.includes('exitAlternative'))
    ).toBe(true);

    feed = resolvePendingPreview(feed, 'exitAlternative', 1);

    pendingTargets = listPendingPreviewTargets(feed);
    expect(pendingTargets).toEqual([]);

    const compactParagraphs = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());
    const compactText = compactParagraphs.join(' ');

    expect(compactText).toContain('Passage 1 is on the opposite wall.');
    expect(compactText).toContain('The passage continues straight ahead.');
    expect(compactText).toContain(
      'If the passage is indicated in a wall where the space immediately beyond the wall has already been mapped, then the exit is a secret door.'
    );
    expect(compactText).not.toContain('See the exit location');
  });
});

function findEvent(
  node: DungeonOutcomeNode | undefined,
  kind: OutcomeEventNode['event']['kind']
): OutcomeEventNode | undefined {
  if (!node) return undefined;
  if (node.type === 'event') {
    if (node.event.kind === kind) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findEvent(child, kind);
        if (found) return found;
      }
    }
  }
  return undefined;
}
