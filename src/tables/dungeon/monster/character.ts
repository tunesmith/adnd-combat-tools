import { Table } from "../dungeonTypes";
import { CharacterRace } from "./character/characterRace";

export enum CharacterClass {
  Cleric,
  Druid,
  Fighter,
  Paladin,
  Ranger,
  MagicUser,
  Illusionist,
  Thief,
  Assassin,
  MonkBard,
  ManAtArms,
}

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

export const characterClass: Table<CharacterClass> = {
  sides: 100,
  entries: [
    { range: [1, 17], command: CharacterClass.Cleric },
    { range: [18, 20], command: CharacterClass.Druid },
    { range: [21, 60], command: CharacterClass.Fighter },
    { range: [61, 62], command: CharacterClass.Paladin },
    { range: [63, 65], command: CharacterClass.Ranger },
    { range: [66, 86], command: CharacterClass.MagicUser },
    { range: [87, 88], command: CharacterClass.Illusionist },
    { range: [89, 98], command: CharacterClass.Thief },
    { range: [99], command: CharacterClass.Assassin },
    { range: [100], command: CharacterClass.MonkBard },
  ],
};

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
  [CharacterClass.MonkBard]: [],
  [CharacterClass.ManAtArms]: [],
};

/**
 * PHB mentions racial tolerances. We'll rule out "Hate"
 * but not "Antipathy".
 */
export const incompatibleRaces: Record<CharacterRace, CharacterRace[]> = {
  [CharacterRace.Human]: [],
  [CharacterRace.Dwarf]: [CharacterRace.HalfOrc],
  [CharacterRace.Elf]: [],
  [CharacterRace.Gnome]: [CharacterRace.HalfOrc],
  [CharacterRace.HalfElf]: [],
  [CharacterRace.Halfling]: [],
  [CharacterRace.HalfOrc]: [CharacterRace.Dwarf, CharacterRace.Gnome],
};

export const multiClassLikelihood: Record<CharacterRace, number> = {
  [CharacterRace.Human]: 0, // Humans cannot be multi-class in 1e
  [CharacterRace.Dwarf]: 15, // 15% chance
  [CharacterRace.Elf]: 85, // 85% chance
  [CharacterRace.Gnome]: 50, // Example value
  [CharacterRace.HalfElf]: 75, // 75% chance
  [CharacterRace.Halfling]: 10, // Example value
  [CharacterRace.HalfOrc]: 20, // Example value
};

export const raceToClasses: Record<CharacterRace, CharacterClass[]> = {
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

export const multiClassCombinations: Record<CharacterRace, CharacterClass[][]> =
  {
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
