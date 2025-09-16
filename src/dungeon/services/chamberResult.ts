import type { DungeonRenderNode } from '../../types/dungeon';
import { resolveChamberDimensions } from '../domain/resolvers';
import { toCompactRender, toDetailRender } from '../adapters/render';
import { resolveOutcomeNode } from '../helpers/outcomeTree';

export const chamberMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const node = resolveChamberDimensions({ roll: options?.roll });
  if (options?.detailMode) {
    const rendered = toDetailRender(node);
    const usedRoll = (node.type === 'event' && node.roll) || options?.roll;
    return { usedRoll, messages: rendered };
  }
  const resolvedNode = resolveOutcomeNode(node) ?? node;
  const rendered = toCompactRender(resolvedNode);
  const usedRoll = (node.type === 'event' && node.roll) || options?.roll;
  return { usedRoll, messages: rendered };
};
