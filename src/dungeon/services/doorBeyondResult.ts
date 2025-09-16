import { DoorBeyond, doorBeyond } from '../../tables/dungeon/doorBeyond';
import type {
  DungeonMessage,
  DungeonRollTrace,
  DungeonTablePreview,
  DungeonRenderNode,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { resolveDoorBeyond } from '../domain/resolvers';
import { toCompactRender, toDetailRender } from '../adapters/render';

/**
 * Legacy string result (kept for compact mode parity and tests)
 */

/**
 * Typed variant using domain outcome + adapters.
 */
export const doorBeyondMessages = (options?: {
  roll?: number;
  doorAhead?: boolean;
  detailMode?: boolean;
  takeOverride?: (tableId: string) => number | undefined;
}): {
  usedRoll?: number;
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
} => {
  const doorAhead = options?.doorAhead ?? false;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'doorBeyond',
      title: 'Door Beyond',
      sides: doorBeyond.sides,
      entries: doorBeyond.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: DoorBeyond[e.command] ?? String(e.command),
      })),
    };
    const messages: (
      | DungeonMessage
      | DungeonRollTrace
      | DungeonTablePreview
    )[] = [{ kind: 'heading', level: 3, text: 'Door' }, preview];
    return { usedRoll: undefined, messages, outcome: undefined };
  }
  const node = resolveDoorBeyond({ roll: options?.roll, doorAhead });
  const usedRoll = node.type === 'event' ? node.roll : undefined;
  const messages = options?.detailMode
    ? toDetailRender(node)
    : toCompactRender(node);
  return { usedRoll, messages, outcome: node };
};
