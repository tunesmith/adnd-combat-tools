import { passageTurns, PassageTurns } from '../../tables/dungeon/passageTurns';
import type {
  DungeonTablePreview,
  DungeonRenderNode,
} from '../../types/dungeon';
import { resolvePassageTurns } from '../domain/resolvers';
import { toCompactRender, toDetailRender } from '../adapters/render';


export const passageTurnMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'passageTurns',
      title: 'Passage Turns',
      sides: passageTurns.sides,
      entries: passageTurns.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PassageTurns[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const node = resolvePassageTurns({ roll: options?.roll });
  const usedRoll = node.type === 'event' ? node.roll : undefined;
  const messages = options?.detailMode
    ? toDetailRender(node)
    : toCompactRender(node);
  return { usedRoll, messages };
};
