import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  treasureRodsStavesWands,
  TreasureRodStaffWand,
  treasureStaffSerpent,
} from './rodStaffWandTables';

export function resolveTreasureRodStaffWand(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRodsStavesWands.sides);
  const command = getTableEntry(usedRoll, treasureRodsStavesWands);
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureRodStaffWand.StaffSerpent) {
    children.push({
      type: 'pending-roll',
      table: 'treasureStaffSerpent',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRodStaffWand',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureStaffSerpent(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureStaffSerpent.sides);
  const command = getTableEntry(usedRoll, treasureStaffSerpent);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureStaffSerpent',
      result: command,
    } as OutcomeEvent,
  };
}
