import type { Table } from './dungeonTypes';

export enum TreasureBagOfTricks {
  Weasel = 1,
  Rat,
  Jackal,
}

export const treasureBagOfTricks: Table<TreasureBagOfTricks> = {
  sides: 10,
  entries: [
    { range: [1, 5], command: TreasureBagOfTricks.Weasel },
    { range: [6, 8], command: TreasureBagOfTricks.Rat },
    { range: [9, 10], command: TreasureBagOfTricks.Jackal },
  ],
};
