import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  treasureProtectionType,
  TreasureProtectionType,
  treasureProtectionGuardedBy,
  treasureProtectionHiddenBy,
} from './protectionTables';

export type TreasureProtectionResolverOptions = {
  roll?: number;
};

export function resolveTreasureProtectionType(
  options?: TreasureProtectionResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureProtectionType.sides);
  const command = getTableEntry(usedRoll, treasureProtectionType);
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureProtectionType.Guarded) {
    children.push({
      type: 'pending-roll',
      table: 'treasureProtectionGuardedBy',
    });
  } else {
    children.push({
      type: 'pending-roll',
      table: 'treasureProtectionHiddenBy',
    });
  }
  const event: OutcomeEvent = {
    kind: 'treasureProtectionType',
    result: command,
  };
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children,
  };
}

export function resolveTreasureProtectionGuardedBy(
  options?: TreasureProtectionResolverOptions
): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureProtectionGuardedBy.sides);
  const command = getTableEntry(usedRoll, treasureProtectionGuardedBy);
  const event: OutcomeEvent = {
    kind: 'treasureProtectionGuardedBy',
    result: command,
  };
  return {
    type: 'event',
    roll: usedRoll,
    event,
  };
}

export function resolveTreasureProtectionHiddenBy(
  options?: TreasureProtectionResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureProtectionHiddenBy.sides);
  const command = getTableEntry(usedRoll, treasureProtectionHiddenBy);
  const event: OutcomeEvent = {
    kind: 'treasureProtectionHiddenBy',
    result: command,
  };
  return {
    type: 'event',
    roll: usedRoll,
    event,
  };
}
