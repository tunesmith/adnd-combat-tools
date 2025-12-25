import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { getMonsterLevelTable, MonsterLevel } from './monsterLevelTable';

export function resolveMonsterLevel(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const table = getMonsterLevelTable(dungeonLevel);
  const usedRoll = options?.roll ?? rollDice(table.sides);
  const result = getTableEntry(usedRoll, table);
  const children: DungeonOutcomeNode[] = [];
  const context = { kind: 'wandering', level: dungeonLevel } as const;
  switch (result) {
    case MonsterLevel.One:
      children.push({ type: 'pending-roll', table: 'monsterOne', context });
      break;
    case MonsterLevel.Two:
      children.push({ type: 'pending-roll', table: 'monsterTwo', context });
      break;
    case MonsterLevel.Three:
      children.push({ type: 'pending-roll', table: 'monsterThree', context });
      break;
    case MonsterLevel.Four:
      children.push({ type: 'pending-roll', table: 'monsterFour', context });
      break;
    case MonsterLevel.Five:
      children.push({ type: 'pending-roll', table: 'monsterFive', context });
      break;
    case MonsterLevel.Six:
      children.push({ type: 'pending-roll', table: 'monsterSix', context });
      break;
    case MonsterLevel.Seven:
      children.push({ type: 'pending-roll', table: 'monsterSeven', context });
      break;
    case MonsterLevel.Eight:
      children.push({ type: 'pending-roll', table: 'monsterEight', context });
      break;
    case MonsterLevel.Nine:
      children.push({ type: 'pending-roll', table: 'monsterNine', context });
      break;
    case MonsterLevel.Ten:
      children.push({ type: 'pending-roll', table: 'monsterTen', context });
      break;
    default:
      break;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterLevel',
      result,
      dungeonLevel,
    },
    children: children.length ? children : undefined,
  };
}
