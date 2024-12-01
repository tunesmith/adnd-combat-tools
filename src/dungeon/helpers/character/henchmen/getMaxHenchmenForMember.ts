import { CharacterSheet } from "../../../models/character/characterSheet";
import { getMaxHenchmenByCharisma } from "./getMaxHenchmenByCharisma";
import { getMaxHenchmenForProfession } from "./getMaxHenchmenForProfession";

/**
 * Number of henchmen per character depend on a few different things,
 * including charisma and character class. Multi-class characters
 * are unlimited though, other than by charisma.
 *
 * @param member
 * @param mainParty
 */
export const getMaxHenchmenForMember = (
  member: CharacterSheet,
  mainParty: CharacterSheet[]
): number => {
  const maxHenchmenByCharisma = getMaxHenchmenByCharisma(member.attributes.CHA);

  // Multi-class characters can always hire henchmen:
  // A cleric/ranger or cleric/assassin can because clerics can
  if (member.professions.length > 1) {
    return maxHenchmenByCharisma;
  }

  // Single-class logic: Directly access the only profession
  return getMaxHenchmenForProfession(
    member.professions[0]!,
    mainParty,
    maxHenchmenByCharisma
  );
};
