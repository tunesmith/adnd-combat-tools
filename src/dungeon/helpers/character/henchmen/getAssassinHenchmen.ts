import { CharacterSheet } from "../../../models/character/characterSheet";
import { getCountOfClassesInParty } from "../../party/getCountOfClassesInParty";
import { CharacterClass } from "../../../models/characterClass";
import { characterMax } from "../../../models/characterMax";

/**
 * Assassins cannot have henchmen below Level 4.
 * From 4th-7th level, they can only have assassin henchmen,
 * which in turn is limited by the number of assassins already
 * in the character party.
 *
 * From level 8th on, they can also have thieves, and from
 * 12th on, they can have anyone. They are also limited by
 * charisma max though.
 *
 * @param level
 * @param maxHenchmenByCharisma
 * @param party
 */
export const getAssassinHenchmen = (
  level: number,
  maxHenchmenByCharisma: number,
  party: CharacterSheet[]
) => {
  if (level < 4) return 0;
  const numAssassins = getCountOfClassesInParty(party, [
    CharacterClass.Assassin,
  ]);
  if (level < 8) {
    const remainingAssassins =
      characterMax[CharacterClass.Assassin] - numAssassins;
    return Math.min(remainingAssassins, maxHenchmenByCharisma);
  }
  const numThieves = getCountOfClassesInParty(party, [CharacterClass.Thief]);
  if (level < 12) {
    const remainingAssassins =
      characterMax[CharacterClass.Assassin] - numAssassins;
    const remainingThieves = characterMax[CharacterClass.Thief] - numThieves;
    return Math.min(
      remainingAssassins + remainingThieves,
      maxHenchmenByCharisma
    );
  }
  return maxHenchmenByCharisma;
};
