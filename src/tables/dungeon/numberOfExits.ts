import type { Table } from "./dungeonTypes";

export enum NumberOfExits {
  OneTwo600,
  TwoThree600,
  ThreeFour600,
  ZeroOne1200,
  ZeroOne1600,
  OneToFour,
  DoorChamberOrPassageRoom,
}
export const numberOfExits: Table<NumberOfExits> = {
  sides: 20,
  entries: [
    { range: [1, 3], command: NumberOfExits.OneTwo600 },
    { range: [4, 6], command: NumberOfExits.TwoThree600 },
    { range: [7, 9], command: NumberOfExits.ThreeFour600 },
    { range: [10, 12], command: NumberOfExits.ZeroOne1200 },
    { range: [13, 15], command: NumberOfExits.ZeroOne1600 },
    { range: [16, 18], command: NumberOfExits.OneToFour },
    { range: [19, 20], command: NumberOfExits.DoorChamberOrPassageRoom },
  ],
};

export enum OneToFour {
  One,
  Two,
  Three,
  Four,
}
export const oneToFour: Table<OneToFour> = {
  sides: 4,
  entries: [
    { range: [1], command: OneToFour.One },
    { range: [2], command: OneToFour.Two },
    { range: [3], command: OneToFour.Three },
    { range: [4], command: OneToFour.Four },
  ],
};
