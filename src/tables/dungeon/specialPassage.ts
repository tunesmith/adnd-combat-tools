import type { Table } from './dungeonTypes';

export enum SpecialPassage {
  FortyFeetColumns,
  FortyFeetDoubleColumns,
  FiftyFeetDoubleColumns,
  FiftyFeetGalleries,
  TenFootStream,
  TwentyFootRiver,
  FortyFootRiver,
  SixtyFootRiver,
  TwentyFootChasm,
}
export const specialPassage: Table<SpecialPassage> = {
  sides: 20,
  entries: [
    { range: [1, 4], command: SpecialPassage.FortyFeetColumns },
    { range: [5, 7], command: SpecialPassage.FortyFeetDoubleColumns },
    { range: [8, 10], command: SpecialPassage.FiftyFeetDoubleColumns },
    { range: [11, 12], command: SpecialPassage.FiftyFeetGalleries },
    { range: [13, 15], command: SpecialPassage.TenFootStream },
    { range: [16, 17], command: SpecialPassage.TwentyFootRiver },
    { range: [18], command: SpecialPassage.FortyFootRiver },
    { range: [19], command: SpecialPassage.SixtyFootRiver },
    { range: [20], command: SpecialPassage.TwentyFootChasm },
  ],
};

export enum GalleryStairLocation {
  PassageEnd,
  PassageBeginning,
}

export const galleryStairLocation: Table<GalleryStairLocation> = {
  sides: 20,
  entries: [
    { range: [1, 15], command: GalleryStairLocation.PassageEnd },
    { range: [16, 20], command: GalleryStairLocation.PassageBeginning },
  ],
};

export enum GalleryStairOccurrence {
  Replace,
  Supplement,
}

export const galleryStairOccurrence: Table<GalleryStairOccurrence> = {
  sides: 20,
  entries: [
    { range: [1, 10], command: GalleryStairOccurrence.Replace },
    { range: [11, 20], command: GalleryStairOccurrence.Supplement },
  ],
};

export enum StreamConstruction {
  Bridged,
  Obstacle,
}

export const streamConstruction: Table<StreamConstruction> = {
  sides: 20,
  entries: [
    { range: [1, 15], command: StreamConstruction.Bridged },
    { range: [16, 20], command: StreamConstruction.Obstacle },
  ],
};

export enum RiverConstruction {
  Bridged,
  Boat,
  Obstacle,
}

export const riverConstruction: Table<RiverConstruction> = {
  sides: 20,
  entries: [
    { range: [1, 10], command: RiverConstruction.Bridged },
    { range: [11, 15], command: RiverConstruction.Boat },
    { range: [16, 20], command: RiverConstruction.Obstacle },
  ],
};

export enum RiverBoatBank {
  ThisSide,
  OppositeSide,
}

export const riverBoatBank: Table<RiverBoatBank> = {
  sides: 20,
  entries: [
    { range: [1, 10], command: RiverBoatBank.ThisSide },
    { range: [11, 20], command: RiverBoatBank.OppositeSide },
  ],
};

export enum ChasmDepth {
  Feet150,
  Feet160,
  Feet170,
  Feet180,
  Feet190,
  Feet200,
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

export enum ChasmConstruction {
  Bridged,
  JumpingPlace,
  Obstacle,
}

export const chasmConstruction: Table<ChasmConstruction> = {
  sides: 20,
  entries: [
    { range: [1, 10], command: ChasmConstruction.Bridged },
    { range: [11, 15], command: ChasmConstruction.JumpingPlace },
    { range: [16, 20], command: ChasmConstruction.Obstacle },
  ],
};

export enum JumpingPlaceWidth {
  FiveFeet,
  SixFeet,
  SevenFeet,
  EightFeet,
  NineFeet,
  TenFeet,
}

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
