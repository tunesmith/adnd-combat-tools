import type { Table } from '../../../../tables/dungeon/dungeonTypes';

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

export enum UnusualSize {
  SqFt500,
  SqFt900,
  SqFt1300,
  SqFt2000,
  SqFt2700,
  SqFt3400,
  RollAgain,
}

export const unusualSize: Table<UnusualSize> = {
  sides: 20,
  entries: [
    { range: [1, 3], command: UnusualSize.SqFt500 },
    { range: [4, 6], command: UnusualSize.SqFt900 },
    { range: [7, 8], command: UnusualSize.SqFt1300 },
    { range: [9, 10], command: UnusualSize.SqFt2000 },
    { range: [11, 12], command: UnusualSize.SqFt2700 },
    { range: [13, 14], command: UnusualSize.SqFt3400 },
    { range: [15, 20], command: UnusualSize.RollAgain },
  ],
};
