import type { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import type { CharacterSheet } from '../../models/character/characterSheet';
import { incompatibleRaces } from '../../models/incompatibleRaces';

/**
 * Checks a party to see if a prospective candidate's race is
 * incompatible with any of the races within the party
 *
 * @param candidateRace
 * @param party
 */
export const isCompatibleRace = (
  candidateRace: CharacterRace,
  party: CharacterSheet[]
): boolean => {
  const isIncompatible = (
    race1: CharacterRace,
    race2: CharacterRace
  ): boolean =>
    incompatibleRaces[race1]?.includes(race2) ||
    incompatibleRaces[race2]?.includes(race1);

  const checkCompatibility = (
    candidateRace: CharacterRace,
    character: CharacterSheet
  ): boolean => {
    if (isIncompatible(candidateRace, character.characterRace)) {
      return false;
    }

    // Recursively check followers
    for (const follower of character.followers) {
      if (!checkCompatibility(candidateRace, follower)) {
        return false;
      }
    }

    return true;
  };

  for (const member of party) {
    if (!checkCompatibility(candidateRace, member)) {
      return false;
    }
  }

  return true;
};
