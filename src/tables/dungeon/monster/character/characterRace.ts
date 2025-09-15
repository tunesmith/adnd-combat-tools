import type { Table } from '../../dungeonTypes';

export enum CharacterRace {
  Human,
  Dwarf,
  Elf,
  Gnome,
  HalfElf,
  Halfling,
  HalfOrc,
}

export const characterRace: Table<CharacterRace> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: CharacterRace.Dwarf },
    { range: [26, 50], command: CharacterRace.Elf },
    { range: [51, 60], command: CharacterRace.Gnome },
    { range: [61, 85], command: CharacterRace.HalfElf },
    { range: [86, 95], command: CharacterRace.Halfling },
    { range: [96, 100], command: CharacterRace.HalfOrc },
  ],
};
