import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import {
  dragonFiveOlder,
  dragonFiveYounger,
  MonsterFive,
  monsterFive,
} from './monsterFiveTables';
import {
  dragonFiveOlderTextForCommand,
  dragonFiveYoungerTextForCommand,
  monsterFiveTextForCommand,
} from './monsterFiveResult';

export function resolveMonsterFive(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterFive.sides);
  const result = getTableEntry(usedRoll, monsterFive);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterFiveTextForCommand(dungeonLevel, result);
  const party = resolved.party;
  const text = party ? undefined : resolved.text;
  if (result === MonsterFive.DragonYounger) {
    children.push(
      createPendingRoll({
        kind: 'dragonFiveYounger',
        args: { kind: 'wandering', level: dungeonLevel },
      })
    );
  } else if (result === MonsterFive.DragonOlder) {
    children.push(
      createPendingRoll({
        kind: 'dragonFiveOlder',
        args: { kind: 'wandering', level: dungeonLevel },
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterFive',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonFiveYounger(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 5;
  const usedRoll = options?.roll ?? rollDice(dragonFiveYounger.sides);
  const result = getTableEntry(usedRoll, dragonFiveYounger);
  const text = dragonFiveYoungerTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonFiveYounger',
      result,
      dungeonLevel,
      text,
    },
  };
}

export function resolveDragonFiveOlder(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 5;
  const usedRoll = options?.roll ?? rollDice(dragonFiveOlder.sides);
  const result = getTableEntry(usedRoll, dragonFiveOlder);
  const text = dragonFiveOlderTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonFiveOlder',
      result,
      dungeonLevel,
      text,
    },
  };
}
