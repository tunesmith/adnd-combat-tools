import {
  PeriodicCheck,
  periodicCheck,
} from '../../tables/dungeon/periodicCheck';
import type {
  DungeonMessage,
  DungeonTablePreview,
  DungeonRenderNode,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { resolvePeriodicCheck } from '../domain/resolvers';
import { createOutcomeRenderSnapshot } from '../helpers/outcomePipeline';

/**
 * If we follow the Strategic Review mindset, then it means
 * we follow the rule that:
 * - exits from chambers are passages
 * - exits from rooms are doors
 *
 * All chamber passages extend 30', after which the
 * periodicCheck table can be checked.
 *
 * But for rooms, it means that we would need another
 * move type, one that checks beyond a door.
 */
export const passageMessages = (options?: {
  roll?: number;
  level?: number;
  avoidMonster?: boolean;
  detailMode?: boolean;
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
  const level = options?.level ?? 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'periodicCheck',
      targetId: 'periodicCheck',
      title: 'Periodic Check',
      sides: periodicCheck.sides,
      entries: periodicCheck.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PeriodicCheck[e.command] ?? String(e.command),
      })),
      context: options?.level
        ? { kind: 'wandering', level: options.level }
        : undefined,
    };
    const messages: (DungeonMessage | DungeonTablePreview)[] = [
      { kind: 'heading', level: 3, text: 'Passage' },
      preview,
    ];
    return { usedRoll: undefined, messages, outcome: undefined };
  }
  const node = resolvePeriodicCheck({
    roll: options?.roll,
    level,
    avoidMonster: options?.avoidMonster,
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
