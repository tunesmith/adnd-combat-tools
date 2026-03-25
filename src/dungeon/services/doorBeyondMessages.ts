import type { DungeonRenderNode } from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { createOutcomeRenderSnapshot } from '../helpers/outcomePipeline';
import { resolveDoorBeyond } from '../features/navigation/entry/entryResolvers';
import { buildDoorStartMessages } from '../features/navigation/entry/entryRender';

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
  const snapshot = createOutcomeRenderSnapshot(node, {
    autoResolve: !detailMode,
  });
  if (!snapshot) {
    return { usedRoll, messages: [], outcome: undefined };
  }
  const messages = detailMode ? snapshot.detail : snapshot.compact;
  return {
    usedRoll,
    messages,
    outcome: detailMode ? snapshot.normalized : snapshot.compactOutcome,
    renderCache: {
      detail: detailMode ? snapshot.detail : snapshot.detailResolved,
      compact: snapshot.compact,
    },
    pendingCount: detailMode
      ? snapshot.pendingCount
      : snapshot.resolvedPendingCount,
  };
};
