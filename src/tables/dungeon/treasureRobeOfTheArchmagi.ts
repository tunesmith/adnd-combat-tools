import type { Table } from './dungeonTypes';

export enum TreasureRobeOfTheArchmagi {
  Good,
  Neutral,
  Evil,
}

export const treasureRobeOfTheArchmagi: Table<TreasureRobeOfTheArchmagi> = {
  sides: 100,
  entries: [
    { range: [1, 45], command: TreasureRobeOfTheArchmagi.Good },
    { range: [46, 75], command: TreasureRobeOfTheArchmagi.Neutral },
    { range: [76, 100], command: TreasureRobeOfTheArchmagi.Evil },
  ],
};
