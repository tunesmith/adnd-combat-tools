import type { Table } from './dungeonTypes';

export enum TreasureDeckOfManyThings {
  ThirteenPlaques,
  TwentyTwoPlaques,
}

export const treasureDeckOfManyThings: Table<TreasureDeckOfManyThings> = {
  sides: 100,
  entries: [
    { range: [1, 75], command: TreasureDeckOfManyThings.ThirteenPlaques },
    { range: [76, 100], command: TreasureDeckOfManyThings.TwentyTwoPlaques },
  ],
};
