import { CharacterRace } from "../../tables/dungeon/monster/character/characterRace";
import { CharacterClass } from "../../tables/dungeon/monster/character/characterClass";

export const allowedMultiClassCombinationsByRace: Record<
  CharacterRace,
  CharacterClass[][]
> = {
  [CharacterRace.Human]: [], // Humans cannot multi-class
  [CharacterRace.Dwarf]: [[CharacterClass.Fighter, CharacterClass.Thief]],
  [CharacterRace.Elf]: [
    [CharacterClass.Fighter, CharacterClass.Thief],
    [CharacterClass.Fighter, CharacterClass.MagicUser],
    [CharacterClass.MagicUser, CharacterClass.Thief],
    [CharacterClass.Fighter, CharacterClass.MagicUser, CharacterClass.Thief],
  ],
  [CharacterRace.Gnome]: [
    [CharacterClass.Fighter, CharacterClass.Illusionist],
    [CharacterClass.Fighter, CharacterClass.Thief],
    [CharacterClass.Illusionist, CharacterClass.Thief],
  ],
  [CharacterRace.HalfElf]: [
    [CharacterClass.Cleric, CharacterClass.Ranger],
    [CharacterClass.Cleric, CharacterClass.Fighter],
    [CharacterClass.Cleric, CharacterClass.MagicUser],
    [CharacterClass.Fighter, CharacterClass.MagicUser],
    [CharacterClass.Fighter, CharacterClass.Thief],
    [CharacterClass.MagicUser, CharacterClass.Thief],
    [CharacterClass.Cleric, CharacterClass.Fighter, CharacterClass.MagicUser],
    [CharacterClass.Fighter, CharacterClass.MagicUser, CharacterClass.Thief],
  ],
  [CharacterRace.Halfling]: [[CharacterClass.Fighter, CharacterClass.Thief]],
  [CharacterRace.HalfOrc]: [
    [CharacterClass.Cleric, CharacterClass.Fighter],
    [CharacterClass.Cleric, CharacterClass.Thief],
    [CharacterClass.Cleric, CharacterClass.Assassin],
    [CharacterClass.Fighter, CharacterClass.Thief],
    [CharacterClass.Fighter, CharacterClass.Assassin],
  ],
};
