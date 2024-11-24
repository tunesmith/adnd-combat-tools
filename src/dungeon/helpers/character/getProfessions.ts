import { getMaxLevel } from "./level/getMaxLevel";
import { CharacterClass } from "../../../tables/dungeon/monster/character/characterClass";
import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import { Attributes } from "../../models/attributes";
import { CharacterProfession } from "../../models/character/characterSheet";

/**
 * getProfessions gets the character class / level combination for each class
 * of a multi-class individual.
 *
 * This is tricky because different races have different maximum levels for
 * classes, sometimes depending on attributes. For a character to properly
 * allocate experience points, it may mean that some levels advance ahead
 * of others, beyond being evenly distributed.
 *
 * The DMG offers guidelines on how to distribute these levels among the
 * classes, implemented below.
 *
 * @param characterRace
 * @param selectedClasses
 * @param attributes
 * @param characterLevel
 * @param numClasses
 */
export const getProfessions = (
  characterRace: CharacterRace,
  selectedClasses: CharacterClass[],
  attributes: Attributes,
  characterLevel: number,
  numClasses: number
): CharacterProfession[] => {
  const levelDistributor: Record<CharacterClass, number> = Object.fromEntries(
    selectedClasses.map((characterClass) => [characterClass, 0])
  ) as Record<CharacterClass, number>;

  // Calculate max levels for each class
  const classMaxLevels = selectedClasses.map((characterClass) => ({
    characterClass,
    maxLevel: getMaxLevel(characterRace, characterClass, attributes),
  }));

  // Level of Multi-Classed Individuals:
  // Determine level for a single profession, add 2, and divide by 2, dropping fractions below one-half.
  // For a triple class, add three, divide by three, and drop fractions below one-half.
  const baseLevel = Math.round(
    (characterLevel + selectedClasses.length) / selectedClasses.length
  );

  // Assign base levels, capped at max levels
  classMaxLevels.forEach(({ characterClass, maxLevel }) => {
    levelDistributor[characterClass] = Math.min(baseLevel, maxLevel);
  });

  // Calculate remaining levels to distribute
  let excessLevels =
    baseLevel -
    Object.values(levelDistributor).reduce((sum, level) => sum + level, 0);

  // Distribute excess levels to classes under their maxLevel
  while (excessLevels > 0) {
    const eligibleClasses = classMaxLevels.filter(
      ({ characterClass, maxLevel }) =>
        levelDistributor[characterClass] < maxLevel
    );

    if (eligibleClasses.length === 0) break;

    // If one class is thereby exceeded, take one-half the excess levels and assign them to the other.
    // In a triple-classed individual, divide excess levels and assign to the two remaining classes.
    const excessPerClass = Math.floor(
      (numClasses === 2 ? Math.round(excessLevels / 2) : excessLevels) /
        eligibleClasses.length
    );

    eligibleClasses.forEach(({ characterClass, maxLevel }) => {
      const allocatable = Math.min(
        excessPerClass,
        maxLevel - levelDistributor[characterClass]
      );
      levelDistributor[characterClass] += allocatable;
      excessLevels -= allocatable;
    });
  }

  return selectedClasses.map((selectedClass) => ({
    characterClass: selectedClass,
    level: levelDistributor[selectedClass],
  }));
};
