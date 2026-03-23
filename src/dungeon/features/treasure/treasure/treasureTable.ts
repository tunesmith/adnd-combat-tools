import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum TreasureWithoutMonster {
  CopperPerLevel,
  SilverPerLevel,
  ElectrumPerLevel,
  GoldPerLevel,
  PlatinumPerLevel,
  GemsPerLevel,
  JewelryPerLevel,
  Magic,
}

export const treasureWithoutMonster: Table<TreasureWithoutMonster> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasureWithoutMonster.CopperPerLevel },
    { range: [26, 50], command: TreasureWithoutMonster.SilverPerLevel },
    { range: [51, 65], command: TreasureWithoutMonster.ElectrumPerLevel },
    { range: [66, 80], command: TreasureWithoutMonster.GoldPerLevel },
    { range: [81, 90], command: TreasureWithoutMonster.PlatinumPerLevel },
    { range: [91, 94], command: TreasureWithoutMonster.GemsPerLevel },
    { range: [95, 97], command: TreasureWithoutMonster.JewelryPerLevel },
    { range: [98, 100], command: TreasureWithoutMonster.Magic },
  ],
};

// DMG says to roll on the "treasure with monster" table, adding 10%
// to each roll. That is equivalent to shifting each of the buckets
// down by 10%, so we do that here.
export const treasureWithMonster: Table<TreasureWithoutMonster> = {
  sides: 100,
  entries: [
    { range: [1, 15], command: TreasureWithoutMonster.CopperPerLevel },
    { range: [16, 40], command: TreasureWithoutMonster.SilverPerLevel },
    { range: [41, 55], command: TreasureWithoutMonster.ElectrumPerLevel },
    { range: [56, 70], command: TreasureWithoutMonster.GoldPerLevel },
    { range: [71, 80], command: TreasureWithoutMonster.PlatinumPerLevel },
    { range: [81, 84], command: TreasureWithoutMonster.GemsPerLevel },
    { range: [85, 87], command: TreasureWithoutMonster.JewelryPerLevel },
    { range: [88, 100], command: TreasureWithoutMonster.Magic },
  ],
};
