import { Table } from "./dungeonTypes";

// (Don't use for Doors)
export enum ExitDirection {
  StraightAhead,
  LeftRight45,
  RightLeft45,
}
export const exitDirection: Table = {
  sides: 20,
  entries: [
    { range: [1, 16], command: ExitDirection.StraightAhead },
    { range: [17, 18], command: ExitDirection.LeftRight45 },
    { range: [19, 20], command: ExitDirection.RightLeft45 },
  ],
};
