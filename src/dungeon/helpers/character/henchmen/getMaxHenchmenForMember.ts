import type { CharacterSheet } from '../../../models/character/characterSheet';
import { getMaxHenchmenByCharisma } from './getMaxHenchmenByCharisma';
import { getMaxHenchmenForProfession } from './getMaxHenchmenForProfession';

/**
 * Number of henchmen per character depend on a few different things,
 * including charisma and character class. If a multi-class character
 * has class-based restrictions, the most restrictive count applies.
 *
 * @param member
 * @param mainParty
 */
export const getMaxHenchmenForMember = (
  member: CharacterSheet,
  mainParty: CharacterSheet[]
): number => {
  const maxHenchmenByCharisma = getMaxHenchmenByCharisma(member.attributes.CHA);

  if (member.professions.length === 0) {
    return maxHenchmenByCharisma;
  }

  return member.professions.reduce(
    (currentMax, profession) =>
      Math.min(
        currentMax,
        getMaxHenchmenForProfession(
          profession,
          mainParty,
          maxHenchmenByCharisma
        )
      ),
    maxHenchmenByCharisma
  );
};
