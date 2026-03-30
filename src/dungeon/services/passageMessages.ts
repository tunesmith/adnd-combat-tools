import type { DungeonRenderNode } from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { resolvePeriodicCheck } from '../features/navigation/entry/entryResolvers';
import { buildPassageStartMessages } from '../features/navigation/entry/entryRender';
import { buildOutcomeMessages } from './renderMessages';

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
    return {
      usedRoll: undefined,
      messages: buildPassageStartMessages(options?.level),
      outcome: undefined,
    };
  }
  const node = resolvePeriodicCheck({
    roll: options?.roll,
    level,
    avoidMonster: options?.avoidMonster,
  });
  const usedRoll = node.type === 'event' ? node.roll : undefined;
  const detailMode = options?.detailMode ?? false;
  return buildOutcomeMessages(node, {
    usedRoll,
    detailMode,
    autoResolve: !detailMode,
  });
};
