import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import {
  rodStaffWandFollowups,
  treasureRodsStavesWands,
  treasureStaffSerpent,
} from './rodStaffWandTables';

export function resolveTreasureRodStaffWand(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRodsStavesWands.sides);
  const command = getTableEntry(usedRoll, treasureRodsStavesWands);
  const children: DungeonOutcomeNode[] = [];
  const followup = rodStaffWandFollowups.find(
    (candidate) => candidate.result === command
  );
  if (followup) {
    children.push(createPendingRoll({ kind: followup.table }));
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
