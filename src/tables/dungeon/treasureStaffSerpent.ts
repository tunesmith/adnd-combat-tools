import type { Table } from './dungeonTypes';

export enum TreasureStaffSerpent {
  Python,
  Adder,
}

export const treasureStaffSerpent: Table<TreasureStaffSerpent> = {
  sides: 100,
  entries: [
    { range: [1, 60], command: TreasureStaffSerpent.Python },
    { range: [61, 100], command: TreasureStaffSerpent.Adder },
  ],
};
