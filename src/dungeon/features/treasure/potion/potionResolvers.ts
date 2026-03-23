import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import type { Table } from '../../../../tables/dungeon/tableTypes';
import {
  buildTreasureEvent,
  type TreasureEvent,
  type TreasureEventKind,
} from '../shared';
import {
  treasurePotion,
  TreasurePotion,
  treasurePotionAnimalControl,
  treasurePotionDragonControl,
  treasurePotionGiantControl,
  treasurePotionGiantStrength,
  treasurePotionHumanControl,
  treasurePotionUndeadControl,
  type TreasurePotionAnimalControl,
  type TreasurePotionDragonControl,
  type TreasurePotionGiantControl,
  type TreasurePotionGiantStrength,
  type TreasurePotionHumanControl,
  type TreasurePotionUndeadControl,
} from './potionTables';

export function resolveTreasurePotion(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePotion.sides);
  const command = getTableEntry(usedRoll, treasurePotion);
  const event = buildTreasureEvent(
    'treasurePotion',
    command,
    usedRoll,
    options
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasurePotion.AnimalControl) {
    children.push(buildPotionPending('treasurePotionAnimalControl', event));
  } else if (command === TreasurePotion.DragonControl) {
    children.push(buildPotionPending('treasurePotionDragonControl', event));
  } else if (command === TreasurePotion.GiantControl) {
    children.push(buildPotionPending('treasurePotionGiantControl', event));
  } else if (command === TreasurePotion.GiantStrength) {
    children.push(buildPotionPending('treasurePotionGiantStrength', event));
  } else if (command === TreasurePotion.HumanControl) {
    children.push(buildPotionPending('treasurePotionHumanControl', event));
  } else if (command === TreasurePotion.UndeadControl) {
    children.push(buildPotionPending('treasurePotionUndeadControl', event));
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasurePotionAnimalControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolvePotionSubtable(
    treasurePotionAnimalControl,
    'treasurePotionAnimalControl',
    options
  );
}

export function resolveTreasurePotionDragonControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolvePotionSubtable(
    treasurePotionDragonControl,
    'treasurePotionDragonControl',
    options
  );
}

export function resolveTreasurePotionGiantControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolvePotionSubtable(
    treasurePotionGiantControl,
    'treasurePotionGiantControl',
    options
  );
}

export function resolveTreasurePotionGiantStrength(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolvePotionSubtable(
    treasurePotionGiantStrength,
    'treasurePotionGiantStrength',
    options
  );
}

export function resolveTreasurePotionHumanControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolvePotionSubtable(
    treasurePotionHumanControl,
    'treasurePotionHumanControl',
    options
  );
}

export function resolveTreasurePotionUndeadControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolvePotionSubtable(
    treasurePotionUndeadControl,
    'treasurePotionUndeadControl',
    options
  );
}

function resolvePotionSubtable<
  T extends
    | TreasurePotionAnimalControl
    | TreasurePotionDragonControl
    | TreasurePotionGiantControl
    | TreasurePotionGiantStrength
    | TreasurePotionHumanControl
    | TreasurePotionUndeadControl
>(
  table: Table<T>,
  kind: TreasureEventKind,
  options?: {
    roll?: number;
    level?: number;
    treasureRoll?: number;
    rollIndex?: number;
  }
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(table.sides);
  const command = getTableEntry(usedRoll, table);
  const event = buildTreasureEvent(kind, command, usedRoll, options);
  return {
    type: 'event',
    roll: usedRoll,
    event,
  };
}

function buildPotionPending(
  table: string,
  event: TreasureEvent
): DungeonOutcomeNode {
  return {
    type: 'pending-roll',
    table,
    context: {
      kind: 'treasureMagic',
      level: event.level,
      treasureRoll: event.treasureRoll,
      rollIndex: event.rollIndex,
    },
  };
}
