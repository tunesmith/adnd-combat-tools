import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { sidePassages } from './sidePassageTable';

export function resolveSidePassages(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  /**
   * We do *not* check passage width for side passages, as the "periodic check"
   * table specifically calls out passage width for "passage turns" but not for
   * side passages.
   */
  const usedRoll = options?.roll ?? rollDice(sidePassages.sides);
  const command = getTableEntry(usedRoll, sidePassages);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'sidePassages',
      result: command,
    },
  };
}
