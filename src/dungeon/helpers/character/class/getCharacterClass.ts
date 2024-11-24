import { getTableEntry, rollDice } from "../../dungeonLookup";
import {
  characterClass,
  CharacterClassTable,
} from "../../../../tables/dungeon/monster/character/characterClass";
import { CharacterClass } from "../../../models/characterClass";

/**
 * The regular NPC character table from the DMG has
 * the 100 result as "Monk or Bard", so this properly
 * selects between the two.
 */
export const getCharacterClass = (): CharacterClass => {
  const roll = rollDice(characterClass.sides); // e.g., d100 for a 100-sided table
  const prelimClass = getTableEntry(roll, characterClass);
  switch (prelimClass) {
    case CharacterClassTable.Cleric:
      return CharacterClass.Cleric;
    case CharacterClassTable.Druid:
      return CharacterClass.Druid;
    case CharacterClassTable.Fighter:
      return CharacterClass.Fighter;
    case CharacterClassTable.Paladin:
      return CharacterClass.Paladin;
    case CharacterClassTable.Ranger:
      return CharacterClass.Ranger;
    case CharacterClassTable.MagicUser:
      return CharacterClass.MagicUser;
    case CharacterClassTable.Illusionist:
      return CharacterClass.Illusionist;
    case CharacterClassTable.Thief:
      return CharacterClass.Thief;
    case CharacterClassTable.Assassin:
      return CharacterClass.Assassin;
    case CharacterClassTable.MonkBard:
      return Math.random() < 0.5 ? CharacterClass.Monk : CharacterClass.Bard;
  }
};
