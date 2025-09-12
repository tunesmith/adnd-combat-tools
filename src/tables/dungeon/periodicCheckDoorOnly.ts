import { Table } from "./dungeonTypes";

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

