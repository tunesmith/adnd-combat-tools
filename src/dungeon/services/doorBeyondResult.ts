import { DoorBeyond, doorBeyond } from '../../tables/dungeon/doorBeyond';
import type {
  DungeonMessage,
  DungeonRollTrace,
  DungeonTablePreview,
  DungeonRenderNode,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import {
  normalizeOutcomeTree,
  resolveOutcomeNode,
} from '../helpers/outcomeTree';
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
      targetId: 'doorBeyond',
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
  const normalized = node.type === 'event' ? normalizeOutcomeTree(node) : node;
  const usedRoll = node.type === 'event' ? node.roll : undefined;
  if (options?.detailMode) {
    const messages = toDetailRender(normalized);
    return { usedRoll, messages, outcome: normalized };
  }
  const resolvedNode = resolveOutcomeNode(normalized) ?? normalized;
  const finalOutcome = normalizeOutcomeTree(resolvedNode);
  const messages = toCompactRender(finalOutcome);
  return { usedRoll, messages, outcome: finalOutcome };
};
