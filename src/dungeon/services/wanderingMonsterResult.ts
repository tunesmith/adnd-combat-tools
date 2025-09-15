import {
  dungeonEight,
  dungeonFive,
  dungeonFour,
  dungeonFourteenFifteen,
  dungeonNine,
  dungeonOne,
  dungeonSeven,
  dungeonSix,
  dungeonSixteen,
  dungeonTenEleven,
  dungeonTwelveThirteen,
  dungeonTwoThree,
} from '../../tables/dungeon/monster/monsterLevel';
import type { MonsterLevel } from '../../tables/dungeon/monster/monsterLevel';
import type { Table } from '../../tables/dungeon/dungeonTypes';
import { rollDice } from '../helpers/dungeonLookup';

/**
 * In addition to rolling the wandering monster, we also have
 * to roll where it comes from.
 *
 *
 * @param level
 */

// I could use MonsterDistribution instead of the case fall-through
// gets complained about.
export const getMonsterTable = (level: number): Table<MonsterLevel> => {
  switch (level) {
    case 1:
      return dungeonOne;
    case 2:
    case 3:
      return dungeonTwoThree;
    case 4:
      return dungeonFour;
    case 5:
      return dungeonFive;
    case 6:
      return dungeonSix;
    case 7:
      return dungeonSeven;
    case 8:
      return dungeonEight;
    case 9:
      return dungeonNine;
    case 10:
    case 11:
      return dungeonTenEleven;
    case 12:
    case 13:
      return dungeonTwelveThirteen;
    case 14:
    case 15:
      return dungeonFourteenFifteen;
    default:
      return dungeonSixteen;
  }
};

export const formatMonsterCount = (
  count: number,
  singular: string,
  plural: string
): string => {
  return count === 1
    ? `There is ${count} ${singular}. `
    : `There are ${count} ${plural}. `;
};

/**
 * Lesser monsters on deeper levels have their numbers augmented by a
 * like number of the same sort of creatures for each level of the
 * dungeon beneath that of the assigned level of the monster type
 * encountered.
 *
 * Example: First level monsters on the 2nd level of a dungeon will be
 * twice as numerous as the Numbers variable indicates, i.e. 2-8 giant
 * ants, rather than 1-4, if they are encountered on the 2nd level (or
 * its equivalent) of a dungeon. The same is true for second level
 * monsters encountered on the 3rd dungeon level, third level monsters
 * on the 4th dungeon level, etc.
 *
 * Ninth and tenth level monsters are typically given attendant monsters,
 * rather than greater numbers, in lower dungeon levels, i.e., a demon
 * prince encountered on the 11th dungeon level might have a single type
 * I demon attendant, while on the 15th level of the dungeon the same
 * demon prince might have 5 such lesser demons or a pair of type III
 * escorts.
 *
 * Greater monsters on higher levels will have their numbers reduced by
 * 1 for each level of the dungeon above their assigned level, subject to
 * a minimum number of 1. Example: 1-3 shadows are normally encountered
 * on the 4th level of the dungeon; as shadows are fourth level monsters,
 * a maximum of 2 can be encountered on the 3rd dungeon level, and but
 * 1 on the 2nd level. (Fourth level monsters cannot be encountered on
 * the 1st level of the dungeon.) Hydrae, for instance, will have fewer
 * heads, while creatures with attendants will have fewer or none at
 * all on the lesser-numbered levels.
 *
 * @param monsterLevel
 * @param dungeonLevel
 * @param rolls
 * @param sides
 * @param plus
 */
export const getNumberOfMonsters = (
  monsterLevel: number,
  dungeonLevel: number,
  rolls: number,
  sides: number,
  plus: number = 0
): number => {
  if (dungeonLevel < monsterLevel) {
    // e.g. monster level 5, dungeon level 1: subtract monsters
    const levelDifference = monsterLevel - dungeonLevel;
    const monsters = rollDice(sides, rolls) + plus - levelDifference;
    return monsters < 1 ? 1 : monsters;
  } else if (monsterLevel === dungeonLevel) {
    return rollDice(sides, rolls) + plus;
  } else {
    // e.g. dungeon level 5, monster level 1: increase monsters
    const levelDifference = dungeonLevel - monsterLevel;
    return rollDice(sides, rolls * levelDifference) + plus * levelDifference;
  }
};
