import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { dragonNine, MonsterNine, monsterNine } from './monsterNineTables';
import {
  dragonNineTextForCommand,
  monsterNineTextForCommand,
} from './monsterNineResult';

export function resolveMonsterNine(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterNine.sides);
  const result = getTableEntry(usedRoll, monsterNine);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterNineTextForCommand(dungeonLevel, result);
  const party = resolved.party;
  const text = party ? undefined : resolved.text;
  if (result === MonsterNine.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonNine',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterNine',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonNine(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 9;
  const usedRoll = options?.roll ?? rollDice(dragonNine.sides);
  const result = getTableEntry(usedRoll, dragonNine);
  const text = dragonNineTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonNine',
      result,
      dungeonLevel,
      text,
    },
  };
}
