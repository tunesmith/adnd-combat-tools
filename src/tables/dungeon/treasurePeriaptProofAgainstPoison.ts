import type { Table } from './dungeonTypes';

export enum TreasurePeriaptPoisonBonus {
  PlusOne = 1,
  PlusTwo,
  PlusThree,
  PlusFour,
}

export const treasurePeriaptPoisonBonus: Table<TreasurePeriaptPoisonBonus> = {
  sides: 20,
  entries: [
    { range: [1, 8], command: TreasurePeriaptPoisonBonus.PlusOne },
    { range: [9, 14], command: TreasurePeriaptPoisonBonus.PlusTwo },
    { range: [15, 18], command: TreasurePeriaptPoisonBonus.PlusThree },
    { range: [19, 20], command: TreasurePeriaptPoisonBonus.PlusFour },
  ],
};
