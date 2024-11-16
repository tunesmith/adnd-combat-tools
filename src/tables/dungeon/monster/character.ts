import { Table } from "../dungeonTypes";
import { CharacterRace } from "./character/characterRace";

export enum Character {
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

export const characterMax: Record<Character, number> = {
  [Character.Cleric]: 3,
  [Character.Druid]: 2,
  [Character.Fighter]: 5,
  [Character.Paladin]: 2,
  [Character.Ranger]: 2,
  [Character.MagicUser]: 3,
  [Character.Illusionist]: 4,
  [Character.Thief]: 1,
  [Character.Assassin]: 2,
  [Character.MonkBard]: 1,
  [Character.ManAtArms]: 7,
};

export const character: Table<Character> = {
  sides: 100,
  entries: [
    { range: [1, 17], command: Character.Cleric },
    { range: [18, 20], command: Character.Druid },
    { range: [21, 60], command: Character.Fighter },
    { range: [61, 62], command: Character.Paladin },
    { range: [63, 65], command: Character.Ranger },
    { range: [66, 86], command: Character.MagicUser },
    { range: [87, 88], command: Character.Illusionist },
    { range: [89, 98], command: Character.Thief },
    { range: [99], command: Character.Assassin },
    { range: [100], command: Character.MonkBard },
  ],
};

export const incompatibleClasses: Record<Character, Character[]> = {
  [Character.Paladin]: [Character.Assassin, Character.Druid],
  [Character.Assassin]: [Character.Paladin, Character.Ranger],
  [Character.Ranger]: [Character.Assassin],
  [Character.Cleric]: [],
  [Character.Druid]: [],
  [Character.Fighter]: [],
  [Character.MagicUser]: [],
  [Character.Illusionist]: [],
  [Character.Thief]: [],
  [Character.MonkBard]: [],
  [Character.ManAtArms]: [],
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

export const raceToClasses: Record<CharacterRace, Character[]> = {
  [CharacterRace.Human]: [
    Character.Cleric,
    Character.Druid,
    Character.Fighter,
    Character.Paladin,
    Character.Ranger,
    Character.MagicUser,
    Character.Illusionist,
    Character.Thief,
    Character.Assassin,
    Character.MonkBard,
  ],
  [CharacterRace.Dwarf]: [
    Character.Fighter,
    Character.Thief,
    Character.Assassin,
  ],
  [CharacterRace.Elf]: [
    Character.Fighter,
    Character.MagicUser,
    Character.Thief,
    Character.Assassin,
  ],
  [CharacterRace.Gnome]: [
    Character.Fighter,
    Character.Illusionist,
    Character.Thief,
    Character.Assassin,
  ],
  [CharacterRace.HalfElf]: [
    Character.Cleric,
    Character.Druid,
    Character.Fighter,
    Character.Ranger,
    Character.MagicUser,
    Character.Thief,
    Character.Assassin,
  ],
  [CharacterRace.Halfling]: [Character.Fighter, Character.Thief],
  [CharacterRace.HalfOrc]: [
    Character.Cleric,
    Character.Fighter,
    Character.Thief,
    Character.Assassin,
  ],
};

export const multiClassCombinations: Record<CharacterRace, Character[][]> = {
  [CharacterRace.Human]: [], // Humans cannot multi-class
  [CharacterRace.Dwarf]: [[Character.Fighter, Character.Thief]],
  [CharacterRace.Elf]: [
    [Character.Fighter, Character.Thief],
    [Character.Fighter, Character.MagicUser],
    [Character.MagicUser, Character.Thief],
    [Character.Fighter, Character.MagicUser, Character.Thief],
  ],
  [CharacterRace.Gnome]: [
    [Character.Fighter, Character.Illusionist],
    [Character.Fighter, Character.Thief],
    [Character.Illusionist, Character.Thief],
  ],
  [CharacterRace.HalfElf]: [
    [Character.Cleric, Character.Ranger],
    [Character.Cleric, Character.Fighter],
    [Character.Cleric, Character.MagicUser],
    [Character.Fighter, Character.MagicUser],
    [Character.Fighter, Character.Thief],
    [Character.MagicUser, Character.Thief],
    [Character.Cleric, Character.Fighter, Character.MagicUser],
    [Character.Fighter, Character.MagicUser, Character.Thief],
  ],
  [CharacterRace.Halfling]: [[Character.Fighter, Character.Thief]],
  [CharacterRace.HalfOrc]: [
    [Character.Cleric, Character.Fighter],
    [Character.Cleric, Character.Thief],
    [Character.Cleric, Character.Assassin],
    [Character.Fighter, Character.Thief],
    [Character.Fighter, Character.Assassin],
  ],
};
