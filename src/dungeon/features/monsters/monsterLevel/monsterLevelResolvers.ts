import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
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
      children.push(createPendingRoll({ kind: 'monsterOne', args: context }));
      break;
    case MonsterLevel.Two:
      children.push(createPendingRoll({ kind: 'monsterTwo', args: context }));
      break;
    case MonsterLevel.Three:
      children.push(createPendingRoll({ kind: 'monsterThree', args: context }));
      break;
    case MonsterLevel.Four:
      children.push(createPendingRoll({ kind: 'monsterFour', args: context }));
      break;
    case MonsterLevel.Five:
      children.push(createPendingRoll({ kind: 'monsterFive', args: context }));
      break;
    case MonsterLevel.Six:
      children.push(createPendingRoll({ kind: 'monsterSix', args: context }));
      break;
    case MonsterLevel.Seven:
      children.push(createPendingRoll({ kind: 'monsterSeven', args: context }));
      break;
    case MonsterLevel.Eight:
      children.push(createPendingRoll({ kind: 'monsterEight', args: context }));
      break;
    case MonsterLevel.Nine:
      children.push(createPendingRoll({ kind: 'monsterNine', args: context }));
      break;
    case MonsterLevel.Ten:
      children.push(createPendingRoll({ kind: 'monsterTen', args: context }));
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
