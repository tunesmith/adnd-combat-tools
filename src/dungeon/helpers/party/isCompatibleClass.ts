import { CharacterClass } from "../../../tables/dungeon/monster/character/characterClass";
import { CharacterSheet } from "../../models/character/characterSheet";
import { incompatibleClasses } from "../../models/incompatibleClasses";

/**
 * Checks a party to see if a prospective candidate's class is
 * incompatible with any of the classes within the party
 *
 * @param candidate
 * @param party
 */
export const isCompatibleClass = (
  candidate: CharacterClass,
  party: CharacterSheet[]
): boolean => {
  // Check if candidate conflicts with any existing party members
  for (const sheet of party) {
    for (const profession of sheet.professions) {
      if (
        incompatibleClasses[profession.characterClass]?.includes(candidate) ||
        incompatibleClasses[candidate]?.includes(profession.characterClass)
      ) {
        return false;
      }
    }
  }

  return true;
};
