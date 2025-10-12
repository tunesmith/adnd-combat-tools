import type { Table } from './dungeonTypes';

export enum TreasureHornOfValhallaAttunement {
  NonAligned,
  Aligned,
}

export const treasureHornOfValhallaAttunement: Table<TreasureHornOfValhallaAttunement> =
  {
    sides: 100,
    entries: [
      { range: [1, 50], command: TreasureHornOfValhallaAttunement.NonAligned },
      { range: [51, 100], command: TreasureHornOfValhallaAttunement.Aligned },
    ],
  };
