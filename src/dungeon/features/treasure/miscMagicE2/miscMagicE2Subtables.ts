import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum TreasureCarpetOfFlying {
  ThreeByFive = "3' × 5'",
  FourBySix = "4' × 6'",
  FiveBySeven = "5' × 7'",
  SixByNine = "6' × 9'",
}

export const treasureCarpetOfFlying: Table<TreasureCarpetOfFlying> = {
  sides: 100,
  entries: [
    { range: [1, 20], command: TreasureCarpetOfFlying.ThreeByFive },
    { range: [21, 55], command: TreasureCarpetOfFlying.FourBySix },
    { range: [56, 80], command: TreasureCarpetOfFlying.FiveBySeven },
    { range: [81, 100], command: TreasureCarpetOfFlying.SixByNine },
  ],
};

export enum TreasureCloakOfProtection {
  PlusOne = '+1',
  PlusTwo = '+2',
  PlusThree = '+3',
  PlusFour = '+4',
  PlusFive = '+5',
}

export const treasureCloakOfProtection: Table<TreasureCloakOfProtection> = {
  sides: 100,
  entries: [
    { range: [1, 35], command: TreasureCloakOfProtection.PlusOne },
    { range: [36, 65], command: TreasureCloakOfProtection.PlusTwo },
    { range: [66, 85], command: TreasureCloakOfProtection.PlusThree },
    { range: [86, 95], command: TreasureCloakOfProtection.PlusFour },
    { range: [96, 100], command: TreasureCloakOfProtection.PlusFive },
  ],
};

export enum TreasureCrystalBall {
  Standard,
  Clairaudience,
  Esp,
  Telepathy,
}

export const treasureCrystalBall: Table<TreasureCrystalBall> = {
  sides: 100,
  entries: [
    { range: [1, 50], command: TreasureCrystalBall.Standard },
    { range: [51, 75], command: TreasureCrystalBall.Clairaudience },
    { range: [76, 90], command: TreasureCrystalBall.Esp },
    { range: [91, 100], command: TreasureCrystalBall.Telepathy },
  ],
};

export enum TreasureDeckOfManyThings {
  ThirteenPlaques,
  TwentyTwoPlaques,
}

export const treasureDeckOfManyThings: Table<TreasureDeckOfManyThings> = {
  sides: 100,
  entries: [
    { range: [1, 75], command: TreasureDeckOfManyThings.ThirteenPlaques },
    { range: [76, 100], command: TreasureDeckOfManyThings.TwentyTwoPlaques },
  ],
};

export enum TreasureEyesOfPetrification {
  Basilisk,
  Normal,
}

export const treasureEyesOfPetrification: Table<TreasureEyesOfPetrification> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasureEyesOfPetrification.Basilisk },
    { range: [26, 100], command: TreasureEyesOfPetrification.Normal },
  ],
};
