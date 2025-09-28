import type { Table } from './dungeonTypes';

export enum TreasurePotionDragonControl {
  White,
  Black,
  Green,
  Blue,
  Red,
  Brass,
  Copper,
  Bronze,
  Silver,
  Gold,
  Evil,
  Good,
}

export const treasurePotionDragonControl: Table<TreasurePotionDragonControl> = {
  sides: 20,
  entries: [
    { range: [1, 2], command: TreasurePotionDragonControl.White },
    { range: [3, 4], command: TreasurePotionDragonControl.Black },
    { range: [5, 7], command: TreasurePotionDragonControl.Green },
    { range: [8, 9], command: TreasurePotionDragonControl.Blue },
    { range: [10], command: TreasurePotionDragonControl.Red },
    { range: [11, 12], command: TreasurePotionDragonControl.Brass },
    { range: [13, 14], command: TreasurePotionDragonControl.Copper },
    { range: [15], command: TreasurePotionDragonControl.Bronze },
    { range: [16], command: TreasurePotionDragonControl.Silver },
    { range: [17], command: TreasurePotionDragonControl.Gold },
    { range: [18, 19], command: TreasurePotionDragonControl.Evil },
    { range: [20], command: TreasurePotionDragonControl.Good },
  ],
};
