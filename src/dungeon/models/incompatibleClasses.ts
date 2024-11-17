import { CharacterClass } from "../../tables/dungeon/monster/character/characterClass";

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
