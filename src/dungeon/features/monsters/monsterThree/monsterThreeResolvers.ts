import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import {
  dragonThree,
  MonsterThree,
  monsterThree,
} from './monsterThreeTables';
import {
  dragonThreeTextForCommand,
  monsterThreeTextForCommand,
} from '../../../services/monster/monsterThreeResult';

export function resolveMonsterThree(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterThree.sides);
  const result = getTableEntry(usedRoll, monsterThree);
  const children: DungeonOutcomeNode[] = [];
  let text: string | undefined;
  let party = undefined;
  if (result === MonsterThree.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonThree',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    const resolved = monsterThreeTextForCommand(dungeonLevel, result);
    text = resolved.party ? undefined : resolved.text;
    party = resolved.party;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterThree',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonThree(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 3;
  const usedRoll = options?.roll ?? rollDice(dragonThree.sides);
  const result = getTableEntry(usedRoll, dragonThree);
  const text = dragonThreeTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonThree',
      result,
      dungeonLevel,
      text,
    },
  };
}
