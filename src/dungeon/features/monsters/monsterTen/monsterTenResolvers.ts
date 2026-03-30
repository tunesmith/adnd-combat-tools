import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { dragonTen, MonsterTen, monsterTen } from './monsterTenTables';
import {
  dragonTenTextForCommand,
  monsterTenTextForCommand,
} from './monsterTenResult';

export function resolveMonsterTen(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterTen.sides);
  const result = getTableEntry(usedRoll, monsterTen);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterTenTextForCommand(dungeonLevel, result);
  const party = resolved.party;
  const text = party ? undefined : resolved.text;
  if (result === MonsterTen.Dragon) {
    children.push(
      createPendingRoll({
        kind: 'dragonTen',
        args: { kind: 'wandering', level: dungeonLevel },
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterTen',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonTen(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 10;
  const usedRoll = options?.roll ?? rollDice(dragonTen.sides);
  const result = getTableEntry(usedRoll, dragonTen);
  const text = dragonTenTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonTen',
      result,
      dungeonLevel,
      text,
    },
  };
}
