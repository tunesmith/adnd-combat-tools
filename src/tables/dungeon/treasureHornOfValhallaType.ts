import type { Table } from './dungeonTypes';

export enum TreasureHornOfValhallaType {
  Silver,
  Brass,
  Bronze,
  Iron,
}

export const treasureHornOfValhallaType: Table<TreasureHornOfValhallaType> = {
  sides: 20,
  entries: [
    { range: [1, 8], command: TreasureHornOfValhallaType.Silver },
    { range: [9, 15], command: TreasureHornOfValhallaType.Brass },
    { range: [16, 18], command: TreasureHornOfValhallaType.Bronze },
    { range: [19, 20], command: TreasureHornOfValhallaType.Iron },
  ],
};
