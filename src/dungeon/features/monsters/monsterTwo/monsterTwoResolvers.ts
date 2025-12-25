import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { monsterTwo } from './monsterTwoTable';
import { monsterTwoTextForCommand } from '../../../services/monster/monsterTwoResult';

export function resolveMonsterTwo(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterTwo.sides);
  const result = getTableEntry(usedRoll, monsterTwo);
  const { text, party } = monsterTwoTextForCommand(dungeonLevel, result);
  const eventText = party ? undefined : text;
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterTwo',
      result,
      dungeonLevel,
      text: eventText,
      party,
    },
  };
}

