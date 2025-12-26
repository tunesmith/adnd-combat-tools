import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { monsterOne, MonsterOne } from './monsterOneTables';
import { monsterOneTextForCommand } from './monsterOneResult';

export function resolveMonsterOne(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterOne.sides);
  const result = getTableEntry(usedRoll, monsterOne);
  const children: DungeonOutcomeNode[] = [];
  let text: string | undefined;
  if (result === MonsterOne.Human) {
    children.push({
      type: 'pending-roll',
      table: 'human',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    text = monsterOneTextForCommand(dungeonLevel, result);
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterOne',
      result,
      dungeonLevel,
      text,
    },
    children: children.length ? children : undefined,
  };
}
