import type { Table } from './dungeonTypes';

export enum TreasureRingThreeWishes {
  Limited,
  Standard,
}

export const treasureRingThreeWishes: Table<TreasureRingThreeWishes> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasureRingThreeWishes.Limited },
    { range: [26, 100], command: TreasureRingThreeWishes.Standard },
  ],
};
