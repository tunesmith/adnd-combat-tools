import type { Table } from './dungeonTypes';

export enum TreasureFigurineOfWondrousPower {
  EbonyFly,
  GoldenLions,
  IvoryGoats,
  MarbleElephant,
  ObsidianSteed,
  OnyxDog,
  SerpentineOwl,
}

export const treasureFigurineOfWondrousPower: Table<TreasureFigurineOfWondrousPower> =
  {
    sides: 100,
    entries: [
      { range: [1, 15], command: TreasureFigurineOfWondrousPower.EbonyFly },
      { range: [16, 30], command: TreasureFigurineOfWondrousPower.GoldenLions },
      { range: [31, 40], command: TreasureFigurineOfWondrousPower.IvoryGoats },
      {
        range: [41, 55],
        command: TreasureFigurineOfWondrousPower.MarbleElephant,
      },
      {
        range: [56, 65],
        command: TreasureFigurineOfWondrousPower.ObsidianSteed,
      },
      { range: [66, 85], command: TreasureFigurineOfWondrousPower.OnyxDog },
      {
        range: [86, 100],
        command: TreasureFigurineOfWondrousPower.SerpentineOwl,
      },
    ],
  };
