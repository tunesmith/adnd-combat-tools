import { getTableEntry, rollDice } from "../../dungeonLookup";
import {
  characterClass,
  CharacterClass,
} from "../../../../tables/dungeon/monster/character/characterClass";

/**
 * The regular NPC character table from the DMG has
 * the 100 result as "Monk or Bard", so this properly
 * selects between the two.
 */
export const getCharacterClass = (): CharacterClass => {
  const roll = rollDice(characterClass.sides); // e.g., d100 for a 100-sided table
  const prelimClass = getTableEntry(roll, characterClass);
  return prelimClass === CharacterClass.MonkBard
    ? Math.random() < 0.5
      ? CharacterClass.Monk
      : CharacterClass.Bard
    : prelimClass;
};
