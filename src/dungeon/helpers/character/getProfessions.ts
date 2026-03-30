import { getMaxLevel } from './level/getMaxLevel';
import type { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import type { Attributes } from '../../models/attributes';
import type { CharacterProfession } from '../../models/character/characterSheet';
import type { CharacterClass } from '../../models/characterClass';

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
 */
export const getProfessions = (
  characterRace: CharacterRace,
  selectedClasses: CharacterClass[],
  attributes: Attributes,
  characterLevel: number
): CharacterProfession[] => {
  const classMaxLevels = selectedClasses.map((characterClass) => ({
    characterClass,
    maxLevel: getMaxLevel(characterRace, characterClass, attributes),
  }));

  const baseLevel = Math.round(
    (characterLevel + selectedClasses.length) / selectedClasses.length
  );

  const levelDistributor: number[] = new Array(selectedClasses.length).fill(
    baseLevel
  );

  const getIndex = (cls: CharacterClass): number =>
    selectedClasses.findIndex((value) => value === cls);

  const applyExcess = (fromIndex: number, excess: number): void => {
    if (excess <= 0) return;
    const totalClasses = selectedClasses.length;
    const recipients = selectedClasses
      .map((_, idx) => idx)
      .filter((idx) => idx !== fromIndex);

    if (recipients.length === 0) return;

    if (totalClasses === 2) {
      const target = recipients[0];
      if (target === undefined) return;
      const targetMax = classMaxLevels[target];
      if (!targetMax) return;
      const capacity = targetMax.maxLevel - (levelDistributor[target] ?? 0);
      if (capacity <= 0) return;
      const addition = Math.min(Math.ceil(excess / 2), capacity);
      levelDistributor[target] = (levelDistributor[target] ?? 0) + addition;
      return;
    }

    let remaining = excess;
    let activeRecipients = recipients.filter(
      (idx) =>
        (levelDistributor[idx] ?? 0) < (classMaxLevels[idx]?.maxLevel ?? 0)
    );

    if (activeRecipients.length === 0) return;

    while (remaining > 0 && activeRecipients.length > 0) {
      const share = Math.floor(remaining / activeRecipients.length);
      let remainder = remaining % activeRecipients.length;
      let progress = 0;

      activeRecipients.forEach((idx) => {
        let addition = share;
        if (remainder > 0) {
          addition += 1;
          remainder -= 1;
        }
        if (addition <= 0) return;
        const maxInfo = classMaxLevels[idx];
        if (!maxInfo) return;
        const capacity = maxInfo.maxLevel - (levelDistributor[idx] ?? 0);
        if (capacity <= 0) return;
        const applied = Math.min(addition, capacity);
        levelDistributor[idx] = (levelDistributor[idx] ?? 0) + applied;
        remaining -= applied;
        if (applied > 0) {
          progress += applied;
        }
      });

      if (progress === 0) break;

      activeRecipients = activeRecipients.filter(
        (idx) =>
          (levelDistributor[idx] ?? 0) < (classMaxLevels[idx]?.maxLevel ?? 0)
      );
    }
  };

  let adjusted = true;
  while (adjusted) {
    adjusted = false;
    classMaxLevels.forEach(({ characterClass, maxLevel }) => {
      const idx = getIndex(characterClass);
      if (idx === -1) return;
      const currentLevel = levelDistributor[idx] ?? baseLevel;
      if (currentLevel > maxLevel) {
        const excess = currentLevel - maxLevel;
        levelDistributor[idx] = maxLevel;
        applyExcess(idx, excess);
        adjusted = true;
      }
    });
  }

  return selectedClasses.map((selectedClass, index) => ({
    characterClass: selectedClass,
    level: Math.max(levelDistributor[index] ?? baseLevel, 1),
  }));
};
