import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum TreasureMagicCategory {
  Potions,
  Scrolls,
  Rings,
  RodsStavesWands,
  MiscMagicE1,
  MiscMagicE2,
  MiscMagicE3,
  MiscMagicE4,
  MiscMagicE5,
  ArmorShields,
  Swords,
  MiscWeapons,
}

export const treasureMagicCategory: Table<TreasureMagicCategory> = {
  sides: 100,
  entries: [
    { range: [1, 20], command: TreasureMagicCategory.Potions },
    { range: [21, 35], command: TreasureMagicCategory.Scrolls },
    { range: [36, 40], command: TreasureMagicCategory.Rings },
    { range: [41, 45], command: TreasureMagicCategory.RodsStavesWands },
    { range: [46, 48], command: TreasureMagicCategory.MiscMagicE1 },
    { range: [49, 51], command: TreasureMagicCategory.MiscMagicE2 },
    { range: [52, 54], command: TreasureMagicCategory.MiscMagicE3 },
    { range: [55, 57], command: TreasureMagicCategory.MiscMagicE4 },
    { range: [58, 60], command: TreasureMagicCategory.MiscMagicE5 },
    { range: [61, 75], command: TreasureMagicCategory.ArmorShields },
    { range: [76, 86], command: TreasureMagicCategory.Swords },
    { range: [87, 100], command: TreasureMagicCategory.MiscWeapons },
  ],
};

export const magicCategoryFollowups = [
  { result: TreasureMagicCategory.Potions, table: 'treasurePotion' },
  { result: TreasureMagicCategory.Scrolls, table: 'treasureScroll' },
  { result: TreasureMagicCategory.Rings, table: 'treasureRing' },
  {
    result: TreasureMagicCategory.RodsStavesWands,
    table: 'treasureRodStaffWand',
  },
  { result: TreasureMagicCategory.MiscMagicE1, table: 'treasureMiscMagicE1' },
  { result: TreasureMagicCategory.MiscMagicE2, table: 'treasureMiscMagicE2' },
  { result: TreasureMagicCategory.MiscMagicE3, table: 'treasureMiscMagicE3' },
  { result: TreasureMagicCategory.MiscMagicE4, table: 'treasureMiscMagicE4' },
  { result: TreasureMagicCategory.MiscMagicE5, table: 'treasureMiscMagicE5' },
  { result: TreasureMagicCategory.ArmorShields, table: 'treasureArmorShields' },
  { result: TreasureMagicCategory.Swords, table: 'treasureSwords' },
  { result: TreasureMagicCategory.MiscWeapons, table: 'treasureMiscWeapons' },
] as const;
