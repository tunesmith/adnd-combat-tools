import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum PassageWidth {
  FiveFeet,
  TenFeet,
  TwentyFeet,
  ThirtyFeet,
  SpecialPassage,
}

export const passageWidth: Table<PassageWidth> = {
  sides: 20,
  entries: [
    { range: [1, 9], command: PassageWidth.TenFeet },
    { range: [10, 12], command: PassageWidth.FiveFeet },
    { range: [13, 15], command: PassageWidth.TwentyFeet },
    { range: [16, 17], command: PassageWidth.ThirtyFeet },
    { range: [18, 20], command: PassageWidth.SpecialPassage },
  ],
};
