import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../../dungeon/domain/outcome';
import {
  applyResolvedOutcome,
  normalizeOutcomeTree,
} from '../../../dungeon/helpers/outcomeTree';
import { applyOutcomeRoll } from '../../../dungeon/helpers/registry';
import { readTableContext } from '../../../dungeon/helpers/tableContext';
import { resolvePeriodicCheck } from '../../../dungeon/features/navigation/entry/entryResolvers';

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
    const applied = applyOutcomeRoll({
      outcome: root,
      tableId: pending.table,
      targetId: pending.id,
      roll,
      context: readTableContext(pending.context),
    });
    if (!applied) {
      throw new Error(`No outcome available for table ${pending.table}`);
    }
    root = applied.outcome;
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
