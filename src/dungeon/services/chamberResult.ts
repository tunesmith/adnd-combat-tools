import type { DungeonRenderNode } from '../../types/dungeon';
import { resolveChamberDimensions } from '../domain/resolvers';
import { toCompactRender, toDetailRender } from '../adapters/render';

export const chamberMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const node = resolveChamberDimensions({ roll: options?.roll });
  const rendered = options?.detailMode
    ? toDetailRender(node)
    : toCompactRender(node);
  const usedRoll = (node.type === 'event' && node.roll) || options?.roll;
  return { usedRoll, messages: rendered };
};
