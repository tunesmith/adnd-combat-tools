import type { Table } from './dungeonTypes';

export enum TreasureEyesOfPetrification {
  Basilisk,
  Normal,
}

export const treasureEyesOfPetrification: Table<TreasureEyesOfPetrification> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasureEyesOfPetrification.Basilisk },
    { range: [26, 100], command: TreasureEyesOfPetrification.Normal },
  ],
};
