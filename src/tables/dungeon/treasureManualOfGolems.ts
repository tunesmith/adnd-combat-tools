import type { Table } from './dungeonTypes';

export enum TreasureManualOfGolems {
  Clay,
  Flesh,
  Iron,
  Stone,
}

export const treasureManualOfGolems: Table<TreasureManualOfGolems> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: TreasureManualOfGolems.Clay },
    { range: [6, 17], command: TreasureManualOfGolems.Flesh },
    { range: [18], command: TreasureManualOfGolems.Iron },
    { range: [19, 20], command: TreasureManualOfGolems.Stone },
  ],
};
