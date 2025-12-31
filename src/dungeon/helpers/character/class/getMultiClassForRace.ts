import type { CharacterRace } from '../../../../tables/dungeon/monster/character/characterRace';
import { allowedMultiClassCombinationsByRace } from '../../../models/allowedMultiClassCombinationsByRace';
import { getCharacterClass } from './getCharacterClass';
import type { CharacterClass } from '../../../models/characterClass';

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
 * @param requiredClasses
 */
export const getMultiClassForRace = (
  characterRace: CharacterRace,
  numClasses: number,
  requiredClasses: CharacterClass[] = []
): CharacterClass[] => {
  const uniqueRequired = Array.from(new Set(requiredClasses));
  if (uniqueRequired.length !== requiredClasses.length) {
    throw new Error('Duplicate classes provided in requiredClasses');
  }
  if (uniqueRequired.length > numClasses) {
    throw new Error('Required classes exceed desired class count');
  }

  const selectedClasses: CharacterClass[] = [...uniqueRequired];

  // Step 1: Pre-filter valid combinations by race and number of classes
  let validCombinations = allowedMultiClassCombinationsByRace[
    characterRace
  ]?.filter(
    (combo) =>
      combo.length === numClasses &&
      uniqueRequired.every((required) => combo.includes(required))
  ); // Only combos of the correct size that include required classes

  if (!validCombinations || validCombinations.length === 0) {
    throw new Error('No valid multi-class combination available for race');
  }

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
