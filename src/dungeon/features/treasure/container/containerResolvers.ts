import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { treasureContainer } from './containerTable';

export type TreasureContainerResolverOptions = {
  roll?: number;
};

export function resolveTreasureContainer(
  options?: TreasureContainerResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureContainer.sides);
  const command = getTableEntry(usedRoll, treasureContainer);
  const event: OutcomeEvent = {
    kind: 'treasureContainer',
    result: command,
  };
  return {
    type: 'event',
    roll: usedRoll,
    event,
  };
}

