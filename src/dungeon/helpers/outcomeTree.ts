import type { DoorChainLaterality } from '../domain/navigationOutcome';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import {
  getPendingRollTargetId,
  getPendingRollKind,
  getPendingRollTableId,
  getScopedTableSuffix,
} from '../domain/pendingRoll';
import {
  ALL_CHILD_POST_PROCESSORS,
  ALL_PENDING_RESOLVERS,
} from '../features/bundle';
import { DoorLocation } from '../features/navigation/doorChain/doorChainTable';

const MAX_DEPTH = 32;

export function normalizeOutcomeTree(
  node: DungeonOutcomeNode,
  rootId?: string
): DungeonOutcomeNode {
  if (node.type === 'pending-roll') {
    const pendingId =
      rootId ??
      node.id ??
      `root.pending.${sanitizeId(getPendingRollTableId(node))}`;
    if (node.id === pendingId) return node;
    return { ...node, id: pendingId };
  }
  const assignedId = rootId ?? node.id ?? `root.${sanitizeId(node.event.kind)}`;
  const changed = node.id !== assignedId;
  const baseChildren = node.children;
  if (!baseChildren || baseChildren.length === 0) {
    if (!changed) return node;
    return { ...node, id: assignedId };
  }
  let childChanged = false;
  const nextChildren = baseChildren.map((child, index) => {
    const childId = buildChildId(assignedId, child, index);
    const normalized = normalizeOutcomeTree(child, childId);
    if (normalized !== child) childChanged = true;
    return normalized;
  });
  if (!changed && !childChanged) return node;
  return {
    ...node,
    id: assignedId,
    children: childChanged ? nextChildren : baseChildren,
  };
}

function collectDoorChainExisting(
  ancestors: OutcomeEventNode[]
): DoorChainLaterality[] {
  const existing: DoorChainLaterality[] = [];
  for (const ancestor of ancestors) {
    if (ancestor.event.kind !== 'doorLocation') continue;
    const lateral = toDoorChainLaterality(ancestor.event.result);
    if (!lateral) continue;
    if (!existing.includes(lateral)) existing.push(lateral);
  }
  return existing;
}

function toDoorChainLaterality(
  result: DoorLocation
): DoorChainLaterality | undefined {
  if (result === DoorLocation.Left) return 'Left';
  if (result === DoorLocation.Right) return 'Right';
  return undefined;
}

export function resolveOutcomeNode(
  node: DungeonOutcomeNode,
  depth = 0,
  ancestors: OutcomeEventNode[] = []
): OutcomeEventNode | undefined {
  if (depth > MAX_DEPTH) return undefined;
  if (node.type === 'event') {
    const baseChildren = node.children;
    ancestors.push(node);
    const resolvedChildren = resolveChildren(
      baseChildren,
      depth + 1,
      ancestors
    );
    ancestors.pop();

    return enrichEventNode(node, resolvedChildren, depth + 1);
  }
  const resolved = resolvePendingNode(node, ancestors);
  if (!resolved) return undefined;
  return resolveOutcomeNode(resolved, depth + 1, ancestors);
}

export function applyResolvedOutcome(
  node: DungeonOutcomeNode,
  targetId: string,
  resolved: DungeonOutcomeNode
): DungeonOutcomeNode {
  if (node.type === 'pending-roll') {
    if (
      matchesTarget(node.id, targetId) ||
      (!node.id && getPendingRollTableId(node) === targetId)
    ) {
      return resolved;
    }
    return node;
  }
  if (node.type !== 'event') return node;
  if (
    matchesTarget(node.id, targetId) ||
    (!node.id && node.event.kind === targetId)
  ) {
    return resolved;
  }
  const children = node.children;
  if (!children || children.length === 0) return node;
  let changed = false;
  const nextChildren = children.map((child) => {
    const updated = applyResolvedOutcome(child, targetId, resolved);
    if (updated !== child) changed = true;
    return updated;
  });
  if (!changed) return node;
  const updatedNode: OutcomeEventNode = {
    ...node,
    children: nextChildren,
  };
  const dragonText = inheritDragonChildText(updatedNode);
  if (dragonText && 'text' in updatedNode.event) {
    updatedNode.event = {
      ...updatedNode.event,
      text: dragonText,
    } as OutcomeEvent;
  }
  return updatedNode;
}

const DRAGON_PARENT_BY_CHILD: Partial<
  Record<OutcomeEvent['kind'], OutcomeEvent['kind']>
> = {
  dragonThree: 'monsterThree',
  dragonFourYounger: 'monsterFour',
  dragonFourOlder: 'monsterFour',
  dragonFiveYounger: 'monsterFive',
  dragonFiveOlder: 'monsterFive',
  dragonSix: 'monsterSix',
  dragonSeven: 'monsterSeven',
  dragonEight: 'monsterEight',
  dragonNine: 'monsterNine',
  dragonTen: 'monsterTen',
};

function inheritDragonChildText(node: OutcomeEventNode): string | undefined {
  const children = node.children;
  if (!children) return undefined;
  for (const child of children) {
    if (child.type !== 'event') continue;
    const expectedParent = DRAGON_PARENT_BY_CHILD[child.event.kind];
    if (!expectedParent || expectedParent !== node.event.kind) continue;
    if ('text' in child.event && typeof child.event.text === 'string') {
      const text = child.event.text.trim();
      if (text.length > 0) return child.event.text;
    }
  }
  return undefined;
}

export function findPendingWithAncestors(
  node: DungeonOutcomeNode | undefined,
  predicate: (pending: PendingRoll) => boolean
): { pending: PendingRoll; ancestors: OutcomeEventNode[] } | undefined {
  return findPendingWithAncestorsInternal(node, predicate, []);
}

export function deriveDoorChainContext(
  node: DungeonOutcomeNode | undefined,
  targetId: string
): { existing: DoorChainLaterality[]; sequence: number } | undefined {
  const match = findPendingWithAncestors(
    node,
    (pending) =>
      matchesTarget(getPendingRollTargetId(pending), targetId) ||
      getPendingRollTableId(pending) === targetId
  );
  if (!match) return undefined;
  const existing = collectDoorChainExisting(match.ancestors);
  const sequence = parseDoorChainSequence(targetId, existing.length);
  return { existing, sequence };
}

function resolveChildren(
  children: DungeonOutcomeNode[] | undefined,
  depth: number,
  ancestors: OutcomeEventNode[]
): OutcomeEventNode[] {
  if (!children) return [];
  const result: OutcomeEventNode[] = [];
  for (const child of children) {
    const resolved = resolveOutcomeNode(child, depth + 1, ancestors);
    if (resolved) result.push(resolved);
  }
  return result;
}

function enrichEventNode(
  node: OutcomeEventNode,
  resolvedChildren: OutcomeEventNode[],
  depth: number
): OutcomeEventNode {
  let children = [...resolvedChildren];
  const resolveNested = (outcome: DungeonOutcomeNode) =>
    resolveOutcomeNode(outcome, depth + 1, []);
  const postProcess = ALL_CHILD_POST_PROCESSORS[node.event.kind];
  if (postProcess) {
    children = postProcess(node, children, resolveNested);
  }
  return {
    type: 'event',
    event: node.event,
    roll: node.roll,
    children: children.length ? children : undefined,
  };
}

function findPendingWithAncestorsInternal(
  node: DungeonOutcomeNode | undefined,
  predicate: (pending: PendingRoll) => boolean,
  ancestors: OutcomeEventNode[]
): { pending: PendingRoll; ancestors: OutcomeEventNode[] } | undefined {
  if (!node) return undefined;
  if (node.type === 'pending-roll') {
    if (predicate(node)) {
      return { pending: node, ancestors: [...ancestors] };
    }
    return undefined;
  }
  if (node.type !== 'event' || !node.children) return undefined;
  ancestors.push(node);
  for (const child of node.children) {
    const match = findPendingWithAncestorsInternal(child, predicate, ancestors);
    if (match) {
      ancestors.pop();
      return match;
    }
  }
  ancestors.pop();
  return undefined;
}

function resolvePendingNode(
  pending: PendingRoll,
  ancestors: OutcomeEventNode[]
): DungeonOutcomeNode | undefined {
  const base = getPendingRollKind(pending);
  const featureResolve = ALL_PENDING_RESOLVERS[base];
  return featureResolve ? featureResolve(pending, ancestors) : undefined;
}

function buildChildId(
  parentId: string,
  child: DungeonOutcomeNode,
  index: number
): string {
  const suffix =
    child.type === 'event'
      ? sanitizeId(child.event.kind)
      : sanitizeId(getPendingRollTableId(child));
  return `${parentId}.${index}.${suffix}`;
}

function sanitizeId(value: string): string {
  return value.replace(/\s+/g, '-');
}

function matchesTarget(nodeId: string | undefined, targetId: string): boolean {
  return !!nodeId && nodeId === targetId;
}

function parseDoorChainSequence(table: string, fallback: number): number {
  const seq = Number(getScopedTableSuffix(table));
  if (Number.isInteger(seq)) return seq;
  return fallback;
}

export function countPendingNodes(
  node: DungeonOutcomeNode | undefined
): number {
  if (!node) return 0;
  if (node.type === 'pending-roll') return 1;
  if (!node.children) return 0;
  return node.children.reduce(
    (total, child) => total + countPendingNodes(child),
    0
  );
}
