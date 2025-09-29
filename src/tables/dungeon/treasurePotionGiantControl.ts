import type { Table } from './dungeonTypes';

export enum TreasurePotionGiantControl {
  Hill,
  Stone,
  Frost,
  Fire,
  Cloud,
  Storm,
}

export const treasurePotionGiantControl: Table<TreasurePotionGiantControl> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: TreasurePotionGiantControl.Hill },
    { range: [6, 9], command: TreasurePotionGiantControl.Stone },
    { range: [10, 13], command: TreasurePotionGiantControl.Frost },
    { range: [14, 17], command: TreasurePotionGiantControl.Fire },
    { range: [18, 19], command: TreasurePotionGiantControl.Cloud },
    { range: [20], command: TreasurePotionGiantControl.Storm },
  ],
};
