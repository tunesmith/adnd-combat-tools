import { DoorBeyond, doorBeyond } from '../../tables/dungeon/doorBeyond';
import type {
  DungeonMessage,
  DungeonRollTrace,
  DungeonTablePreview,
  DungeonRenderNode,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { resolveDoorBeyond } from '../domain/resolvers';
import { createOutcomeRenderSnapshot } from '../helpers/outcomePipeline';

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
  renderCache?: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
  pendingCount?: number;
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
