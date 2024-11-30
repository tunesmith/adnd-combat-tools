import { CharacterSheet } from "../../models/character/characterSheet";
import { CharacterClass } from "../../models/characterClass";

/**
 * Utility function to count the number of a list of classes within a party.
 * Will need to be expanded to count within henchmen.
 *
 * @param party
 * @param classesToCount
 */
export const getCountOfClassesInParty = (
  party: CharacterSheet[],
  classesToCount: CharacterClass[]
): number => {
  return party
    .flatMap((character) => character.professions)
    .filter((profession) => classesToCount.includes(profession.characterClass))
    .length;
};
