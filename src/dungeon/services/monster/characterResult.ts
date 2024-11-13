import { rollDice } from "../../helpers/dungeonLookup";

export const characterResult = (
  monsterLevel: number,
  dungeonLevel: number
): string => {
  const characters = rollDice(4) + 1;
  const others = 9 - characters;
  const henchmen = dungeonLevel > 3;
  const characterLevel = getCharacterLevel(monsterLevel, dungeonLevel);
  return `There are ${characters} L${characterLevel} characters and ${others} ${
    henchmen ? "henchmen" : "men-at-arms"
  }. `;
};

/**
 * The level of each character will be equal to that of the level of the
 * dungeon or the level of monster, whichever is greater, through the
 * 4th level. Thereafter, it will be between 7th and 12th, determined
 * by a roll of d6 +6, and adjusted as follows: If the total is higher
 * than the level of the dungeon, reduce it by -1. If it is lower than
 * the level of the dungeon, adjust it upwards by +1, but not to exceed
 * 12 levels unless the dungeon level is 16th or deeper.
 *
 * Translation: I believe "through the 4th level" refers to dungeon
 * level, not either dungeon/monster level, because if it referred to
 * either, it would be impossible to experience a character level of
 * 5th or 6th level. On the 4th dungeon level, it is possible to
 * meet 5th or 6th level monsters.
 *
 * @param monsterLevel
 * @param dungeonLevel
 */
const getCharacterLevel = (
  monsterLevel: number,
  dungeonLevel: number
): number => {
  if (dungeonLevel <= 4) {
    return Math.max(monsterLevel, dungeonLevel);
  }
  const roll = rollDice(6) + 6;
  if (roll > dungeonLevel) return roll - 1;
  if (roll < dungeonLevel && (roll < 12 || dungeonLevel >= 16)) {
    return roll + 1;
  }
  return roll;
};
