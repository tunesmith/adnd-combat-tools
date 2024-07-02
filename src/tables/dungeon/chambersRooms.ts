import { Table } from "./dungeonTypes";

export enum ChamberDimensions {
  Square20x20,
  Square30x30,
  Square40x40,
  Rectangular20x30,
  Rectangular30x50,
  Rectangular40x60,
  Unusual,
}
export const chamberDimensions: Table = {
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
export const roomDimensions: Table = {
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
