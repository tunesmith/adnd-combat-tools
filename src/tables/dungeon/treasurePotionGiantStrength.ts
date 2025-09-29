import type { Table } from './dungeonTypes';

export enum TreasurePotionGiantStrength {
  Hill,
  Stone,
  Frost,
  Fire,
  Cloud,
  Storm,
}

export const treasurePotionGiantStrength: Table<TreasurePotionGiantStrength> = {
  sides: 20,
  entries: [
    { range: [1, 6], command: TreasurePotionGiantStrength.Hill },
    { range: [7, 10], command: TreasurePotionGiantStrength.Stone },
    { range: [11, 14], command: TreasurePotionGiantStrength.Frost },
    { range: [15, 17], command: TreasurePotionGiantStrength.Fire },
    { range: [18, 19], command: TreasurePotionGiantStrength.Cloud },
    { range: [20], command: TreasurePotionGiantStrength.Storm },
  ],
};
