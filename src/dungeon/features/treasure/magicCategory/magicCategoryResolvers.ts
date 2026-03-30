import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import {
  magicCategoryFollowups,
  treasureMagicCategory,
} from './magicCategoryTable';
import { buildTreasureEvent } from '../shared';

const indexedMagicCategoryTables = new Set([
  'treasureMiscMagicE1',
  'treasureMiscMagicE2',
  'treasureMiscMagicE3',
  'treasureMiscMagicE4',
  'treasureMiscMagicE5',
  'treasureArmorShields',
  'treasureSwords',
  'treasureMiscWeapons',
]);

type TreasureMagicCategoryResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function resolveTreasureMagicCategory(
  options?: TreasureMagicCategoryResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMagicCategory.sides);
  const command = getTableEntry(usedRoll, treasureMagicCategory);
  const event = buildTreasureEvent(
    'treasureMagicCategory',
    command,
    usedRoll,
    options
  );
  const children: DungeonOutcomeNode[] = [];
  const followup = magicCategoryFollowups.find(
    (candidate) => candidate.result === command
  );
  if (followup) {
    children.push(
      createPendingRoll({
        kind: followup.table,
        id:
          event.rollIndex && indexedMagicCategoryTables.has(followup.table)
            ? `${followup.table}:${event.rollIndex}`
            : undefined,
        args: {
          kind: 'treasureMagic',
          level: event.level,
          treasureRoll: usedRoll,
          rollIndex: event.rollIndex,
        },
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}
