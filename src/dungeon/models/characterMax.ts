import { CharacterClass } from "../../tables/dungeon/monster/character/characterClass";

/**
 * These are the maximum numbers of character classes per generated
 * npc party.
 *
 * I'm interpreting this to mean it is also true for multi-class
 * characters. For instance, you can't have two Fighter/Thief NPCs,
 * since a party can only have one thief.
 */
export const characterMax: Record<CharacterClass, number> = {
  [CharacterClass.Cleric]: 3,
  [CharacterClass.Druid]: 2,
  [CharacterClass.Fighter]: 5,
  [CharacterClass.Paladin]: 2,
  [CharacterClass.Ranger]: 2,
  [CharacterClass.MagicUser]: 3,
  [CharacterClass.Illusionist]: 4,
  [CharacterClass.Thief]: 1,
  [CharacterClass.Assassin]: 2,
  [CharacterClass.MonkBard]: 1,
  [CharacterClass.Monk]: 1,
  [CharacterClass.Bard]: 1,
  [CharacterClass.ManAtArms]: 7,
};
