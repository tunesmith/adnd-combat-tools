import type { Table } from "./dungeonTypes";

export enum UnusualShape {
  Circular,
  Triangular,
  Trapezoidal,
  OddShaped,
  Oval,
  Hexagonal,
  Octagonal,
  Cave,
}
export const unusualShape: Table<UnusualShape> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: UnusualShape.Circular },
    { range: [6, 8], command: UnusualShape.Triangular },
    { range: [9, 11], command: UnusualShape.Trapezoidal },
    { range: [12, 13], command: UnusualShape.OddShaped },
    { range: [14, 15], command: UnusualShape.Oval },
    { range: [16, 17], command: UnusualShape.Hexagonal },
    { range: [18, 19], command: UnusualShape.Octagonal },
    { range: [20], command: UnusualShape.Cave },
  ],
};

export enum CircularContents {
  Pool,
  Well,
  Shaft,
  Normal,
}
export const circularContents: Table<CircularContents> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: CircularContents.Pool },
    { range: [6, 7], command: CircularContents.Well },
    { range: [8, 10], command: CircularContents.Shaft },
    { range: [11, 20], command: CircularContents.Normal },
  ],
};
