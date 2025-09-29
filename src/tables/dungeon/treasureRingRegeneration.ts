import type { Table } from './dungeonTypes';

export enum TreasureRingRegeneration {
  Standard,
  Vampiric,
}

export const treasureRingRegeneration: Table<TreasureRingRegeneration> = {
  sides: 100,
  entries: [
    { range: [1, 90], command: TreasureRingRegeneration.Standard },
    { range: [91, 100], command: TreasureRingRegeneration.Vampiric },
  ],
};
