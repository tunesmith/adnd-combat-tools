import type { Table } from "./dungeonTypes";

export enum ExitLocation {
  OppositeWall,
  LeftWall,
  RightWall,
  SameWall,
}
export const exitLocation: Table<ExitLocation> = {
  sides: 20,
  entries: [
    { range: [1, 3], command: ExitLocation.OppositeWall },
    { range: [4, 6], command: ExitLocation.LeftWall },
    { range: [7, 9], command: ExitLocation.RightWall },
    { range: [10, 12], command: ExitLocation.SameWall },
  ],
};

export enum StrangeDoor {
  SecretDoor,
  OneWayDoor,
  OppositeDirection,
}
export const strangeDoor: Table<StrangeDoor> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: StrangeDoor.SecretDoor },
    { range: [6, 10], command: StrangeDoor.OneWayDoor },
    { range: [11, 20], command: StrangeDoor.OppositeDirection },
  ],
};
