import type { Table } from './dungeonTypes';

export enum TreasureCarpetOfFlying {
  ThreeByFive = "3' × 5'",
  FourBySix = "4' × 6'",
  FiveBySeven = "5' × 7'",
  SixByNine = "6' × 9'",
}

export const treasureCarpetOfFlying: Table<TreasureCarpetOfFlying> = {
  sides: 100,
  entries: [
    { range: [1, 20], command: TreasureCarpetOfFlying.ThreeByFive },
    { range: [21, 55], command: TreasureCarpetOfFlying.FourBySix },
    { range: [56, 80], command: TreasureCarpetOfFlying.FiveBySeven },
    { range: [81, 100], command: TreasureCarpetOfFlying.SixByNine },
  ],
};
