import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum DoorLocation {
  Left,
  Right,
  Ahead,
}

export const doorLocation: Table<DoorLocation> = {
  sides: 20,
  entries: [
    { range: [1, 6], command: DoorLocation.Left },
    { range: [7, 12], command: DoorLocation.Right },
    { range: [13, 20], command: DoorLocation.Ahead },
  ],
};

export enum PeriodicCheckDoorOnly {
  Ignore,
  Door,
}

export const periodicCheckDoorOnly: Table<PeriodicCheckDoorOnly> = {
  sides: 20,
  entries: [
    { range: [1, 2], command: PeriodicCheckDoorOnly.Ignore },
    { range: [3, 5], command: PeriodicCheckDoorOnly.Door },
    { range: [6, 20], command: PeriodicCheckDoorOnly.Ignore },
  ],
};
