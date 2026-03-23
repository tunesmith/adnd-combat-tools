import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum TreasureScroll {
  SpellOneLevel1to4,
  SpellOneLevel1to6,
  SpellOneLevel2to9,
  SpellTwoLevel1to4,
  SpellTwoLevel1to8,
  SpellThreeLevel1to4,
  SpellThreeLevel2to9,
  SpellFourLevel1to6,
  SpellFourLevel1to8,
  SpellFiveLevel1to6,
  SpellFiveLevel1to8,
  SpellSixLevel1to6,
  SpellSixLevel3to8,
  SpellSevenLevel1to8,
  SpellSevenLevel2to9,
  SpellSevenLevel4to9,
  ProtectionDemons,
  ProtectionDevils,
  ProtectionElementals,
  ProtectionLycanthropes,
  ProtectionMagic,
  ProtectionPetrification,
  ProtectionPossession,
  ProtectionUndead,
  Curse,
}

export const treasureScrolls: Table<TreasureScroll> = {
  sides: 100,
  entries: [
    { range: [1, 10], command: TreasureScroll.SpellOneLevel1to4 },
    { range: [11, 16], command: TreasureScroll.SpellOneLevel1to6 },
    { range: [17, 19], command: TreasureScroll.SpellOneLevel2to9 },
    { range: [20, 24], command: TreasureScroll.SpellTwoLevel1to4 },
    { range: [25, 27], command: TreasureScroll.SpellTwoLevel1to8 },
    { range: [28, 32], command: TreasureScroll.SpellThreeLevel1to4 },
    { range: [33, 35], command: TreasureScroll.SpellThreeLevel2to9 },
    { range: [36, 39], command: TreasureScroll.SpellFourLevel1to6 },
    { range: [40, 42], command: TreasureScroll.SpellFourLevel1to8 },
    { range: [43, 46], command: TreasureScroll.SpellFiveLevel1to6 },
    { range: [47, 49], command: TreasureScroll.SpellFiveLevel1to8 },
    { range: [50, 52], command: TreasureScroll.SpellSixLevel1to6 },
    { range: [53, 54], command: TreasureScroll.SpellSixLevel3to8 },
    { range: [55, 57], command: TreasureScroll.SpellSevenLevel1to8 },
    { range: [58, 59], command: TreasureScroll.SpellSevenLevel2to9 },
    { range: [60], command: TreasureScroll.SpellSevenLevel4to9 },
    { range: [61, 62], command: TreasureScroll.ProtectionDemons },
    { range: [63, 64], command: TreasureScroll.ProtectionDevils },
    { range: [65, 70], command: TreasureScroll.ProtectionElementals },
    { range: [71, 75], command: TreasureScroll.ProtectionLycanthropes },
    { range: [76, 82], command: TreasureScroll.ProtectionMagic },
    { range: [83, 87], command: TreasureScroll.ProtectionPetrification },
    { range: [88, 92], command: TreasureScroll.ProtectionPossession },
    { range: [93, 97], command: TreasureScroll.ProtectionUndead },
    { range: [98, 100], command: TreasureScroll.Curse },
  ],
};

export enum TreasureScrollProtectionElementals {
  Air,
  Earth,
  Fire,
  Water,
  All,
}

export const treasureScrollProtectionElementals: Table<TreasureScrollProtectionElementals> =
  {
    sides: 100,
    entries: [
      { range: [1, 15], command: TreasureScrollProtectionElementals.Air },
      { range: [16, 30], command: TreasureScrollProtectionElementals.Earth },
      { range: [31, 45], command: TreasureScrollProtectionElementals.Fire },
      { range: [46, 60], command: TreasureScrollProtectionElementals.Water },
      { range: [61, 100], command: TreasureScrollProtectionElementals.All },
    ],
  };

export enum TreasureScrollProtectionLycanthropes {
  Werebears,
  Wereboars,
  Wererats,
  Weretigers,
  Werewolves,
  AllLycanthropes,
  ShapeChangers,
}

export const treasureScrollProtectionLycanthropes: Table<TreasureScrollProtectionLycanthropes> =
  {
    sides: 100,
    entries: [
      {
        range: [1, 5],
        command: TreasureScrollProtectionLycanthropes.Werebears,
      },
      {
        range: [6, 10],
        command: TreasureScrollProtectionLycanthropes.Wereboars,
      },
      {
        range: [11, 20],
        command: TreasureScrollProtectionLycanthropes.Wererats,
      },
      {
        range: [21, 25],
        command: TreasureScrollProtectionLycanthropes.Weretigers,
      },
      {
        range: [26, 40],
        command: TreasureScrollProtectionLycanthropes.Werewolves,
      },
      {
        range: [41, 98],
        command: TreasureScrollProtectionLycanthropes.AllLycanthropes,
      },
      {
        range: [99, 100],
        command: TreasureScrollProtectionLycanthropes.ShapeChangers,
      },
    ],
  };
