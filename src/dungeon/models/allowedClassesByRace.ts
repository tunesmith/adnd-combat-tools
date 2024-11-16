import { CharacterRace } from "../../tables/dungeon/monster/character/characterRace";
import { CharacterClass } from "../../tables/dungeon/monster/character/characterClass";

export const allowedClassesByRace: Record<CharacterRace, CharacterClass[]> = {
  [CharacterRace.Human]: [
    CharacterClass.Cleric,
    CharacterClass.Druid,
    CharacterClass.Fighter,
    CharacterClass.Paladin,
    CharacterClass.Ranger,
    CharacterClass.MagicUser,
    CharacterClass.Illusionist,
    CharacterClass.Thief,
    CharacterClass.Assassin,
    CharacterClass.MonkBard,
  ],
  [CharacterRace.Dwarf]: [
    CharacterClass.Fighter,
    CharacterClass.Thief,
    CharacterClass.Assassin,
  ],
  [CharacterRace.Elf]: [
    CharacterClass.Fighter,
    CharacterClass.MagicUser,
    CharacterClass.Thief,
    CharacterClass.Assassin,
  ],
  [CharacterRace.Gnome]: [
    CharacterClass.Fighter,
    CharacterClass.Illusionist,
    CharacterClass.Thief,
    CharacterClass.Assassin,
  ],
  [CharacterRace.HalfElf]: [
    CharacterClass.Cleric,
    CharacterClass.Druid,
    CharacterClass.Fighter,
    CharacterClass.Ranger,
    CharacterClass.MagicUser,
    CharacterClass.Thief,
    CharacterClass.Assassin,
  ],
  [CharacterRace.Halfling]: [CharacterClass.Fighter, CharacterClass.Thief],
  [CharacterRace.HalfOrc]: [
    CharacterClass.Cleric,
    CharacterClass.Fighter,
    CharacterClass.Thief,
    CharacterClass.Assassin,
  ],
};
