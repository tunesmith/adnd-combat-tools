import type { Table } from './dungeonTypes';

export enum TreasureScrollProtectionElementals {
  Air,
  Earth,
  Fire,
  Water,
  All,
}

export const treasureScrollProtectionElementals: Table<TreasureScrollProtectionElementals> =
  {
    sides: 100,
    entries: [
      { range: [1, 15], command: TreasureScrollProtectionElementals.Air },
      { range: [16, 30], command: TreasureScrollProtectionElementals.Earth },
      { range: [31, 45], command: TreasureScrollProtectionElementals.Fire },
      { range: [46, 60], command: TreasureScrollProtectionElementals.Water },
      { range: [61, 100], command: TreasureScrollProtectionElementals.All },
    ],
  };
