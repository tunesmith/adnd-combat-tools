import { CharacterClass } from "../../tables/dungeon/monster/character/characterClass";

/**
 * Paladins clearly cannot be a member of a party with non-good characters,
 * and that includes Druids.
 *
 * I'm inferring Ranges and Assassins are not compatible either, due to
 * alignment conflict between good and evil.
 */
export const incompatibleClasses: Record<CharacterClass, CharacterClass[]> = {
  [CharacterClass.Paladin]: [CharacterClass.Assassin, CharacterClass.Druid],
  [CharacterClass.Assassin]: [CharacterClass.Paladin, CharacterClass.Ranger],
  [CharacterClass.Ranger]: [CharacterClass.Assassin],
  [CharacterClass.Cleric]: [],
  [CharacterClass.Druid]: [],
  [CharacterClass.Fighter]: [],
  [CharacterClass.MagicUser]: [],
  [CharacterClass.Illusionist]: [],
  [CharacterClass.Thief]: [],
  [CharacterClass.Monk]: [],
  [CharacterClass.Bard]: [],
  [CharacterClass.MonkBard]: [],
  [CharacterClass.ManAtArms]: [],
};
