import { getTableEntry } from '../../../../dungeon/helpers/dungeonLookup';
import type { Command } from '../../../../tables/dungeon/dungeonTypes';
import type { Table } from '../../../../tables/dungeon/tableTypes';
import {
  periodicCheck,
  PeriodicCheck,
  doorBeyond,
  DoorBeyond,
} from '../../../../dungeon/features/navigation/entry/entryTable';
import {
  doorLocation,
  DoorLocation,
} from '../../../../dungeon/features/navigation/doorChain/doorChainTable';
import {
  sidePassages,
  SidePassages,
} from '../../../../dungeon/features/navigation/sidePassage/sidePassageTable';
import {
  passageTurns,
  PassageTurns,
} from '../../../../dungeon/features/navigation/passageTurn/passageTurnTable';
import {
  passageWidth,
  PassageWidth,
} from '../../../../dungeon/features/navigation/passageWidth/passageWidthTable';
import {
  specialPassage,
  SpecialPassage,
  galleryStairLocation,
  GalleryStairLocation,
  galleryStairOccurrence,
  GalleryStairOccurrence,
  streamConstruction,
  StreamConstruction,
  riverConstruction,
  RiverConstruction,
  riverBoatBank,
  RiverBoatBank,
} from '../../../../dungeon/features/navigation/specialPassage/specialPassageTable';
import {
  chasmDepth,
  ChasmDepth,
  chasmConstruction,
  ChasmConstruction,
  jumpingPlaceWidth,
  JumpingPlaceWidth,
} from '../../../../dungeon/features/navigation/chasm/chasmTable';
import {
  chamberDimensions,
  ChamberDimensions,
  roomDimensions,
  RoomDimensions,
  chamberRoomContents,
  ChamberRoomContents,
  chamberRoomStairs,
  ChamberRoomStairs,
} from '../../../../dungeon/features/environment/roomsChambers/roomsChambersTable';
import {
  unusualShape,
  UnusualShape,
  unusualSize,
  UnusualSize,
} from '../../../../dungeon/features/environment/unusualSpace/unusualSpaceTable';
import {
  circularContents,
  CircularContents,
  pool,
  Pool,
  magicPool,
  MagicPool,
  transmuteType,
  TransmuteType,
  poolAlignment,
  PoolAlignment,
  transporterLocation,
  TransporterLocation,
} from '../../../../dungeon/features/environment/circularPools/circularPoolsTable';
import {
  numberOfExits,
  NumberOfExits,
  oneToFour,
  OneToFour,
} from '../../../../dungeon/features/navigation/exit/numberOfExitsTable';
import {
  exitLocation,
  ExitLocation,
  exitAlternative,
  ExitAlternative,
  exitDirection,
  ExitDirection,
} from '../../../../dungeon/features/navigation/exit/exitLocationsTable';
import {
  stairs,
  Stairs,
  egressOne,
  egressTwo,
  egressThree,
  Egress,
  chute,
  Chute,
} from '../../../../dungeon/features/navigation/exit/stairsTable';
import {
  trickTrap,
  TrickTrap,
} from '../../../../dungeon/features/hazards/trickTrap/trickTrapTable';
import {
  gasTrapEffect,
  GasTrapEffect,
} from '../../../../dungeon/features/hazards/gasTrap/gasTrapTable';
import {
  illusionaryWallNature,
  IllusionaryWallNature,
} from '../../../../dungeon/features/hazards/illusionaryWall/illusionaryWallTable';

function specEntries<T extends Command>(
  ...entries: Table<T>['entries']
): Table<T>['entries'] {
  return entries;
}

function lastRangeValue(range: [number, ...number[]]): number {
  return range[range.length - 1] ?? range[0];
}

function expectTableToMatchSpec<T extends Command>(
  table: Table<T>,
  sides: number,
  entries: Table<T>['entries']
): void {
  expect(table.sides).toBe(sides);
  expect(table.entries).toEqual(entries);

  let nextRoll = 1;
  for (const entry of entries) {
    const low = entry.range[0];
    const high = lastRangeValue(entry.range);

    expect(low).toBe(nextRoll);
    expect(getTableEntry(low, table)).toBe(entry.command);
    expect(getTableEntry(high, table)).toBe(entry.command);

    if (high - low >= 2) {
      const middle = Math.floor((low + high) / 2);
      expect(getTableEntry(middle, table)).toBe(entry.command);
    }

    nextRoll = high + 1;
  }

  expect(nextRoll - 1).toBe(sides);
}

describe('Appendix A table ranges', () => {
  test('Table I and II entry tables match spec', () => {
    expectTableToMatchSpec(
      periodicCheck,
      20,
      specEntries(
        { range: [1, 2], command: PeriodicCheck.ContinueStraight },
        { range: [3, 5], command: PeriodicCheck.Door },
        { range: [6, 10], command: PeriodicCheck.SidePassage },
        { range: [11, 13], command: PeriodicCheck.PassageTurn },
        { range: [14, 16], command: PeriodicCheck.Chamber },
        { range: [17], command: PeriodicCheck.Stairs },
        { range: [18], command: PeriodicCheck.DeadEnd },
        { range: [19], command: PeriodicCheck.TrickTrap },
        { range: [20], command: PeriodicCheck.WanderingMonster }
      )
    );

    expectTableToMatchSpec(
      doorLocation,
      20,
      specEntries(
        { range: [1, 6], command: DoorLocation.Left },
        { range: [7, 12], command: DoorLocation.Right },
        { range: [13, 20], command: DoorLocation.Ahead }
      )
    );

    expectTableToMatchSpec(
      doorBeyond,
      20,
      specEntries(
        { range: [1, 4], command: DoorBeyond.ParallelPassageOrCloset },
        { range: [5, 8], command: DoorBeyond.PassageStraightAhead },
        { range: [9], command: DoorBeyond.Passage45AheadBehind },
        { range: [10], command: DoorBeyond.Passage45BehindAhead },
        { range: [11, 18], command: DoorBeyond.Room },
        { range: [19, 20], command: DoorBeyond.Chamber }
      )
    );
  });

  test('Table III and IV passage tables match spec', () => {
    expectTableToMatchSpec(
      sidePassages,
      20,
      specEntries(
        { range: [1, 2], command: SidePassages.Left90 },
        { range: [3, 4], command: SidePassages.Right90 },
        { range: [5], command: SidePassages.Left45 },
        { range: [6], command: SidePassages.Right45 },
        { range: [7], command: SidePassages.Left135 },
        { range: [8], command: SidePassages.Right135 },
        { range: [9], command: SidePassages.LeftCurve45 },
        { range: [10], command: SidePassages.RightCurve45 },
        { range: [11, 13], command: SidePassages.PassageT },
        { range: [14, 15], command: SidePassages.PassageY },
        { range: [16, 19], command: SidePassages.FourWay },
        { range: [20], command: SidePassages.PassageX }
      )
    );

    expectTableToMatchSpec(
      passageWidth,
      20,
      specEntries(
        { range: [1, 12], command: PassageWidth.TenFeet },
        { range: [13, 16], command: PassageWidth.TwentyFeet },
        { range: [17], command: PassageWidth.ThirtyFeet },
        { range: [18], command: PassageWidth.FiveFeet },
        { range: [19, 20], command: PassageWidth.SpecialPassage }
      )
    );

    expectTableToMatchSpec(
      passageTurns,
      20,
      specEntries(
        { range: [1, 8], command: PassageTurns.Left90 },
        { range: [9], command: PassageTurns.Left45 },
        { range: [10], command: PassageTurns.Left135 },
        { range: [11, 18], command: PassageTurns.Right90 },
        { range: [19], command: PassageTurns.Right45 },
        { range: [20], command: PassageTurns.Right135 }
      )
    );
  });

  test('Table III.B special passage tables match spec', () => {
    expectTableToMatchSpec(
      specialPassage,
      20,
      specEntries(
        { range: [1, 4], command: SpecialPassage.FortyFeetColumns },
        { range: [5, 7], command: SpecialPassage.FortyFeetDoubleColumns },
        { range: [8, 10], command: SpecialPassage.FiftyFeetDoubleColumns },
        { range: [11, 12], command: SpecialPassage.FiftyFeetGalleries },
        { range: [13, 15], command: SpecialPassage.TenFootStream },
        { range: [16, 17], command: SpecialPassage.TwentyFootRiver },
        { range: [18], command: SpecialPassage.FortyFootRiver },
        { range: [19], command: SpecialPassage.SixtyFootRiver },
        { range: [20], command: SpecialPassage.TwentyFootChasm }
      )
    );

    expectTableToMatchSpec(
      galleryStairLocation,
      20,
      specEntries(
        { range: [1, 15], command: GalleryStairLocation.PassageEnd },
        { range: [16, 20], command: GalleryStairLocation.PassageBeginning }
      )
    );

    expectTableToMatchSpec(
      galleryStairOccurrence,
      20,
      specEntries(
        { range: [1, 10], command: GalleryStairOccurrence.Replace },
        { range: [11, 20], command: GalleryStairOccurrence.Supplement }
      )
    );

    expectTableToMatchSpec(
      streamConstruction,
      20,
      specEntries(
        { range: [1, 15], command: StreamConstruction.Bridged },
        { range: [16, 20], command: StreamConstruction.Obstacle }
      )
    );

    expectTableToMatchSpec(
      riverConstruction,
      20,
      specEntries(
        { range: [1, 10], command: RiverConstruction.Bridged },
        { range: [11, 15], command: RiverConstruction.Boat },
        { range: [16, 20], command: RiverConstruction.Obstacle }
      )
    );

    expectTableToMatchSpec(
      riverBoatBank,
      20,
      specEntries(
        { range: [1, 10], command: RiverBoatBank.ThisSide },
        { range: [11, 20], command: RiverBoatBank.OppositeSide }
      )
    );
  });

  test('Table V room and chamber tables match spec', () => {
    expectTableToMatchSpec(
      chamberDimensions,
      20,
      specEntries(
        { range: [1, 4], command: ChamberDimensions.Square20x20 },
        { range: [5, 6], command: ChamberDimensions.Square30x30 },
        { range: [7, 8], command: ChamberDimensions.Square40x40 },
        { range: [9, 13], command: ChamberDimensions.Rectangular20x30 },
        { range: [14, 15], command: ChamberDimensions.Rectangular30x50 },
        { range: [16, 17], command: ChamberDimensions.Rectangular40x60 },
        { range: [18, 20], command: ChamberDimensions.Unusual }
      )
    );

    expectTableToMatchSpec(
      roomDimensions,
      20,
      specEntries(
        { range: [1, 2], command: RoomDimensions.Square10x10 },
        { range: [3, 4], command: RoomDimensions.Square20x20 },
        { range: [5, 6], command: RoomDimensions.Square30x30 },
        { range: [7, 8], command: RoomDimensions.Square40x40 },
        { range: [9, 10], command: RoomDimensions.Rectangular10x20 },
        { range: [11, 13], command: RoomDimensions.Rectangular20x30 },
        { range: [14, 15], command: RoomDimensions.Rectangular20x40 },
        { range: [16, 17], command: RoomDimensions.Rectangular30x40 },
        { range: [18, 20], command: RoomDimensions.Unusual }
      )
    );

    expectTableToMatchSpec(
      chamberRoomContents,
      20,
      specEntries(
        { range: [1, 12], command: ChamberRoomContents.Empty },
        { range: [13, 14], command: ChamberRoomContents.MonsterOnly },
        { range: [15, 17], command: ChamberRoomContents.MonsterAndTreasure },
        { range: [18], command: ChamberRoomContents.Special },
        { range: [19], command: ChamberRoomContents.TrickTrap },
        { range: [20], command: ChamberRoomContents.Treasure }
      )
    );

    expectTableToMatchSpec(
      chamberRoomStairs,
      20,
      specEntries(
        { range: [1, 5], command: ChamberRoomStairs.UpOneLevel },
        { range: [6, 8], command: ChamberRoomStairs.UpTwoLevels },
        { range: [9, 14], command: ChamberRoomStairs.DownOneLevel },
        { range: [15, 19], command: ChamberRoomStairs.DownTwoLevels },
        { range: [20], command: ChamberRoomStairs.DownThreeLevels }
      )
    );
  });

  test('Table V unusual shape and size tables match spec', () => {
    expectTableToMatchSpec(
      unusualShape,
      20,
      specEntries(
        { range: [1, 5], command: UnusualShape.Circular },
        { range: [6, 8], command: UnusualShape.Triangular },
        { range: [9, 11], command: UnusualShape.Trapezoidal },
        { range: [12, 13], command: UnusualShape.OddShaped },
        { range: [14, 15], command: UnusualShape.Oval },
        { range: [16, 17], command: UnusualShape.Hexagonal },
        { range: [18, 19], command: UnusualShape.Octagonal },
        { range: [20], command: UnusualShape.Cave }
      )
    );

    expectTableToMatchSpec(
      unusualSize,
      20,
      specEntries(
        { range: [1, 3], command: UnusualSize.SqFt500 },
        { range: [4, 6], command: UnusualSize.SqFt900 },
        { range: [7, 8], command: UnusualSize.SqFt1300 },
        { range: [9, 10], command: UnusualSize.SqFt2000 },
        { range: [11, 12], command: UnusualSize.SqFt2700 },
        { range: [13, 14], command: UnusualSize.SqFt3400 },
        { range: [15, 20], command: UnusualSize.RollAgain }
      )
    );
  });

  test('Table VIII.A and VIII.C pool tables match spec', () => {
    expectTableToMatchSpec(
      circularContents,
      20,
      specEntries(
        { range: [1, 5], command: CircularContents.Pool },
        { range: [6, 7], command: CircularContents.Well },
        { range: [8, 10], command: CircularContents.Shaft },
        { range: [11, 20], command: CircularContents.Normal }
      )
    );

    expectTableToMatchSpec(
      pool,
      20,
      specEntries(
        { range: [1, 8], command: Pool.NoPool },
        { range: [9, 10], command: Pool.PoolNoMonster },
        { range: [11, 12], command: Pool.PoolMonster },
        { range: [13, 18], command: Pool.PoolMonsterTreasure },
        { range: [19, 20], command: Pool.MagicPool }
      )
    );

    expectTableToMatchSpec(
      magicPool,
      20,
      specEntries(
        { range: [1, 8], command: MagicPool.TransmuteGold },
        { range: [9, 15], command: MagicPool.AlterCharacteristic },
        { range: [16, 17], command: MagicPool.WishOrDamage },
        { range: [18, 20], command: MagicPool.Transporter }
      )
    );

    expectTableToMatchSpec(
      transmuteType,
      20,
      specEntries(
        { range: [1, 11], command: TransmuteType.GoldToPlatinum },
        { range: [12, 20], command: TransmuteType.GoldToLead }
      )
    );

    expectTableToMatchSpec(
      poolAlignment,
      20,
      specEntries(
        { range: [1, 6], command: PoolAlignment.LawfulGood },
        { range: [7, 9], command: PoolAlignment.LawfulEvil },
        { range: [10, 12], command: PoolAlignment.ChaoticGood },
        { range: [13, 17], command: PoolAlignment.ChaoticEvil },
        { range: [18, 20], command: PoolAlignment.Neutral }
      )
    );

    expectTableToMatchSpec(
      transporterLocation,
      20,
      specEntries(
        { range: [1, 7], command: TransporterLocation.Surface },
        { range: [8, 12], command: TransporterLocation.SameLevelElsewhere },
        { range: [13, 16], command: TransporterLocation.OneLevelDown },
        { range: [17, 20], command: TransporterLocation.Away100Miles }
      )
    );
  });

  test('Table V exit tables match spec', () => {
    expectTableToMatchSpec(
      numberOfExits,
      20,
      specEntries(
        { range: [1, 3], command: NumberOfExits.OneTwo600 },
        { range: [4, 6], command: NumberOfExits.TwoThree600 },
        { range: [7, 9], command: NumberOfExits.ThreeFour600 },
        { range: [10, 12], command: NumberOfExits.ZeroOne1200 },
        { range: [13, 15], command: NumberOfExits.ZeroOne1600 },
        { range: [16, 18], command: NumberOfExits.OneToFour },
        { range: [19, 20], command: NumberOfExits.DoorChamberOrPassageRoom }
      )
    );

    expectTableToMatchSpec(
      oneToFour,
      4,
      specEntries(
        { range: [1], command: OneToFour.One },
        { range: [2], command: OneToFour.Two },
        { range: [3], command: OneToFour.Three },
        { range: [4], command: OneToFour.Four }
      )
    );

    expectTableToMatchSpec(
      exitLocation,
      20,
      specEntries(
        { range: [1, 7], command: ExitLocation.OppositeWall },
        { range: [8, 12], command: ExitLocation.LeftWall },
        { range: [13, 17], command: ExitLocation.RightWall },
        { range: [18, 20], command: ExitLocation.SameWall }
      )
    );

    expectTableToMatchSpec(
      exitAlternative,
      20,
      specEntries(
        { range: [1, 5], command: ExitAlternative.SecretDoor },
        { range: [6, 10], command: ExitAlternative.OneWayDoor },
        { range: [11, 20], command: ExitAlternative.OppositeDirection }
      )
    );

    expectTableToMatchSpec(
      exitDirection,
      20,
      specEntries(
        { range: [1, 16], command: ExitDirection.StraightAhead },
        { range: [17, 18], command: ExitDirection.LeftRight45 },
        { range: [19, 20], command: ExitDirection.RightLeft45 }
      )
    );
  });

  test('Table VI stairs and footnote tables match spec', () => {
    expectTableToMatchSpec(
      stairs,
      20,
      specEntries(
        { range: [1, 5], command: Stairs.DownOne },
        { range: [6], command: Stairs.DownTwo },
        { range: [7], command: Stairs.DownThree },
        { range: [8], command: Stairs.UpOne },
        { range: [9], command: Stairs.UpDead },
        { range: [10], command: Stairs.DownDead },
        { range: [11], command: Stairs.ChimneyUpOne },
        { range: [12], command: Stairs.ChimneyUpTwo },
        { range: [13], command: Stairs.ChimneyDownTwo },
        { range: [14, 16], command: Stairs.TrapDoorDownOne },
        { range: [17], command: Stairs.TrapDownDownTwo },
        { range: [18, 20], command: Stairs.UpOneDownTwo }
      )
    );

    expectTableToMatchSpec(
      egressOne,
      20,
      specEntries(
        { range: [1], command: Egress.Closed },
        { range: [2, 20], command: Egress.Open }
      )
    );

    expectTableToMatchSpec(
      egressTwo,
      20,
      specEntries(
        { range: [1, 2], command: Egress.Closed },
        { range: [3, 20], command: Egress.Open }
      )
    );

    expectTableToMatchSpec(
      egressThree,
      20,
      specEntries(
        { range: [1, 3], command: Egress.Closed },
        { range: [4, 20], command: Egress.Open }
      )
    );

    expectTableToMatchSpec(
      chute,
      6,
      specEntries(
        { range: [1], command: Chute.Exists },
        { range: [2, 6], command: Chute.DoesNotExist }
      )
    );
  });

  test('Table VII, VII.A, and illusionary wall tables match spec', () => {
    expectTableToMatchSpec(
      trickTrap,
      20,
      specEntries(
        { range: [1, 5], command: TrickTrap.SecretDoor },
        { range: [6, 7], command: TrickTrap.Pit },
        { range: [8], command: TrickTrap.SpikedPit },
        { range: [9], command: TrickTrap.ElevatorRoomOne },
        { range: [10], command: TrickTrap.ElevatorRoomTwo },
        { range: [11], command: TrickTrap.ElevatorRoomMulti },
        { range: [12], command: TrickTrap.SlidingWall },
        { range: [13], command: TrickTrap.OilAndFlame },
        { range: [14], command: TrickTrap.CrushingPit },
        { range: [15], command: TrickTrap.ArrowTrap },
        { range: [16], command: TrickTrap.SpearTrap },
        { range: [17], command: TrickTrap.GasCorridor },
        { range: [18], command: TrickTrap.FallingDoorOrStone },
        { range: [19], command: TrickTrap.IllusionaryWall },
        { range: [20], command: TrickTrap.ChuteDown }
      )
    );

    expectTableToMatchSpec(
      gasTrapEffect,
      20,
      specEntries(
        { range: [1, 7], command: GasTrapEffect.ObscuringGas },
        { range: [8, 9], command: GasTrapEffect.BlindingGas },
        { range: [10, 12], command: GasTrapEffect.FearGas },
        { range: [13], command: GasTrapEffect.SleepGas },
        { range: [14, 18], command: GasTrapEffect.StrengthGas },
        { range: [19], command: GasTrapEffect.SicknessGas },
        { range: [20], command: GasTrapEffect.PoisonGas }
      )
    );

    expectTableToMatchSpec(
      illusionaryWallNature,
      20,
      specEntries(
        { range: [1, 6], command: IllusionaryWallNature.Pit },
        { range: [7, 10], command: IllusionaryWallNature.Chute },
        { range: [11, 20], command: IllusionaryWallNature.Chamber }
      )
    );
  });

  test('Chasm footnote tables match spec', () => {
    expectTableToMatchSpec(
      chasmDepth,
      6,
      specEntries(
        { range: [1], command: ChasmDepth.Feet150 },
        { range: [2], command: ChasmDepth.Feet160 },
        { range: [3], command: ChasmDepth.Feet170 },
        { range: [4], command: ChasmDepth.Feet180 },
        { range: [5], command: ChasmDepth.Feet190 },
        { range: [6], command: ChasmDepth.Feet200 }
      )
    );

    expectTableToMatchSpec(
      chasmConstruction,
      20,
      specEntries(
        { range: [1, 10], command: ChasmConstruction.Bridged },
        { range: [11, 15], command: ChasmConstruction.JumpingPlace },
        { range: [16, 20], command: ChasmConstruction.Obstacle }
      )
    );

    expectTableToMatchSpec(
      jumpingPlaceWidth,
      6,
      specEntries(
        { range: [1], command: JumpingPlaceWidth.FiveFeet },
        { range: [2], command: JumpingPlaceWidth.SixFeet },
        { range: [3], command: JumpingPlaceWidth.SevenFeet },
        { range: [4], command: JumpingPlaceWidth.EightFeet },
        { range: [5], command: JumpingPlaceWidth.NineFeet },
        { range: [6], command: JumpingPlaceWidth.TenFeet }
      )
    );
  });
});
