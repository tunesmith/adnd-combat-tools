import type { DungeonRenderNode } from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { resolveDoorBeyond } from '../features/navigation/entry/entryResolvers';
import { buildDoorStartMessages } from '../features/navigation/entry/entryRender';
import { buildOutcomeMessages } from './renderMessages';

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
  level?: number;
}): {
  usedRoll?: number;
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
  renderCache?: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
  pendingCount?: number;
} => {
  const doorAhead = options?.doorAhead ?? false;
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: buildDoorStartMessages(),
      outcome: undefined,
    };
  }
  const node = resolveDoorBeyond({
    roll: options?.roll,
    doorAhead,
    level: options?.level,
  });
  const usedRoll = node.type === 'event' ? node.roll : undefined;
  const detailMode = options?.detailMode ?? false;
  return buildOutcomeMessages(node, {
    usedRoll,
    detailMode,
    autoResolve: !detailMode,
  });
};
