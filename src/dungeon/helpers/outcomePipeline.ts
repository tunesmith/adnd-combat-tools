import type { DungeonRenderNode } from '../../types/dungeon';
import type { DungeonOutcomeNode, OutcomeEventNode } from '../domain/outcome';
import {
  countPendingNodes,
  normalizeOutcomeTree,
  resolveOutcomeNode,
} from './outcomeTree';
import { renderDetailTree, toCompactRender } from '../adapters/render';
import { postProcessOutcomeTree } from '../features/bundle';

export type OutcomeRenderSnapshot = {
  normalized: OutcomeEventNode;
  compactOutcome: OutcomeEventNode;
  detail: DungeonRenderNode[];
  detailResolved: DungeonRenderNode[];
  compact: DungeonRenderNode[];
  pendingCount: number;
  resolvedPendingCount: number;
};

export function createOutcomeRenderSnapshot(
  outcome?: DungeonOutcomeNode,
  options?: { autoResolve?: boolean }
): OutcomeRenderSnapshot | undefined {
  if (!outcome) return undefined;
  const normalized = normalizeOutcomeTree(outcome);
  const postProcessed = postProcessOutcomeTree(normalized);
  if (postProcessed.type !== 'event') return undefined;
  const normalizedEvent: OutcomeEventNode = postProcessed;
  const detail = renderDetailTree(normalizedEvent);
  const resolved =
    options?.autoResolve ?? false
      ? resolveOutcomeNode(normalizedEvent) ?? normalizedEvent
      : normalizedEvent;
  const compactOutcome = normalizeOutcomeTree(resolved, normalizedEvent.id);
  const compactPostProcessed = postProcessOutcomeTree(compactOutcome);
  if (compactPostProcessed.type !== 'event') return undefined;
  const compactEvent: OutcomeEventNode = compactPostProcessed;
  const detailResolved = renderDetailTree(compactEvent);
  const compact = toCompactRender(compactEvent);
  return {
    normalized: normalizedEvent,
    compactOutcome: compactEvent,
    detail,
    detailResolved,
    compact,
    pendingCount: countPendingNodes(normalizedEvent),
    resolvedPendingCount: countPendingNodes(compactEvent),
  };
}
