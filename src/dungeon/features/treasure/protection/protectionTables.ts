import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum TreasureProtectionType {
  Guarded,
  Hidden,
}

export const treasureProtectionType: Table<TreasureProtectionType> = {
  sides: 20,
  entries: [
    { range: [1, 8], command: TreasureProtectionType.Guarded },
    { range: [9, 20], command: TreasureProtectionType.Hidden },
  ],
};

export enum TreasureProtectionGuardedBy {
  ContactPoisonContainer,
  ContactPoisonTreasure,
  PoisonedNeedlesLock,
  PoisonedNeedlesHandles,
  SpringDartsFront,
  SpringDartsTop,
  SpringDartsBottom,
  BladeAcrossInside,
  PoisonousCreaturesInside,
  GasReleased,
  TrapdoorFront,
  TrapdoorSixFeetFront,
  StoneBlockDrop,
  SpearsFromWalls,
  ExplosiveRunes,
  Symbol,
}

export const treasureProtectionGuardedBy: Table<TreasureProtectionGuardedBy> = {
  sides: 20,
  entries: [
    {
      range: [1, 2],
      command: TreasureProtectionGuardedBy.ContactPoisonContainer,
    },
    {
      range: [3, 4],
      command: TreasureProtectionGuardedBy.ContactPoisonTreasure,
    },
    { range: [5, 6], command: TreasureProtectionGuardedBy.PoisonedNeedlesLock },
    { range: [7], command: TreasureProtectionGuardedBy.PoisonedNeedlesHandles },
    { range: [8], command: TreasureProtectionGuardedBy.SpringDartsFront },
    { range: [9], command: TreasureProtectionGuardedBy.SpringDartsTop },
    { range: [10], command: TreasureProtectionGuardedBy.SpringDartsBottom },
    { range: [11, 12], command: TreasureProtectionGuardedBy.BladeAcrossInside },
    {
      range: [13],
      command: TreasureProtectionGuardedBy.PoisonousCreaturesInside,
    },
    { range: [14], command: TreasureProtectionGuardedBy.GasReleased },
    { range: [15], command: TreasureProtectionGuardedBy.TrapdoorFront },
    { range: [16], command: TreasureProtectionGuardedBy.TrapdoorSixFeetFront },
    { range: [17], command: TreasureProtectionGuardedBy.StoneBlockDrop },
    { range: [18], command: TreasureProtectionGuardedBy.SpearsFromWalls },
    { range: [19], command: TreasureProtectionGuardedBy.ExplosiveRunes },
    { range: [20], command: TreasureProtectionGuardedBy.Symbol },
  ],
};

export enum TreasureProtectionHiddenBy {
  Invisibility,
  Illusion,
  SecretSpaceUnderContainer,
  SecretCompartment,
  InsidePlainViewItem,
  Disguised,
  UnderHeap,
  UnderLooseStoneFloor,
  BehindLooseStoneWall,
  SecretRoomNearby,
}

export const treasureProtectionHiddenBy: Table<TreasureProtectionHiddenBy> = {
  sides: 20,
  entries: [
    { range: [1, 3], command: TreasureProtectionHiddenBy.Invisibility },
    { range: [4, 5], command: TreasureProtectionHiddenBy.Illusion },
    {
      range: [6],
      command: TreasureProtectionHiddenBy.SecretSpaceUnderContainer,
    },
    { range: [7, 8], command: TreasureProtectionHiddenBy.SecretCompartment },
    { range: [9], command: TreasureProtectionHiddenBy.InsidePlainViewItem },
    { range: [10], command: TreasureProtectionHiddenBy.Disguised },
    { range: [11], command: TreasureProtectionHiddenBy.UnderHeap },
    {
      range: [12, 13],
      command: TreasureProtectionHiddenBy.UnderLooseStoneFloor,
    },
    {
      range: [14, 15],
      command: TreasureProtectionHiddenBy.BehindLooseStoneWall,
    },
    { range: [16, 20], command: TreasureProtectionHiddenBy.SecretRoomNearby },
  ],
};
