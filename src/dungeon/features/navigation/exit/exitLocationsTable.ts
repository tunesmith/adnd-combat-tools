import type { Table } from '../../../../tables/dungeon/dungeonTypes';

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

export enum ExitDirection {
  StraightAhead,
  LeftRight45,
  RightLeft45,
}

export const exitDirection: Table<ExitDirection> = {
  sides: 20,
  entries: [
    { range: [1, 16], command: ExitDirection.StraightAhead },
    { range: [17, 18], command: ExitDirection.LeftRight45 },
    { range: [19, 20], command: ExitDirection.RightLeft45 },
  ],
};
