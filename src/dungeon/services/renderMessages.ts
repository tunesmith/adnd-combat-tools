import type { DungeonRenderNode } from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { createOutcomeRenderSnapshot } from '../helpers/outcomePipeline';

type DungeonMessageResult = {
  usedRoll?: number;
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
  renderCache?: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
  pendingCount?: number;
};

export function buildOutcomeMessages(
  node: DungeonOutcomeNode,
  options: {
    usedRoll?: number;
    detailMode: boolean;
    autoResolve: boolean;
  }
): DungeonMessageResult {
  const snapshot = createOutcomeRenderSnapshot(node, {
    autoResolve: options.autoResolve,
  });
  if (!snapshot) {
    return { usedRoll: options.usedRoll, messages: [], outcome: undefined };
  }

  const detailMessages = options.autoResolve
    ? snapshot.detailResolved
    : snapshot.detail;

  return {
    usedRoll: options.usedRoll,
    messages: options.detailMode ? snapshot.detail : snapshot.compact,
    outcome: options.detailMode ? snapshot.normalized : snapshot.compactOutcome,
    renderCache: {
      detail: detailMessages,
      compact: snapshot.compact,
    },
    pendingCount: options.detailMode
      ? snapshot.pendingCount
      : snapshot.resolvedPendingCount,
  };
}
