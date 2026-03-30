import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum PeriodicCheck {
  ContinueStraight,
  Door,
  SidePassage,
  PassageTurn,
  Chamber,
  Stairs,
  DeadEnd,
  TrickTrap,
  WanderingMonster,
}
export const periodicCheck: Table<PeriodicCheck> = {
  sides: 20,
  entries: [
    { range: [1, 2], command: PeriodicCheck.ContinueStraight },
    { range: [3, 5], command: PeriodicCheck.Door },
    { range: [6, 10], command: PeriodicCheck.SidePassage },
    { range: [11, 13], command: PeriodicCheck.PassageTurn },
    { range: [14, 16], command: PeriodicCheck.Chamber },
    { range: [17], command: PeriodicCheck.Stairs },
    { range: [18], command: PeriodicCheck.DeadEnd },
    { range: [19], command: PeriodicCheck.TrickTrap },
    { range: [20], command: PeriodicCheck.WanderingMonster },
  ],
};

export enum DoorBeyond {
  ParallelPassageOrCloset,
  PassageStraightAhead,
  Passage45AheadBehind,
  Passage45BehindAhead,
  Room,
  Chamber,
}

export const doorBeyond: Table<DoorBeyond> = {
  sides: 20,
  entries: [
    { range: [1, 4], command: DoorBeyond.ParallelPassageOrCloset },
    { range: [5, 8], command: DoorBeyond.PassageStraightAhead },
    { range: [9], command: DoorBeyond.Passage45AheadBehind },
    { range: [10], command: DoorBeyond.Passage45BehindAhead },
    { range: [11, 18], command: DoorBeyond.Room },
    { range: [19, 20], command: DoorBeyond.Chamber },
  ],
};
