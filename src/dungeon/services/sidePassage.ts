import { SidePassages, sidePassages } from '../../tables/dungeon/sidePassages';
import type { DungeonTablePreview, DungeonRenderNode } from '../../types/dungeon';
import { resolveSidePassages } from '../domain/resolvers';
import { toCompactRender, toDetailRender } from '../adapters/render';

/**
 * We do *not* check passage width for side passages, as the "periodic check"
 * table specifically calls out passage width for "passage turns" but not for
 * side passages.
 */

export const sidePassageMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'sidePassages',
      title: 'Side Passages',
      sides: sidePassages.sides,
      entries: sidePassages.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: SidePassages[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const node = resolveSidePassages({ roll: options?.roll });
  const usedRoll = node.type === 'event' ? node.roll : undefined;
  const messages = options?.detailMode
    ? toDetailRender(node)
    : toCompactRender(node);
  return { usedRoll, messages };
};
