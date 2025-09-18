import type {
  DungeonAction,
  DungeonRenderNode,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { renderDetailTree, toCompactRender } from '../adapters/render';

export type RenderCache = {
  detail?: DungeonRenderNode[];
  compact?: DungeonRenderNode[];
};

export function buildRenderCache(outcome?: DungeonOutcomeNode): RenderCache {
  if (!outcome || outcome.type !== 'event') return {};
  return {
    detail: renderDetailTree(outcome),
    compact: toCompactRender(outcome),
  };
}

export function filterForCompact(
  nodes: DungeonRenderNode[],
  action: DungeonAction
): DungeonRenderNode[] {
  const rootHeading = action === 'passage' ? 'Passage' : 'Door';
  return nodes.filter((n) => {
    if (n.kind === 'heading') {
      return n.text !== rootHeading;
    }
    if (n.kind === 'bullet-list') {
      const allRoll = n.items.every((it) =>
        it.trim().toLowerCase().startsWith('roll:')
      );
      return !allRoll;
    }
    if (n.kind === 'roll-trace') {
      return false;
    }
    return true;
  });
}

export function filterForDetail(
  nodes: DungeonRenderNode[],
  action: DungeonAction
): DungeonRenderNode[] {
  const rootHeading = action === 'passage' ? 'Passage' : 'Door';
  let droppedRootHeading = false;
  const result: DungeonRenderNode[] = [];
  for (const n of nodes) {
    if (!droppedRootHeading && n.kind === 'heading' && n.text === rootHeading) {
      droppedRootHeading = true;
      continue;
    }
    result.push(n);
  }
  return result;
}

export function selectMessagesForMode(
  action: DungeonAction,
  isDetail: boolean,
  cache: RenderCache,
  fallback: DungeonRenderNode[]
): DungeonRenderNode[] {
  const baseNodes = isDetail
    ? cache.detail ?? fallback
    : cache.compact ?? fallback;
  return isDetail
    ? filterForDetail(baseNodes, action)
    : filterForCompact(baseNodes, action);
}
