import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import {
  dragonFourOlder,
  dragonFourYounger,
  MonsterFour,
  monsterFour,
} from './monsterFourTables';
import {
  dragonFourOlderTextForCommand,
  dragonFourYoungerTextForCommand,
  monsterFourTextForCommand,
} from './monsterFourResult';

export function resolveMonsterFour(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterFour.sides);
  const result = getTableEntry(usedRoll, monsterFour);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterFourTextForCommand(dungeonLevel, result);
  const party = resolved.party;
  const text = party ? undefined : resolved.text;
  if (result === MonsterFour.DragonYounger) {
    children.push({
      type: 'pending-roll',
      table: 'dragonFourYounger',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else if (result === MonsterFour.DragonOlder) {
    children.push({
      type: 'pending-roll',
      table: 'dragonFourOlder',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterFour',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonFourYounger(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 4;
  const usedRoll = options?.roll ?? rollDice(dragonFourYounger.sides);
  const result = getTableEntry(usedRoll, dragonFourYounger);
  const text = dragonFourYoungerTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonFourYounger',
      result,
      dungeonLevel,
      text,
    },
  };
}

export function resolveDragonFourOlder(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 4;
  const usedRoll = options?.roll ?? rollDice(dragonFourOlder.sides);
  const result = getTableEntry(usedRoll, dragonFourOlder);
  const text = dragonFourOlderTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonFourOlder',
      result,
      dungeonLevel,
      text,
    },
  };
}
