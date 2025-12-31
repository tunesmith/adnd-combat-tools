import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { human } from './humanTable';
import { humanTextForCommand } from './humanResult';

export function resolveHuman(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(human.sides);
  const result = getTableEntry(usedRoll, human);
  const { text, party } = humanTextForCommand(dungeonLevel, result);
  const eventText = party ? undefined : text;
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'human',
      result,
      dungeonLevel,
      text: eventText,
      party,
    },
  };
}

