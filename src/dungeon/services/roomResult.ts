import type { DungeonRenderNode } from '../../types/dungeon';
import { resolveRoomDimensions } from '../domain/resolvers';
import { toCompactRender, toDetailRender } from '../adapters/render';
import { resolveOutcomeNode } from '../helpers/outcomeTree';

/**
 * Typed variant for room dimensions.
 * - In detail mode with no roll, returns only a table preview node.
 * - Otherwise returns a heading + bullet with roll/result and a paragraph description.
 */
export const roomMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const node = resolveRoomDimensions({ roll: options?.roll });
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
