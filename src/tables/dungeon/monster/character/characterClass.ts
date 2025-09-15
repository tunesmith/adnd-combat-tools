import type { Table } from '../../dungeonTypes';

export enum CharacterClassTable {
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
}

export const characterClass: Table<CharacterClassTable> = {
  sides: 100,
  entries: [
    { range: [1, 17], command: CharacterClassTable.Cleric },
    { range: [18, 20], command: CharacterClassTable.Druid },
    { range: [21, 60], command: CharacterClassTable.Fighter },
    { range: [61, 62], command: CharacterClassTable.Paladin },
    { range: [63, 65], command: CharacterClassTable.Ranger },
    { range: [66, 86], command: CharacterClassTable.MagicUser },
    { range: [87, 88], command: CharacterClassTable.Illusionist },
    { range: [89, 98], command: CharacterClassTable.Thief },
    { range: [99], command: CharacterClassTable.Assassin },
    { range: [100], command: CharacterClassTable.MonkBard },
  ],
};
