import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { dragonSeven, MonsterSeven, monsterSeven } from './monsterSevenTables';
import {
  dragonSevenTextForCommand,
  monsterSevenTextForCommand,
} from './monsterSevenResult';

export function resolveMonsterSeven(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterSeven.sides);
  const result = getTableEntry(usedRoll, monsterSeven);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterSevenTextForCommand(dungeonLevel, result);
  const party = resolved.party;
  const text = party ? undefined : resolved.text;
  if (result === MonsterSeven.Dragon) {
    children.push(
      createPendingRoll({
        kind: 'dragonSeven',
        args: { kind: 'wandering', level: dungeonLevel },
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterSeven',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonSeven(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 7;
  const usedRoll = options?.roll ?? rollDice(dragonSeven.sides);
  const result = getTableEntry(usedRoll, dragonSeven);
  const text = dragonSevenTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonSeven',
      result,
      dungeonLevel,
      text,
    },
  };
}
