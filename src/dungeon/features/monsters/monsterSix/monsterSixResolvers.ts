import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { dragonSix, MonsterSix, monsterSix } from './monsterSixTables';
import {
  dragonSixTextForCommand,
  monsterSixTextForCommand,
} from './monsterSixResult';

export function resolveMonsterSix(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterSix.sides);
  const result = getTableEntry(usedRoll, monsterSix);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterSixTextForCommand(dungeonLevel, result);
  const party = resolved.party;
  const text = party ? undefined : resolved.text;
  if (result === MonsterSix.Dragon) {
    children.push(
      createPendingRoll({
        kind: 'dragonSix',
        args: { kind: 'wandering', level: dungeonLevel },
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterSix',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonSix(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 6;
  const usedRoll = options?.roll ?? rollDice(dragonSix.sides);
  const result = getTableEntry(usedRoll, dragonSix);
  const text = dragonSixTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonSix',
      result,
      dungeonLevel,
      text,
    },
  };
}
