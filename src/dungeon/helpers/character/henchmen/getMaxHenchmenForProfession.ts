import type {
  CharacterProfession,
  CharacterSheet,
} from "../../../models/character/characterSheet";
import { CharacterClass } from "../../../models/characterClass";
import { getMonkHenchmen } from "./getMonkHenchmen";
import { getAssassinHenchmen } from "./getAssassinHenchmen";

/**
 * Normally, the henchman limit for a character is controlled
 * by their Charisma score. But some character classes have
 * additional rules controlling whether they can have henchmen.
 *
 * @param profession
 * @param mainParty
 * @param maxHenchmenByCharisma
 */
export const getMaxHenchmenForProfession = (
  profession: CharacterProfession,
  mainParty: CharacterSheet[],
  maxHenchmenByCharisma: number
): number => {
  switch (profession.characterClass) {
    case CharacterClass.Monk:
      return getMonkHenchmen(profession.level);

    case CharacterClass.Assassin:
      return getAssassinHenchmen(
        profession.level,
        maxHenchmenByCharisma,
        mainParty
      );

    case CharacterClass.Ranger:
      return profession.level >= 8 ? maxHenchmenByCharisma : 0;

    default:
      return maxHenchmenByCharisma;
  }
};
