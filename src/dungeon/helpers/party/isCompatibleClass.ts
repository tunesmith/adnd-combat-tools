import { CharacterSheet } from "../../models/character/characterSheet";
import { incompatibleClasses } from "../../models/incompatibleClasses";
import { CharacterClass } from "../../models/characterClass";

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
  const isIncompatible = (
    class1: CharacterClass,
    class2: CharacterClass
  ): boolean =>
    incompatibleClasses[class1]?.includes(class2) ||
    incompatibleClasses[class2]?.includes(class1);

  const checkCompatibility = (
    candidate: CharacterClass,
    character: CharacterSheet
  ): boolean => {
    // Check the character's own professions
    for (const profession of character.professions) {
      if (isIncompatible(profession.characterClass, candidate)) {
        return false;
      }
    }

    // Recursively check followers
    for (const follower of character.followers) {
      if (!checkCompatibility(candidate, follower)) {
        return false;
      }
    }

    return true;
  };

  // Check all party members and their followers
  for (const member of party) {
    if (!checkCompatibility(candidate, member)) {
      return false;
    }
  }

  return true;
};
