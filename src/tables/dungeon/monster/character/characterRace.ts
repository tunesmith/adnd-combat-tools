import { Table } from "../../dungeonTypes";

export enum Race {
  Human,
  Dwarf,
  Elf,
  Gnome,
  HalfElf,
  Halfling,
  HalfOrc,
}

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
