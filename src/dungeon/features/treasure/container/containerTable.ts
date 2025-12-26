import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum TreasureContainer {
  Bags,
  Sacks,
  SmallCoffers,
  Chests,
  HugeChests,
  PotteryJars,
  MetalUrns,
  StoneContainers,
  IronTrunks,
  Loose,
}

export const treasureContainer: Table<TreasureContainer> = {
  sides: 20,
  entries: [
    { range: [1, 2], command: TreasureContainer.Bags },
    { range: [3, 4], command: TreasureContainer.Sacks },
    { range: [5, 6], command: TreasureContainer.SmallCoffers },
    { range: [7, 8], command: TreasureContainer.Chests },
    { range: [9, 10], command: TreasureContainer.HugeChests },
    { range: [11, 12], command: TreasureContainer.PotteryJars },
    { range: [13, 14], command: TreasureContainer.MetalUrns },
    { range: [15, 16], command: TreasureContainer.StoneContainers },
    { range: [17, 18], command: TreasureContainer.IronTrunks },
    { range: [19, 20], command: TreasureContainer.Loose },
  ],
};
