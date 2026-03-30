import { Attribute } from '../../../../models/attributes';
import { CharacterRace } from '../../../../../tables/dungeon/monster/character/characterRace';
import { Gender } from '../../../../models/character/gender';
import { getExceptionalStrength } from './getExceptionalStrength';
import { CharacterClass } from '../../../../models/characterClass';

/**
 * This encodes the race-based and gender-based maximum
 * "exceptional strength" scores  for Fighters, from
 * "STRENGTH TABLE I." on PHB p9.
 *
 * @param attribute
 * @param candidateClasses
 * @param candidateRace
 * @param gender
 * @param score
 */
export const getStrengthAdjustedScore = (
  attribute: Attribute,
  candidateClasses: CharacterClass[],
  candidateRace: CharacterRace,
  gender: Gender,
  score: number
): number => {
  if (
    attribute === Attribute.Strength &&
    candidateClasses.some(
      (candidateClass) =>
        candidateClass === CharacterClass.Fighter ||
        candidateClass === CharacterClass.Paladin ||
        candidateClass === CharacterClass.Ranger
    ) &&
    score === 18
  ) {
    switch (candidateRace) {
      case CharacterRace.Human:
        return gender === Gender.Male
          ? getExceptionalStrength(100)
          : getExceptionalStrength(50);
      case CharacterRace.Dwarf:
        return gender === Gender.Male ? getExceptionalStrength(99) : score;
      case CharacterRace.Elf:
        return gender === Gender.Male ? getExceptionalStrength(75) : score;
      case CharacterRace.Gnome:
        return gender === Gender.Male ? getExceptionalStrength(50) : score;
      case CharacterRace.HalfElf:
        return gender === Gender.Male ? getExceptionalStrength(90) : score;
      case CharacterRace.Halfling:
        return score;
      case CharacterRace.HalfOrc:
        return gender === Gender.Male
          ? getExceptionalStrength(99)
          : getExceptionalStrength(75);
      default:
        return score;
    }
  }
  return score;
};
