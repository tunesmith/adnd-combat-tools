import type { Table } from './dungeonTypes';

export enum TreasureScrollProtectionLycanthropes {
  Werebears,
  Wereboars,
  Wererats,
  Weretigers,
  Werewolves,
  AllLycanthropes,
  ShapeChangers,
}

export const treasureScrollProtectionLycanthropes: Table<TreasureScrollProtectionLycanthropes> =
  {
    sides: 100,
    entries: [
      {
        range: [1, 5],
        command: TreasureScrollProtectionLycanthropes.Werebears,
      },
      {
        range: [6, 10],
        command: TreasureScrollProtectionLycanthropes.Wereboars,
      },
      {
        range: [11, 20],
        command: TreasureScrollProtectionLycanthropes.Wererats,
      },
      {
        range: [21, 25],
        command: TreasureScrollProtectionLycanthropes.Weretigers,
      },
      {
        range: [26, 40],
        command: TreasureScrollProtectionLycanthropes.Werewolves,
      },
      {
        range: [41, 98],
        command: TreasureScrollProtectionLycanthropes.AllLycanthropes,
      },
      {
        range: [99, 100],
        command: TreasureScrollProtectionLycanthropes.ShapeChangers,
      },
    ],
  };
