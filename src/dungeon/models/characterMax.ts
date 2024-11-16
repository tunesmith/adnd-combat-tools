import { CharacterClass } from "../../tables/dungeon/monster/character/characterClass";

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
  [CharacterClass.ManAtArms]: 7,
};
