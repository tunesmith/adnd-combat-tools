import { Table } from "../dungeonTypes";

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

export enum Race {
  Human,
  Dwarf,
  Elf,
  Gnome,
  HalfElf,
  Halfling,
  HalfOrc,
}

/**
 * PHB mentions racial tolerances. We'll rule out "Hate"
 * but not "Antipathy".
 */
export const incompatibleRaces: Record<Race, Race[]> = {
  [Race.Human]: [],
  [Race.Dwarf]: [Race.HalfOrc],
  [Race.Elf]: [],
  [Race.Gnome]: [Race.HalfOrc],
  [Race.HalfElf]: [],
  [Race.Halfling]: [],
  [Race.HalfOrc]: [Race.Dwarf, Race.Gnome],
};

export const race: Table<Race> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: Race.Dwarf },
    { range: [26, 50], command: Race.Elf },
    { range: [51, 60], command: Race.Gnome },
    { range: [61, 85], command: Race.HalfElf },
    { range: [86, 95], command: Race.Halfling },
    { range: [96, 100], command: Race.HalfOrc },
  ],
};

export const multiClassLikelihood: Record<Race, number> = {
  [Race.Human]: 0, // Humans cannot be multi-class in 1e
  [Race.Dwarf]: 15, // 15% chance
  [Race.Elf]: 85, // 85% chance
  [Race.Gnome]: 50, // Example value
  [Race.HalfElf]: 75, // 75% chance
  [Race.Halfling]: 10, // Example value
  [Race.HalfOrc]: 20, // Example value
};

export const raceToClasses: Record<Race, Character[]> = {
  [Race.Human]: [
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
  [Race.Dwarf]: [Character.Fighter, Character.Thief, Character.Assassin],
  [Race.Elf]: [
    Character.Fighter,
    Character.MagicUser,
    Character.Thief,
    Character.Assassin,
  ],
  [Race.Gnome]: [
    Character.Fighter,
    Character.Illusionist,
    Character.Thief,
    Character.Assassin,
  ],
  [Race.HalfElf]: [
    Character.Cleric,
    Character.Druid,
    Character.Fighter,
    Character.Ranger,
    Character.MagicUser,
    Character.Thief,
    Character.Assassin,
  ],
  [Race.Halfling]: [Character.Fighter, Character.Thief],
  [Race.HalfOrc]: [
    Character.Cleric,
    Character.Fighter,
    Character.Thief,
    Character.Assassin,
  ],
};

export const multiClassCombinations: Record<Race, Character[][]> = {
  [Race.Human]: [], // Humans cannot multi-class
  [Race.Dwarf]: [[Character.Fighter, Character.Thief]],
  [Race.Elf]: [
    [Character.Fighter, Character.Thief],
    [Character.Fighter, Character.MagicUser],
    [Character.MagicUser, Character.Thief],
    [Character.Fighter, Character.MagicUser, Character.Thief],
  ],
  [Race.Gnome]: [
    [Character.Fighter, Character.Illusionist],
    [Character.Fighter, Character.Thief],
    [Character.Illusionist, Character.Thief],
  ],
  [Race.HalfElf]: [
    [Character.Cleric, Character.Ranger],
    [Character.Cleric, Character.Fighter],
    [Character.Cleric, Character.MagicUser],
    [Character.Fighter, Character.MagicUser],
    [Character.Fighter, Character.Thief],
    [Character.MagicUser, Character.Thief],
    [Character.Cleric, Character.Fighter, Character.MagicUser],
    [Character.Fighter, Character.MagicUser, Character.Thief],
  ],
  [Race.Halfling]: [[Character.Fighter, Character.Thief]],
  [Race.HalfOrc]: [
    [Character.Cleric, Character.Fighter],
    [Character.Cleric, Character.Thief],
    [Character.Cleric, Character.Assassin],
    [Character.Fighter, Character.Thief],
    [Character.Fighter, Character.Assassin],
  ],
};
