import type { Table } from './dungeonTypes';

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
