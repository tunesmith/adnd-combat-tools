import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum ChamberDimensions {
  Square20x20,
  Square30x30,
  Square40x40,
  Rectangular20x30,
  Rectangular30x50,
  Rectangular40x60,
  Unusual,
}

export const chamberDimensions: Table<ChamberDimensions> = {
  sides: 20,
  entries: [
    { range: [1, 4], command: ChamberDimensions.Square20x20 },
    { range: [5, 6], command: ChamberDimensions.Square30x30 },
    { range: [7, 8], command: ChamberDimensions.Square40x40 },
    { range: [9, 13], command: ChamberDimensions.Rectangular20x30 },
    { range: [14, 15], command: ChamberDimensions.Rectangular30x50 },
    { range: [16, 17], command: ChamberDimensions.Rectangular40x60 },
    { range: [18, 20], command: ChamberDimensions.Unusual },
  ],
};

export enum RoomDimensions {
  Square10x10,
  Square20x20,
  Square30x30,
  Square40x40,
  Rectangular10x20,
  Rectangular20x30,
  Rectangular20x40,
  Rectangular30x40,
  Unusual,
}

export const roomDimensions: Table<RoomDimensions> = {
  sides: 20,
  entries: [
    { range: [1, 2], command: RoomDimensions.Square10x10 },
    { range: [3, 4], command: RoomDimensions.Square20x20 },
    { range: [5, 6], command: RoomDimensions.Square30x30 },
    { range: [7, 8], command: RoomDimensions.Square40x40 },
    { range: [9, 10], command: RoomDimensions.Rectangular10x20 },
    { range: [11, 13], command: RoomDimensions.Rectangular20x30 },
    { range: [14, 15], command: RoomDimensions.Rectangular20x40 },
    { range: [16, 17], command: RoomDimensions.Rectangular30x40 },
    { range: [18, 20], command: RoomDimensions.Unusual },
  ],
};

export enum ChamberRoomContents {
  Empty,
  MonsterOnly,
  MonsterAndTreasure,
  Special,
  TrickTrap,
  Treasure,
}

export const chamberRoomContents: Table<ChamberRoomContents> = {
  sides: 20,
  entries: [
    { range: [1, 12], command: ChamberRoomContents.Empty },
    { range: [13, 14], command: ChamberRoomContents.MonsterOnly },
    { range: [15, 17], command: ChamberRoomContents.MonsterAndTreasure },
    { range: [18], command: ChamberRoomContents.Special },
    { range: [19], command: ChamberRoomContents.TrickTrap },
    { range: [20], command: ChamberRoomContents.Treasure },
  ],
};

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
