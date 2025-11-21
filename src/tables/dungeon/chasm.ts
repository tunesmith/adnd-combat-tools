import type { Table } from './dungeonTypes';

export enum ChasmDepth {
  Feet150,
  Feet160,
  Feet170,
  Feet180,
  Feet190,
  Feet200,
}

export enum ChasmConstruction {
  Bridged,
  JumpingPlace,
  Obstacle,
}

export enum JumpingPlaceWidth {
  FiveFeet,
  SixFeet,
  SevenFeet,
  EightFeet,
  NineFeet,
  TenFeet,
}

export const chasmDepth: Table<ChasmDepth> = {
  sides: 6,
  entries: [
    { range: [1], command: ChasmDepth.Feet150 },
    { range: [2], command: ChasmDepth.Feet160 },
    { range: [3], command: ChasmDepth.Feet170 },
    { range: [4], command: ChasmDepth.Feet180 },
    { range: [5], command: ChasmDepth.Feet190 },
    { range: [6], command: ChasmDepth.Feet200 },
  ],
};

export const chasmConstruction: Table<ChasmConstruction> = {
  sides: 20,
  entries: [
    { range: [1, 10], command: ChasmConstruction.Bridged },
    { range: [11, 15], command: ChasmConstruction.JumpingPlace },
    { range: [16, 20], command: ChasmConstruction.Obstacle },
  ],
};

export const jumpingPlaceWidth: Table<JumpingPlaceWidth> = {
  sides: 6,
  entries: [
    { range: [1], command: JumpingPlaceWidth.FiveFeet },
    { range: [2], command: JumpingPlaceWidth.SixFeet },
    { range: [3], command: JumpingPlaceWidth.SevenFeet },
    { range: [4], command: JumpingPlaceWidth.EightFeet },
    { range: [5], command: JumpingPlaceWidth.NineFeet },
    { range: [6], command: JumpingPlaceWidth.TenFeet },
  ],
};
