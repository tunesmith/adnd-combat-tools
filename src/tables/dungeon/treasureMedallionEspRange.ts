import type { Table } from './dungeonTypes';

export enum TreasureMedallionRange {
  ThirtyFeet,
  ThirtyFeetWithEmpathy,
  SixtyFeet,
  NinetyFeet,
}

export const treasureMedallionRange: Table<TreasureMedallionRange> = {
  sides: 20,
  entries: [
    { range: [1, 15], command: TreasureMedallionRange.ThirtyFeet },
    {
      range: [16, 18],
      command: TreasureMedallionRange.ThirtyFeetWithEmpathy,
    },
    { range: [19], command: TreasureMedallionRange.SixtyFeet },
    { range: [20], command: TreasureMedallionRange.NinetyFeet },
  ],
};
