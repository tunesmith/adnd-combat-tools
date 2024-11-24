import { CharacterRace } from "../../../../tables/dungeon/monster/character/characterRace";
import { CharacterClass } from "../../../../tables/dungeon/monster/character/characterClass";
import { allowedMultiClassCombinationsByRace } from "../../../models/allowedMultiClassCombinationsByRace";
import { getCharacterClass } from "./getCharacterClass";

/**
 * This selects a valid multi-class combination for a particular race.
 *
 * I believe we've established it is impossible to select a multi-class
 * combination that is level-restricted from the deepest levels of the
 * dungeon (which corresponds to a characterLevel of 13).
 *
 * This doesn't take into account the maximum number of classes per party,
 * as that will be checked later. If that maximum is reached, the character
 * will just be re-rolled.
 *
 * @param characterRace
 * @param numClasses
 */
export const getMultiClassForRace = (
  characterRace: CharacterRace,
  numClasses: number
): CharacterClass[] => {
  const selectedClasses: CharacterClass[] = [];

  // Step 1: Pre-filter valid combinations by race and number of classes
  let validCombinations = allowedMultiClassCombinationsByRace[
    characterRace
  ]?.filter((combo) => combo.length === numClasses); // Only combos of the correct size

  // Step 2: Generate classes until all are selected
  while (selectedClasses.length < numClasses) {
    const candidate = getCharacterClass();

    // Re-check validity for this candidate against remaining valid combinations
    const validMultiClass = validCombinations.some((combo) => {
      const includesCandidate = combo.includes(candidate);
      const isNotDuplicate = !selectedClasses.includes(candidate);
      return includesCandidate && isNotDuplicate;
    });

    if (validMultiClass) {
      selectedClasses.push(candidate);

      // Re-filter valid combinations after adding the new class
      validCombinations = validCombinations.filter((combo) =>
        combo.includes(candidate)
      );
    }
  }
  return selectedClasses;
};
