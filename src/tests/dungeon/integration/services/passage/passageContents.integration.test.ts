import {
  createFeedSnapshot,
  resolvePendingPreview,
  renderCompact,
  listPendingPreviewTargets,
  resolvePreview,
} from '../../../../support/dungeon/uiPreviewHarness';
import type {
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../../../../dungeon/domain/outcome';
import { describeChamberRoomContents } from '../../../../../dungeon/adapters/render/chamberRoomContents';
import { collectCharacterPartyMessages } from '../../../../../dungeon/adapters/render/monsters';
import { TreasureWithoutMonster } from '../../../../../tables/dungeon/treasure';

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
      feed = resolvePendingPreview(feed, monsterTableBase, 40);
    }

    const humanTargets = listPendingPreviewTargets(feed).filter((target) =>
      target.includes('human')
    );
    if (humanTargets.length > 0) {
      const humanTarget = humanTargets[0];
      if (humanTarget) {
        feed = resolvePreview(feed, humanTarget, 90);
      }
    }

    const compactNodes = renderCompact(feed);
    const compactParagraphs = compactNodes
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase());
    expect(compactParagraphs.join(' ')).toContain('a monster is present');
    expect(compactNodes.some((node) => node.kind === 'character-party')).toBe(
      true
    );
    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      const partyMessages = collectCharacterPartyMessages(
        contentsEvent,
        'compact'
      );
      expect(partyMessages.length).toBeGreaterThan(0);
      const detailText = describeChamberRoomContents(contentsEvent);
      expect(detailText).toContain('A monster is present.');
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

  it('wires treasure-only results into contents', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 3,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);

    const treasurePending = findPendingRoll(feed.outcome, 'treasure');
    expect(treasurePending).toBeDefined();
    expect(treasurePending?.context).toEqual(
      expect.objectContaining({
        kind: 'treasure',
        level: 3,
        withMonster: false,
        rollIndex: 1,
        totalRolls: 1,
      })
    );

    const pendingBases = pendingTableBases(listPendingPreviewTargets(feed));
    expect(pendingBases).toContain('treasure');

    feed = resolvePendingPreview(feed, 'treasure', 80);

    const treasureEvent = findOutcomeEvent(feed.outcome, 'treasure');
    expect(treasureEvent).toBeDefined();
    if (treasureEvent && treasureEvent.event.kind === 'treasure') {
      expect(treasureEvent.event.entries).toHaveLength(1);
      expect(treasureEvent.event.entries[0]?.command).toBe(
        TreasureWithoutMonster.GoldPerLevel
      );
      expect(treasureEvent.event.level).toBe(3);
    }

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ')
      .toLowerCase();
    expect(compactText).toContain('750 gold pieces');
    expect(compactText).toContain('determine treasure container');
    expect(compactText).toContain('determine treasure protection');
  });

  it('rolls treasure twice when monsters guard it', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 2,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 15);

    const treasurePending = findPendingRoll(feed.outcome, 'treasure');
    expect(treasurePending).toBeDefined();
    expect(treasurePending?.context).toEqual(
      expect.objectContaining({
        kind: 'treasure',
        withMonster: true,
        rollIndex: 1,
        totalRolls: 2,
      })
    );

    const pendingTargets = listPendingPreviewTargets(feed);
    const treasureTargets = pendingTargets.filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasure')
    );
    expect(treasureTargets).toHaveLength(2);

    feed = resolvePendingPreview(feed, 'treasure', 30);
    feed = resolvePendingPreview(feed, 'treasure', 97);

    const treasureEvents = findOutcomeEvents(feed.outcome, 'treasure');
    const treasureNodes = treasureEvents.filter(
      (
        event
      ): event is OutcomeEventNode & {
        event: Extract<OutcomeEvent, { kind: 'treasure' }>;
      } => event.event.kind === 'treasure'
    );
    const treasureWithMonster = treasureNodes.filter(
      (event) => event.event.withMonster
    );
    expect(treasureWithMonster).toHaveLength(2);
    const [first, second] = treasureWithMonster;
    expect(first?.event.entries).toHaveLength(1);
    expect(second?.event.entries).toHaveLength(1);
    expect(first?.event.entries[0]?.command).toBe(
      TreasureWithoutMonster.SilverPerLevel
    );
    expect(second?.event.entries[0]?.command).toBe(
      TreasureWithoutMonster.Magic
    );
    expect(first?.event.rollIndex).toBe(1);
    expect(second?.event.rollIndex).toBe(2);

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('2,000 silver pieces');
    expect(compactText).toContain(
      'magic item (roll once on magic items table)'
    );
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

function findOutcomeEvents(
  node: OutcomeEventNode | undefined,
  kind: OutcomeEventNode['event']['kind']
): OutcomeEventNode[] {
  if (!node || node.type !== 'event') return [];
  const results: OutcomeEventNode[] = [];
  const visit = (current: OutcomeEventNode | undefined): void => {
    if (!current || current.type !== 'event') return;
    if (current.event.kind === kind) {
      results.push(current);
    }
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };
  visit(node);
  return results;
}

function pendingTableBases(targets: string[]): string[] {
  return targets.map((id) => {
    const lastSegment = id.split('.').pop() ?? id;
    const [base] = lastSegment.split(':');
    return base ?? '';
  });
}

function findPendingRoll(
  node: OutcomeEventNode | PendingRoll | undefined,
  table: string
): PendingRoll | undefined {
  if (!node) return undefined;
  if (node.type === 'pending-roll') {
    return node.table.split(':')[0] === table ? node : undefined;
  }
  if (!node.children) return undefined;
  for (const child of node.children) {
    if (child.type === 'pending-roll') {
      if (child.table.split(':')[0] === table) return child;
    } else {
      const found = findPendingRoll(child, table);
      if (found) return found;
    }
  }
  return undefined;
}
