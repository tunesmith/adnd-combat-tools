import type { Table } from "./dungeonTypes";

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
