import type { Table } from './dungeonTypes';

export enum TreasureBagOfHolding {
  TypeI = 1,
  TypeII,
  TypeIII,
  TypeIV,
}

export const treasureBagOfHolding: Table<TreasureBagOfHolding> = {
  sides: 100,
  entries: [
    { range: [1, 30], command: TreasureBagOfHolding.TypeI },
    { range: [31, 70], command: TreasureBagOfHolding.TypeII },
    { range: [71, 90], command: TreasureBagOfHolding.TypeIII },
    { range: [91, 100], command: TreasureBagOfHolding.TypeIV },
  ],
};

export const BAG_OF_HOLDING_STATS: Record<
  TreasureBagOfHolding,
  {
    bagWeight: number;
    weightLimit: number;
    volumeLimit: number;
  }
> = {
  [TreasureBagOfHolding.TypeI]: {
    bagWeight: 15,
    weightLimit: 250,
    volumeLimit: 30,
  },
  [TreasureBagOfHolding.TypeII]: {
    bagWeight: 15,
    weightLimit: 500,
    volumeLimit: 70,
  },
  [TreasureBagOfHolding.TypeIII]: {
    bagWeight: 35,
    weightLimit: 1000,
    volumeLimit: 150,
  },
  [TreasureBagOfHolding.TypeIV]: {
    bagWeight: 60,
    weightLimit: 1500,
    volumeLimit: 250,
  },
};
