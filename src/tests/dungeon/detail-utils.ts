import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../dungeon/domain/outcome';
import {
  applyResolvedOutcome,
  isTableContext,
  normalizeOutcomeTree,
} from '../../dungeon/helpers/outcomeTree';
import { TABLE_RESOLVERS } from '../../dungeon/helpers/registry';
import type { TableContext } from '../../types/dungeon';
import { resolvePeriodicCheck } from '../../dungeon/domain/resolvers';

export function resolveSequenceWithRolls(
  rolls: number[],
  level: number
): DungeonOutcomeNode {
  if (rolls.length === 0) {
    throw new Error('must provide at least one roll');
  }
  let root: DungeonOutcomeNode = normalizeOutcomeTree(
    resolvePeriodicCheck({ roll: rolls[0], level })
  );
  for (const roll of rolls.slice(1)) {
    const pending = findNextPending(root);
    if (!pending) break;
    const base = pending.table.split(':')[0] ?? '';
    const resolver = TABLE_RESOLVERS[
      base as keyof typeof TABLE_RESOLVERS
    ] as ((opts: {
      roll?: number;
      id: string;
      context?: TableContext;
    }) => { outcome?: DungeonOutcomeNode }) | undefined;
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

export function applyToPending(
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

export function findEventByKind<K extends OutcomeEvent['kind']>(
  node: DungeonOutcomeNode,
  kind: K
): (OutcomeEventNode & { event: Extract<OutcomeEvent, { kind: K }> }) | undefined {
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

export function isParagraphNode<
  T extends { kind: string } & Partial<{ text: string }>
>(node: T): node is T & { kind: 'paragraph'; text: string } {
  return node.kind === 'paragraph';
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
