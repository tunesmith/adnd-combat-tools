import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { dragonEight, MonsterEight, monsterEight } from './monsterEightTables';
import {
  dragonEightTextForCommand,
  monsterEightTextForCommand,
} from './monsterEightResult';

export function resolveMonsterEight(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterEight.sides);
  const result = getTableEntry(usedRoll, monsterEight);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterEightTextForCommand(dungeonLevel, result);
  const party = resolved.party;
  const text = party ? undefined : resolved.text;
  if (result === MonsterEight.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonEight',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterEight',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonEight(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 8;
  const usedRoll = options?.roll ?? rollDice(dragonEight.sides);
  const result = getTableEntry(usedRoll, dragonEight);
  const text = dragonEightTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonEight',
      result,
      dungeonLevel,
      text,
    },
  };
}
