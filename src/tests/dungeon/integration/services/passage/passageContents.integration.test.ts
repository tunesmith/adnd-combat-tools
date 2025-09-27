import {
  createFeedSnapshot,
  resolvePendingPreview,
  renderCompact,
  listPendingPreviewTargets,
} from '../../../../support/dungeon/uiPreviewHarness';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import { describeChamberRoomContents } from '../../../../../dungeon/adapters/render/chamberRoomContents';

describe('passage contents', () => {
  it('shows empty chamber contents once resolved', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    const pendingTargets = listPendingPreviewTargets(feed);
    const pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomContents');

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 1);
    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      expect(describeChamberRoomContents(contentsEvent)).toContain(
        'The area is empty.'
      );
    }

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ');
    expect(compactText).toContain('The area is empty.');
  });

  it('wires monsters into chamber contents', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    let pendingTargets = listPendingPreviewTargets(feed);
    let pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomContents');

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 13);

    pendingTargets = listPendingPreviewTargets(feed);
    pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('monsterLevel');

    feed = resolvePendingPreview(feed, 'monsterLevel', 3);

    pendingTargets = listPendingPreviewTargets(feed);
    pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).not.toContain('monsterLevel');
    const monsterTableBase = pendingBases.find(
      (base) => base.startsWith('monster') && base !== 'monsterLevel'
    );
    expect(monsterTableBase).toBeDefined();

    if (monsterTableBase) {
      feed = resolvePendingPreview(feed, monsterTableBase, 1);
    }

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ')
      .toLowerCase();
    expect(compactText).toContain('giant ant');
    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      expect(describeChamberRoomContents(contentsEvent)).toContain(
        'A monster is present.'
      );
    }
  });

  it('describes special stair results in contents summary', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    let pendingTargets = listPendingPreviewTargets(feed);
    let pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomContents');

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 18);

    pendingTargets = listPendingPreviewTargets(feed);
    pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomStairs');

    feed = resolvePendingPreview(feed, 'chamberRoomStairs', 20);

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ');
    expect(compactText).toContain(
      'Special, or Stairway leading down three levels — two flights of stairs and a slanting passageway.'
    );
    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      expect(describeChamberRoomContents(contentsEvent)).toContain(
        'Stairway leading down three levels'
      );
    }
  });

  it('describes trick or trap results in contents summary', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    let pendingTargets = listPendingPreviewTargets(feed);
    let pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomContents');

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 19);

    pendingTargets = listPendingPreviewTargets(feed);
    pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('trickTrap');

    feed = resolvePendingPreview(feed, 'trickTrap', 6);

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ')
      .toLowerCase();
    expect(compactText).toContain("pit, 10' deep");

    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      const detail = describeChamberRoomContents(contentsEvent).toLowerCase();
      expect(detail).toContain("pit, 10' deep");
    }
  });
});

function findOutcomeEvent(
  node: OutcomeEventNode | undefined,
  kind: OutcomeEventNode['event']['kind']
): OutcomeEventNode | undefined {
  if (!node || node.type !== 'event') return undefined;
  if (node.event.kind === kind) return node;
  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'event') {
        const candidate = findOutcomeEvent(child, kind);
        if (candidate) return candidate;
      }
    }
  }
  return undefined;
}

function pendingTableBases(targets: string[]): string[] {
  return targets.map((id) => {
    const lastSegment = id.split('.').pop() ?? id;
    const [base] = lastSegment.split(':');
    return base ?? '';
  });
}
