import { Table } from "./dungeonTypes";

export enum DoorLocation {
  Left,
  Right,
  Ahead,
}
export const doorLocation: Table = {
  sides: 20,
  entries: [
    { range: [1, 6], command: DoorLocation.Left },
    { range: [7, 12], command: DoorLocation.Right },
    { range: [13, 20], command: DoorLocation.Ahead },
  ],
};
