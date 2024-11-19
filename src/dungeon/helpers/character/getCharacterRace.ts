import {
  characterRace,
  CharacterRace,
} from "../../../tables/dungeon/monster/character/characterRace";
import { getTableEntry, rollDice } from "../dungeonLookup";

/**
 * This implements the logic suggested on DMG p176, where
 * NPC parties are suggested to be about 20% non-human,
 * broken down by race according to the percentages listed
 * there.
 */
export const getCharacterRace = (): CharacterRace => {
  const nonHumanRoll = rollDice(100);
  if (nonHumanRoll > 20) {
    return CharacterRace.Human;
  }
  const raceRoll = rollDice(characterRace.sides);
  return getTableEntry(raceRoll, characterRace);
};
