import type { Table } from './dungeonTypes';

export enum TreasureBracersOfDefense {
  AC8 = 8,
  AC7 = 7,
  AC6 = 6,
  AC5 = 5,
  AC4 = 4,
  AC3 = 3,
  AC2 = 2,
}

export const treasureBracersOfDefense: Table<TreasureBracersOfDefense> = {
  sides: 100,
  entries: [
    { range: [1, 5], command: TreasureBracersOfDefense.AC8 },
    { range: [6, 15], command: TreasureBracersOfDefense.AC7 },
    { range: [16, 35], command: TreasureBracersOfDefense.AC6 },
    { range: [36, 50], command: TreasureBracersOfDefense.AC5 },
    { range: [51, 70], command: TreasureBracersOfDefense.AC4 },
    { range: [71, 85], command: TreasureBracersOfDefense.AC3 },
    { range: [86, 100], command: TreasureBracersOfDefense.AC2 },
  ],
};
