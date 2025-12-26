import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  treasureMagicCategory,
  TreasureMagicCategory,
} from './magicCategoryTable';

export type TreasureMagicCategoryResolverOptions = {
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
  const event: OutcomeEvent = {
    kind: 'treasureMagicCategory',
    result: command,
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? usedRoll,
    rollIndex: options?.rollIndex,
  };
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMagicCategory.Potions) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePotion',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.Scrolls) {
    children.push({
      type: 'pending-roll',
      table: 'treasureScroll',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.Rings) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRing',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.RodsStavesWands) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRodStaffWand',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE1) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE1',
      id: event.rollIndex
        ? `treasureMiscMagicE1:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE2) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE2',
      id: event.rollIndex
        ? `treasureMiscMagicE2:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE3) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE3',
      id: event.rollIndex
        ? `treasureMiscMagicE3:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE4) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE4',
      id: event.rollIndex
        ? `treasureMiscMagicE4:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE5) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE5',
      id: event.rollIndex
        ? `treasureMiscMagicE5:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.ArmorShields) {
    children.push({
      type: 'pending-roll',
      table: 'treasureArmorShields',
      id: event.rollIndex
        ? `treasureArmorShields:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.Swords) {
    children.push({
      type: 'pending-roll',
      table: 'treasureSwords',
      id: event.rollIndex ? `treasureSwords:${event.rollIndex}` : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscWeapons) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscWeapons',
      id: event.rollIndex
        ? `treasureMiscWeapons:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}
