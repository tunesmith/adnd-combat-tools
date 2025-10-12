import type { Table } from './dungeonTypes';

export enum TreasureGirdleOfGiantStrength {
  Hill,
  Stone,
  Frost,
  Fire,
  Cloud,
  Storm,
}

export const treasureGirdleOfGiantStrength: Table<TreasureGirdleOfGiantStrength> =
  {
    sides: 100,
    entries: [
      { range: [1, 30], command: TreasureGirdleOfGiantStrength.Hill },
      { range: [31, 50], command: TreasureGirdleOfGiantStrength.Stone },
      { range: [51, 70], command: TreasureGirdleOfGiantStrength.Frost },
      { range: [71, 85], command: TreasureGirdleOfGiantStrength.Fire },
      { range: [86, 95], command: TreasureGirdleOfGiantStrength.Cloud },
      { range: [96, 100], command: TreasureGirdleOfGiantStrength.Storm },
    ],
  };
