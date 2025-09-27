import type { Table } from './dungeonTypes';

export enum ChamberRoomStairs {
  UpOneLevel,
  UpTwoLevels,
  DownOneLevel,
  DownTwoLevels,
  DownThreeLevels,
}

export const chamberRoomStairs: Table<ChamberRoomStairs> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: ChamberRoomStairs.UpOneLevel },
    { range: [6, 8], command: ChamberRoomStairs.UpTwoLevels },
    { range: [9, 14], command: ChamberRoomStairs.DownOneLevel },
    { range: [15, 19], command: ChamberRoomStairs.DownTwoLevels },
    { range: [20], command: ChamberRoomStairs.DownThreeLevels },
  ],
};
