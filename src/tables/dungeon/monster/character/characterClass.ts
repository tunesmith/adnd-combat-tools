import { Table } from "../../dungeonTypes";

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
