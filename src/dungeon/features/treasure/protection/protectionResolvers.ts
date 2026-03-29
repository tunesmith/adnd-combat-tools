import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import {
  treasureProtectionType,
  TreasureProtectionType,
  treasureProtectionGuardedBy,
  treasureProtectionHiddenBy,
} from './protectionTables';

type TreasureProtectionResolverOptions = {
  roll?: number;
};

export function resolveTreasureProtectionType(
  options?: TreasureProtectionResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureProtectionType.sides);
  const command = getTableEntry(usedRoll, treasureProtectionType);
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureProtectionType.Guarded) {
    children.push(createPendingRoll({ kind: 'treasureProtectionGuardedBy' }));
  } else {
    children.push(createPendingRoll({ kind: 'treasureProtectionHiddenBy' }));
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
  const usedRoll = options?.roll ?? rollDice(treasureProtectionGuardedBy.sides);
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
