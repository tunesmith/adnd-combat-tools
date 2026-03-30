import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum TreasureBagOfHolding {
  TypeI = 1,
  TypeII,
  TypeIII,
  TypeIV,
}

export const treasureBagOfHolding: Table<TreasureBagOfHolding> = {
  sides: 100,
  entries: [
    { range: [1, 30], command: TreasureBagOfHolding.TypeI },
    { range: [31, 70], command: TreasureBagOfHolding.TypeII },
    { range: [71, 90], command: TreasureBagOfHolding.TypeIII },
    { range: [91, 100], command: TreasureBagOfHolding.TypeIV },
  ],
};

export const BAG_OF_HOLDING_STATS: Record<
  TreasureBagOfHolding,
  {
    bagWeight: number;
    weightLimit: number;
    volumeLimit: number;
  }
> = {
  [TreasureBagOfHolding.TypeI]: {
    bagWeight: 15,
    weightLimit: 250,
    volumeLimit: 30,
  },
  [TreasureBagOfHolding.TypeII]: {
    bagWeight: 15,
    weightLimit: 500,
    volumeLimit: 70,
  },
  [TreasureBagOfHolding.TypeIII]: {
    bagWeight: 35,
    weightLimit: 1000,
    volumeLimit: 150,
  },
  [TreasureBagOfHolding.TypeIV]: {
    bagWeight: 60,
    weightLimit: 1500,
    volumeLimit: 250,
  },
};

export enum TreasureBagOfTricks {
  Weasel = 1,
  Rat,
  Jackal,
}

export const treasureBagOfTricks: Table<TreasureBagOfTricks> = {
  sides: 10,
  entries: [
    { range: [1, 5], command: TreasureBagOfTricks.Weasel },
    { range: [6, 8], command: TreasureBagOfTricks.Rat },
    { range: [9, 10], command: TreasureBagOfTricks.Jackal },
  ],
};

export enum TreasureBracersOfDefense {
  AC8 = 8,
  AC7 = 7,
  AC6 = 6,
  AC5 = 5,
  AC4 = 4,
  AC3 = 3,
  AC2 = 2,
}

export const treasureBracersOfDefense: Table<TreasureBracersOfDefense> = {
  sides: 100,
  entries: [
    { range: [1, 5], command: TreasureBracersOfDefense.AC8 },
    { range: [6, 15], command: TreasureBracersOfDefense.AC7 },
    { range: [16, 35], command: TreasureBracersOfDefense.AC6 },
    { range: [36, 50], command: TreasureBracersOfDefense.AC5 },
    { range: [51, 70], command: TreasureBracersOfDefense.AC4 },
    { range: [71, 85], command: TreasureBracersOfDefense.AC3 },
    { range: [86, 100], command: TreasureBracersOfDefense.AC2 },
  ],
};

export enum TreasureBucknardsEverfullPurse {
  Gold = 1,
  Platinum,
  Gems,
}

export const treasureBucknardsEverfullPurse: Table<TreasureBucknardsEverfullPurse> =
  {
    sides: 100,
    entries: [
      { range: [1, 50], command: TreasureBucknardsEverfullPurse.Gold },
      { range: [51, 90], command: TreasureBucknardsEverfullPurse.Platinum },
      { range: [91, 100], command: TreasureBucknardsEverfullPurse.Gems },
    ],
  };

export enum TreasureArtifactOrRelic {
  AxeOfTheDwarvishLords = 1,
  BabaYagasHut,
  CodexOfTheInfinitePlanes,
  CrownOfMight,
  CrystalOfTheEbonFlame,
  CupAndTalismanOfAlAkbar,
  EyeOfVecna,
  HandOfVecna,
  HewardsMysticalOrgan,
  HornOfChange,
  InvulnerableCoatOfArnd,
  IronFlaskOfTuernyTheMerciless,
  JacinthOfInestimableBeauty,
  JohydeesMask,
  KurothsQuill,
  MaceOfCuthbert,
  MachineOfLumTheMad,
  MightyServantOfLeukO,
  OrbOfTheDragonkind,
  OrbOfMight,
  QueenEhlissasMarvelousNightingale,
  RecorderOfYeCind,
  RingOfGaxx,
  RodOfSevenParts,
  SceptreOfMight,
  SwordOfKas,
  TeethOfDahlverNar,
  ThroneOfTheGods,
  WandOfOrcus,
}

export const treasureArtifactOrRelic: Table<TreasureArtifactOrRelic> = {
  sides: 100,
  entries: [
    { range: [1], command: TreasureArtifactOrRelic.AxeOfTheDwarvishLords },
    { range: [2], command: TreasureArtifactOrRelic.BabaYagasHut },
    {
      range: [3, 4],
      command: TreasureArtifactOrRelic.CodexOfTheInfinitePlanes,
    },
    { range: [5, 20], command: TreasureArtifactOrRelic.CrownOfMight },
    { range: [21], command: TreasureArtifactOrRelic.CrystalOfTheEbonFlame },
    {
      range: [22],
      command: TreasureArtifactOrRelic.CupAndTalismanOfAlAkbar,
    },
    { range: [23, 24], command: TreasureArtifactOrRelic.EyeOfVecna },
    { range: [25], command: TreasureArtifactOrRelic.HandOfVecna },
    { range: [26], command: TreasureArtifactOrRelic.HewardsMysticalOrgan },
    { range: [27], command: TreasureArtifactOrRelic.HornOfChange },
    {
      range: [28, 29],
      command: TreasureArtifactOrRelic.InvulnerableCoatOfArnd,
    },
    {
      range: [30, 31],
      command: TreasureArtifactOrRelic.IronFlaskOfTuernyTheMerciless,
    },
    {
      range: [32],
      command: TreasureArtifactOrRelic.JacinthOfInestimableBeauty,
    },
    { range: [33], command: TreasureArtifactOrRelic.JohydeesMask },
    { range: [34, 35], command: TreasureArtifactOrRelic.KurothsQuill },
    { range: [36, 37], command: TreasureArtifactOrRelic.MaceOfCuthbert },
    { range: [38, 38], command: TreasureArtifactOrRelic.MachineOfLumTheMad },
    { range: [39, 40], command: TreasureArtifactOrRelic.MightyServantOfLeukO },
    { range: [41, 47], command: TreasureArtifactOrRelic.OrbOfTheDragonkind },
    { range: [48, 63], command: TreasureArtifactOrRelic.OrbOfMight },
    {
      range: [64],
      command: TreasureArtifactOrRelic.QueenEhlissasMarvelousNightingale,
    },
    { range: [65, 66], command: TreasureArtifactOrRelic.RecorderOfYeCind },
    { range: [67, 68], command: TreasureArtifactOrRelic.RingOfGaxx },
    { range: [69, 74], command: TreasureArtifactOrRelic.RodOfSevenParts },
    { range: [75, 91], command: TreasureArtifactOrRelic.SceptreOfMight },
    { range: [92], command: TreasureArtifactOrRelic.SwordOfKas },
    { range: [93, 98], command: TreasureArtifactOrRelic.TeethOfDahlverNar },
    { range: [99], command: TreasureArtifactOrRelic.ThroneOfTheGods },
    { range: [100], command: TreasureArtifactOrRelic.WandOfOrcus },
  ],
};
