import type { Table } from './dungeonTypes';

export enum TreasurePhylacteryLongYearsOutcome {
  FastAging,
  SlowAging,
}

export const treasurePhylacteryLongYears: Table<TreasurePhylacteryLongYearsOutcome> = {
  sides: 20,
  entries: [
    { range: [1], command: TreasurePhylacteryLongYearsOutcome.FastAging },
    { range: [2, 20], command: TreasurePhylacteryLongYearsOutcome.SlowAging },
  ],
};
