import type { Table } from './dungeonTypes';

export enum PassageTurns {
  Left90,
  Left45,
  Left135,
  Right90,
  Right45,
  Right135,
}
export const passageTurns: Table<PassageTurns> = {
  sides: 20,
  entries: [
    { range: [1, 8], command: PassageTurns.Left90 },
    { range: [9], command: PassageTurns.Left45 },
    { range: [10], command: PassageTurns.Left135 },
    { range: [11, 18], command: PassageTurns.Right90 },
    { range: [19], command: PassageTurns.Right45 },
    { range: [20], command: PassageTurns.Right135 },
  ],
};
