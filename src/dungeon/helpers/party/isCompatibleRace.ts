import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import { CharacterSheet } from "../../models/character/characterSheet";
import { incompatibleRaces } from "../../models/incompatibleRaces";

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
  for (const member of party) {
    if (
      incompatibleRaces[member.characterRace].includes(candidateRace) ||
      incompatibleRaces[candidateRace].includes(member.characterRace)
    ) {
      return false;
    }
  }

  return true;
};
