import { CharacterSheet } from "../../models/character/characterSheet";
import { getMaxHenchmenForMember } from "../character/henchmen/getMaxHenchmenForMember";

/**
 * It's possible for a main party configuration to not be able to hire henchmen,
 * if all main party members are henchman-limited in some sense.
 *
 * @param mainParty
 * @param requiredHenchmen
 */
export const canPartyHireHenchmen = (
  mainParty: CharacterSheet[],
  requiredHenchmen: number
): boolean => {
  const maxHenchmen = mainParty.reduce((total, member) => {
    return total + getMaxHenchmenForMember(member, mainParty);
  }, 0);

  return maxHenchmen >= requiredHenchmen;
};
