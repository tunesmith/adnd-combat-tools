import {
  renderDetailTree,
  toCompactRender,
} from '../../dungeon/adapters/render';
import {
  resolveDoorLocation,
  resolvePeriodicCheck,
  resolvePassageTurns,
  resolvePassageWidth,
  resolveSpecialPassage,
} from '../../dungeon/domain/resolvers';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../dungeon/domain/outcome';
import {
  applyResolvedOutcome,
  countPendingNodes,
  isTableContext,
  normalizeOutcomeTree,
} from '../../dungeon/helpers/outcomeTree';
import { TABLE_RESOLVERS } from '../../dungeon/helpers/registry';
import type { TableContext } from '../../types/dungeon';

describe('detail rendering with special passage', () => {
  it('allows inspecting the detail nodes for a special passage sequence', () => {
    const periodic = resolvePeriodicCheck({ roll: 12, level: 1 });
    const normalized = normalizeOutcomeTree(periodic);
    const withTurns = applyToPending(
      normalized,
      'passageTurns',
      resolvePassageTurns({ roll: 1 })
    );
    const withWidth = applyToPending(
      withTurns,
      'passageWidth',
      resolvePassageWidth({ roll: 19 })
    );
    const detailNodes = renderDetailTree(withWidth);
    expect(
      detailNodes.some(
        (node) => node.kind === 'table-preview' && node.id === 'specialPassage'
      )
    ).toBe(true);
  });

  it('captures special passage preview via staged dungeon steps', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.some(
        (node) => node.kind === 'table-preview' && node.id === 'specialPassage'
      )
    ).toBe(true);
  });

  it('verifies that specialPassage only shows up once in detail mode', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19, 20], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    const specialPassagePreviews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'specialPassage'
    );
    expect(specialPassagePreviews).toHaveLength(1);
  });
  it('verifies that proper output shows in deep chasms', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19, 20, 6, 1], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    const chasmDepthPreviews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'chasmDepth'
    );
    expect(chasmDepthPreviews).toHaveLength(1);
    const chasmConstructionPreviews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'chasmConstruction'
    );
    expect(chasmConstructionPreviews).toHaveLength(1);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim() === "The chasm is 200' deep."
      )
    ).toBe(true);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim() === 'A bridge crosses the chasm.'
      )
    ).toBe(true);
  });

  it('renders compact output for deep chasm sequences', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19, 20, 6, 1], 1);
    const compactNodes = toCompactRender(resolvedTree);
    const paragraph = compactNodes.find(isParagraphNode);
    expect(paragraph?.text.trim()).toBe(
      "The passage turns left 90 degrees - check again in 30'. A chasm, 20' wide, bisects the passage. The chasm is 200' deep. A bridge crosses the chasm."
    );
  });
});

describe('detail rendering for door chains', () => {
  it('reports door location details after resolving the chain', () => {
    const resolvedTree = resolveSequenceWithRolls([3, 13], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' && node.text.trim() === 'A door is Ahead.'
      )
    ).toBe(true);
  });

  it('surfaces follow-up door checks after lateral door results', () => {
    const resolvedTree = resolveSequenceWithRolls([3, 1], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'table-preview' && node.id === 'periodicCheckDoorOnly:0'
      )
    ).toBe(true);
  });
});

describe('detail rendering for chamber unusual size rerolls', () => {
  it('keeps unusual size pending when a reroll is indicated', () => {
    const resolvedTree = resolveSequenceWithRolls([14, 18, 5, 15], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    const unusualSizePreviews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'unusualSize'
    );
    expect(unusualSizePreviews).toHaveLength(1);
  });

  it('surfaces circular chamber follow-up tables', () => {
    const resolvedTree = resolveSequenceWithRolls([14, 18, 1], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'table-preview' && node.id === 'circularContents'
      )
    ).toBe(true);
  });

  it('accumulates unusual size rerolls before finalizing the size', () => {
    const resolvedTree = resolveSequenceWithRolls(
      [14, 18, 5, 15, 16, 15, 1],
      1
    );
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.filter(
        (node) => node.kind === 'table-preview' && node.id === 'unusualSize'
      )
    ).toHaveLength(1);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim() === 'It is about 4500 sq. ft.'
      )
    ).toBe(true);
  });

  it('resolves circular pool chains including transporter details', () => {
    const resolvedTree = resolveSequenceWithRolls(
      [14, 18, 1, 1, 19, 20, 1, 6],
      1
    );
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim().startsWith('It is a transporter.')
      )
    ).toBe(true);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim() === 'It transports characters back to the surface.'
      )
    ).toBe(true);
  });
});

describe('reroll updates', () => {
  it('replaces passage width text when rerolled', () => {
    const initialTree = resolveSequenceWithRolls([12, 1, 5], 1);
    const widthEvent = findEventByKind(initialTree, 'passageWidth');
    expect(widthEvent?.id).toBeDefined();
    const normalizedResolution = normalizeOutcomeTree(
      resolvePassageWidth({ roll: 17 }),
      widthEvent?.id ?? 'passageWidth'
    );
    const rerolledTree = normalizeOutcomeTree(
      applyResolvedOutcome(
        initialTree,
        widthEvent?.id ?? 'passageWidth',
        normalizedResolution
      )
    );
    const detailNodes = renderDetailTree(rerolledTree);
    expect(
      detailNodes.filter(
        (node) => node.kind === 'paragraph' && node.text.includes("10' wide")
      )
    ).toHaveLength(0);
    expect(
      detailNodes.filter(
        (node) => node.kind === 'paragraph' && node.text.includes("30' wide")
      )
    ).toHaveLength(1);
    const widthPreviews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'passageWidth'
    );
    expect(widthPreviews).toHaveLength(1);
    expect(countPendingNodes(rerolledTree)).toBe(0);
  });

  it('replaces door location narrative on reroll', () => {
    const initialTree = resolveSequenceWithRolls([3, 13], 1);
    const doorEvent = findEventByKind(initialTree, 'doorLocation');
    expect(doorEvent?.id).toBeDefined();

    const rerollOutcome = normalizeOutcomeTree(
      resolveDoorLocation({
        roll: 2,
        existing: doorEvent?.event.existingBefore ?? [],
        sequence: doorEvent?.event.sequence ?? 0,
      }),
      doorEvent?.id
    );

    const rerolledTree = normalizeOutcomeTree(
      applyResolvedOutcome(
        initialTree,
        doorEvent?.id ?? 'doorLocation',
        rerollOutcome
      )
    );

    const detailNodes = renderDetailTree(rerolledTree);
    expect(
      detailNodes.filter(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.includes('A door is to the Left')
      )
    ).toHaveLength(1);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' && node.text.includes('A door is Ahead')
      )
    ).toBe(false);
  });

  it('updates special passage outcome without duplicating previews', () => {
    const initialTree = resolveSequenceWithRolls([12, 1, 19, 4], 1);
    const specialPassageEvent = findEventByKind(initialTree, 'specialPassage');
    expect(specialPassageEvent?.id).toBeDefined();

    const rerollOutcome = normalizeOutcomeTree(
      resolveSpecialPassage({ roll: 13 }),
      specialPassageEvent?.id
    );

    const rerolledTree = normalizeOutcomeTree(
      applyResolvedOutcome(
        initialTree,
        specialPassageEvent?.id ?? 'specialPassage',
        rerollOutcome
      )
    );

    const detailNodes = renderDetailTree(rerolledTree);
    expect(
      detailNodes.filter(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.includes("A stream, 10' wide, bisects the passage.")
      )
    ).toHaveLength(1);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.includes('columns down the center')
      )
    ).toBe(false);
    const previews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'specialPassage'
    );
    expect(previews).toHaveLength(1);
    expect(countPendingNodes(rerolledTree)).toBeGreaterThan(0);
  });
});

function resolveSequenceWithRolls(
  rolls: number[],
  level: number
): DungeonOutcomeNode {
  if (rolls.length === 0) {
    throw new Error('must provide at least one roll');
  }
  let root: DungeonOutcomeNode = normalizeOutcomeTree(
    resolvePeriodicCheck({
      roll: rolls[0],
      level,
    })
  );
  for (const roll of rolls.slice(1)) {
    const pending = findNextPending(root);
    if (!pending) break;
    const base = pending.table.split(':')[0] ?? '';
    const resolver = (
      TABLE_RESOLVERS as Record<
        string,
        typeof TABLE_RESOLVERS[keyof typeof TABLE_RESOLVERS]
      >
    )[base];
    if (!resolver) {
      throw new Error(`No resolver for table ${base}`);
    }
    const resolution = resolver({
      roll,
      id: pending.table,
      context: isTableContext(pending.context)
        ? (pending.context as TableContext)
        : undefined,
    });
    if (!resolution.outcome) {
      throw new Error(`Resolver for ${base} did not return an outcome`);
    }
    const normalizedOutcome = normalizeOutcomeTree(
      resolution.outcome,
      pending.id ?? pending.table
    );
    root = normalizeOutcomeTree(
      applyResolvedOutcome(root, pending.id ?? pending.table, normalizedOutcome)
    );
  }
  return root;
}

function applyToPending(
  root: DungeonOutcomeNode,
  tableId: string,
  resolution: DungeonOutcomeNode
): DungeonOutcomeNode {
  const normalizedRoot = normalizeOutcomeTree(root);
  const pending = findPendingByTable(normalizedRoot, tableId);
  if (!pending) {
    throw new Error(`No pending node found for table ${tableId}`);
  }
  const normalizedResolution = normalizeOutcomeTree(
    resolution,
    pending.id ?? pending.table
  );
  return normalizeOutcomeTree(
    applyResolvedOutcome(
      normalizedRoot,
      pending.id ?? pending.table,
      normalizedResolution
    )
  );
}

function findNextPending(node: DungeonOutcomeNode): PendingRoll | undefined {
  if (node.type === 'pending-roll') return node;
  if (!node.children) return undefined;
  for (const child of node.children) {
    const found = findNextPending(child);
    if (found) return found;
  }
  return undefined;
}

function findEventByKind<K extends OutcomeEvent['kind']>(
  node: DungeonOutcomeNode,
  kind: K
):
  | (OutcomeEventNode & { event: Extract<OutcomeEvent, { kind: K }> })
  | undefined {
  if (node.type === 'event') {
    if (node.event.kind === kind) {
      return node as OutcomeEventNode & {
        event: Extract<OutcomeEvent, { kind: K }>;
      };
    }
    if (!node.children) return undefined;
    for (const child of node.children) {
      const match = findEventByKind(child, kind);
      if (match) return match;
    }
  }
  return undefined;
}

function findPendingByTable(
  node: DungeonOutcomeNode,
  tableId: string
): PendingRoll | undefined {
  if (node.type === 'pending-roll' && node.table === tableId) return node;
  if (node.type !== 'event' || !node.children) return undefined;
  for (const child of node.children) {
    const match = findPendingByTable(child, tableId);
    if (match) return match;
  }
  return undefined;
}

function isParagraphNode<
  T extends { kind: string } & Partial<{ text: string }>
>(node: T): node is T & { kind: 'paragraph'; text: string } {
  return node.kind === 'paragraph';
}
