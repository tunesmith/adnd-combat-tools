import type { Table } from './dungeonTypes';

export enum TreasureCrystalBall {
  Standard,
  Clairaudience,
  Esp,
  Telepathy,
}

export const treasureCrystalBall: Table<TreasureCrystalBall> = {
  sides: 100,
  entries: [
    { range: [1, 50], command: TreasureCrystalBall.Standard },
    { range: [51, 75], command: TreasureCrystalBall.Clairaudience },
    { range: [76, 90], command: TreasureCrystalBall.Esp },
    { range: [91, 100], command: TreasureCrystalBall.Telepathy },
  ],
};
