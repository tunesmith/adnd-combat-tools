import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { passageTurns } from './passageTurnTable';

export function resolvePassageTurns(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  // After a turn the generator always stages passage width so both modes can
  // reuse the same outcome tree and render consistent previews.
  const usedRoll = options?.roll ?? rollDice(passageTurns.sides);
  const command = getTableEntry(usedRoll, passageTurns);
  const children: DungeonOutcomeNode[] = [
    createPendingRoll({ kind: 'passageWidth' }),
  ];
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'passageTurns',
      result: command,
    },
    children,
  };
}
