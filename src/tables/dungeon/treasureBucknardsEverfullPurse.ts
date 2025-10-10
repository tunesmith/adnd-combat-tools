import type { Table } from './dungeonTypes';

export enum TreasureBucknardsEverfullPurse {
  Gold = 1,
  Platinum,
  Gems,
}

export const treasureBucknardsEverfullPurse: Table<TreasureBucknardsEverfullPurse> =
  {
    sides: 100,
    entries: [
      { range: [1, 50], command: TreasureBucknardsEverfullPurse.Gold },
      { range: [51, 90], command: TreasureBucknardsEverfullPurse.Platinum },
      { range: [91, 100], command: TreasureBucknardsEverfullPurse.Gems },
    ],
  };
