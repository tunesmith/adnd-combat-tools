import type { Table } from './dungeonTypes';

export enum ExitLocation {
  OppositeWall,
  LeftWall,
  RightWall,
  SameWall,
}

export const exitLocation: Table<ExitLocation> = {
  sides: 20,
  entries: [
    { range: [1, 7], command: ExitLocation.OppositeWall },
    { range: [8, 12], command: ExitLocation.LeftWall },
    { range: [13, 17], command: ExitLocation.RightWall },
    { range: [18, 20], command: ExitLocation.SameWall },
  ],
};

export enum ExitAlternative {
  SecretDoor,
  OneWayDoor,
  OppositeDirection,
}

export const exitAlternative: Table<ExitAlternative> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: ExitAlternative.SecretDoor },
    { range: [6, 10], command: ExitAlternative.OneWayDoor },
    { range: [11, 20], command: ExitAlternative.OppositeDirection },
  ],
};
