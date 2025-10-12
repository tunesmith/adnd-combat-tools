import type { Table } from './dungeonTypes';

export enum TreasureHornOfValhallaAlignment {
  LawfulGood,
  LawfulNeutral,
  LawfulEvil,
  NeutralEvil,
  ChaoticEvil,
  ChaoticNeutral,
  ChaoticGood,
  NeutralGood,
  Neutral,
}

export const treasureHornOfValhallaAlignment: Table<TreasureHornOfValhallaAlignment> =
  {
    sides: 10,
    entries: [
      { range: [1], command: TreasureHornOfValhallaAlignment.LawfulGood },
      { range: [2], command: TreasureHornOfValhallaAlignment.LawfulNeutral },
      { range: [3], command: TreasureHornOfValhallaAlignment.LawfulEvil },
      { range: [4], command: TreasureHornOfValhallaAlignment.NeutralEvil },
      { range: [5], command: TreasureHornOfValhallaAlignment.ChaoticEvil },
      { range: [6], command: TreasureHornOfValhallaAlignment.ChaoticNeutral },
      { range: [7], command: TreasureHornOfValhallaAlignment.ChaoticGood },
      { range: [8], command: TreasureHornOfValhallaAlignment.NeutralGood },
      { range: [9, 10], command: TreasureHornOfValhallaAlignment.Neutral },
    ],
  };
