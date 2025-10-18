import type { Table } from './dungeonTypes';

export enum TreasurePearlOfWisdomOutcome {
  LoseOne,
  GainOne,
}

export const treasurePearlOfWisdom: Table<TreasurePearlOfWisdomOutcome> = {
  sides: 20,
  entries: [
    { range: [1], command: TreasurePearlOfWisdomOutcome.LoseOne },
    { range: [2, 20], command: TreasurePearlOfWisdomOutcome.GainOne },
  ],
};
