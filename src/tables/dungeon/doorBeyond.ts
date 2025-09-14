import type { Table } from "./dungeonTypes";

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
