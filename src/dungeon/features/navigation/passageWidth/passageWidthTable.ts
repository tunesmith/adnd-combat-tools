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
    { range: [1, 12], command: PassageWidth.TenFeet },
    { range: [13, 16], command: PassageWidth.TwentyFeet },
    { range: [17], command: PassageWidth.ThirtyFeet },
    { range: [18], command: PassageWidth.FiveFeet },
    { range: [19, 20], command: PassageWidth.SpecialPassage },
  ],
};
