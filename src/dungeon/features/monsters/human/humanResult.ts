import { formatMonsterCount, getNumberOfMonsters } from '../monsterCounts';
import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import { characterResult } from '../../../services/monster/characterResult';
import type { PartyResult } from '../../../models/character/characterSheet';
import { Human, human } from './humanTable';

export const humanTextForCommand = (
  dungeonLevel: number,
  command: Human
): { text: string; party?: PartyResult } => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case Human.Bandit_5to15: {
      const bandits = getNumberOfMonsters(1, dungeonLevel, 2, 6, 3);
      text =
        formatMonsterCount(bandits, 'bandit', 'bandits') +
        `Upper level leaders and sub-leaders are not with groups numbering ` +
        `under 30, and at only 50% of normal level (rounded up) for groups ` +
        `under 60. You may wish to exclude this encounter on levels below ` +
        `whatever point you find them to be unlikely.`;
      break;
    }
    case Human.Berserker_3to9: {
      const berserkers = getNumberOfMonsters(1, dungeonLevel, 2, 4, 1);
      text =
        formatMonsterCount(berserkers, 'berserker', 'berserkers') +
        `Upper level leaders and sub-leaders are not with groups numbering ` +
        `under 30, and at only 50% of normal level (rounded up) for groups ` +
        `under 60. You may wish to exclude this encounter on levels below ` +
        `whatever point you find them to be unlikely.`;
      break;
    }
    case Human.Brigand_5to15: {
      const brigands = getNumberOfMonsters(1, dungeonLevel, 2, 6, 3);
      text =
        formatMonsterCount(brigands, 'brigand', 'brigands') +
        `Upper level leaders and sub-leaders are not with groups numbering ` +
        `under 30, and at only 50% of normal level (rounded up) for groups ` +
        `under 60. You may wish to exclude this encounter on levels below ` +
        `whatever point you find them to be unlikely.`;
      break;
    }
    case Human.Character: {
      const characters = characterResult(1, dungeonLevel);
      text = '';
      party = characters;
      break;
    }
  }
  return { text, party };
};

export const humanResult = (dungeonLevel: number): string => {
  const roll = rollDice(human.sides);
  const command = getTableEntry(roll, human);
  return humanTextForCommand(dungeonLevel, command).text;
};

