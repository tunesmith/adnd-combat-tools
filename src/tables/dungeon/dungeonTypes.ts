import type {
  ChasmConstruction,
  ChasmDepth,
  GalleryStairLocation,
  GalleryStairOccurrence,
  JumpingPlaceWidth,
  RiverBoatBank,
  RiverConstruction,
  SpecialPassage,
  StreamConstruction,
} from './specialPassage';
import type { PassageWidth } from './passageWidth';
import type { SidePassages } from './sidePassages';
import type { DoorBeyond } from './doorBeyond';
import type { DoorLocation } from './doorLocation';
import type { PeriodicCheck } from './periodicCheck';
import type { PassageTurns } from './passageTurns';
import type { ChamberDimensions, RoomDimensions } from './chambersRooms';
import type { CircularContents, UnusualShape } from './unusualShape';
import type { UnusualSize } from './unusualSize';
import type { NumberOfExits, OneToFour } from './numberOfExits';
import type { ExitLocation, ExitAlternative } from './exitLocation';
import type { ExitDirection } from './exitDirection';
import type { Chute, Egress, Stairs } from './stairs';
import type { Pool } from './pool';
import type {
  MagicPool,
  PoolAlignment,
  TransmuteType,
  TransporterLocation,
} from './magicPool';
import type {
  MonsterDistributionLevel,
  MonsterLevel,
} from './monster/monsterLevel';
import type { Human, MonsterOne } from './monster/monsterOne';
import type { MonsterTwo } from './monster/monsterTwo';
import type { DragonThree, MonsterThree } from './monster/monsterThree';
import type {
  DragonFourOlder,
  DragonFourYounger,
  MonsterFour,
} from './monster/monsterFour';
import type {
  DragonFiveOlder,
  DragonFiveYounger,
  MonsterFive,
} from './monster/monsterFive';
import type { DragonSix, MonsterSix } from './monster/monsterSix';
import type { DragonSeven, MonsterSeven } from './monster/monsterSeven';
import type { DragonEight, MonsterEight } from './monster/monsterEight';
import type { DragonNine, MonsterNine } from './monster/monsterNine';
import type { DragonTen, MonsterTen } from './monster/monsterTen';
import type { CharacterRace } from './monster/character/characterRace';
import type { CharacterClassTable } from './monster/character/characterClass';
import type { PeriodicCheckDoorOnly } from './periodicCheckDoorOnly';
import type { TrickTrap } from './trickTrap';
import type { IllusionaryWallNature } from './illusionaryWallNature';
import type { GasTrapEffect } from './gasTrapEffect';
import type { ChamberRoomContents } from './chamberRoomContents';
import type { ChamberRoomStairs } from './chamberRoomStairs';
import type { TreasureWithoutMonster } from './treasure';
import type {
  TreasureProtectionType,
  TreasureProtectionGuardedBy,
  TreasureProtectionHiddenBy,
} from './treasureProtection';
import type { TreasureContainer } from './treasureContainer';
import type { TreasureMagicCategory } from './treasureMagic';
import type { TreasurePotion } from './treasurePotions';
import type { TreasurePotionAnimalControl } from './treasurePotionAnimalControl';
import type { TreasurePotionDragonControl } from './treasurePotionDragonControl';
import type { TreasurePotionGiantControl } from './treasurePotionGiantControl';
import type { TreasurePotionGiantStrength } from './treasurePotionGiantStrength';
import type { TreasurePotionHumanControl } from './treasurePotionHumanControl';
import type { TreasurePotionUndeadControl } from './treasurePotionUndeadControl';
import type { TreasureScroll } from './treasureScrolls';
import type { TreasureScrollProtectionElementals } from './treasureScrollProtectionElementals';
import type { TreasureScrollProtectionLycanthropes } from './treasureScrollProtectionLycanthropes';
import type { TreasureRing } from './treasureRings';
import type { TreasureRingContrariness } from './treasureRingContrariness';
import type { TreasureRingElementalCommand } from './treasureRingElementalCommand';
import type { TreasureRingProtection } from './treasureRingProtection';
import type { TreasureRingRegeneration } from './treasureRingRegeneration';
import type { TreasureRingTelekinesis } from './treasureRingTelekinesis';
import type { TreasureRingThreeWishes } from './treasureRingThreeWishes';
import type { TreasureRingWizardry } from './treasureRingWizardry';
import type { TreasureRodStaffWand } from './treasureRodsStavesWands';

export type Table<T> = {
  sides: number;
  entries: [Entry<T>, ...Entry<T>[]];
};

// Define a non-empty range tuple
export type Range = [number, ...number[]];

export type Entry<T> = {
  range: Range;
  command: T;
};

export type Command =
  | PeriodicCheck
  | DoorLocation
  | DoorBeyond
  | SidePassages
  | PassageWidth
  | SpecialPassage
  | GalleryStairLocation
  | GalleryStairOccurrence
  | StreamConstruction
  | RiverConstruction
  | RiverBoatBank
  | ChasmDepth
  | ChasmConstruction
  | JumpingPlaceWidth
  | PassageTurns
  | ChamberDimensions
  | RoomDimensions
  | UnusualShape
  | CircularContents
  | UnusualSize
  | NumberOfExits
  | OneToFour
  | ExitLocation
  | ExitAlternative
  | ExitDirection
  | Stairs
  | Egress
  | Chute
  | Pool
  | MagicPool
  | TransmuteType
  | PoolAlignment
  | TransporterLocation
  | MonsterDistributionLevel
  | MonsterLevel
  | MonsterOne
  | Human
  | MonsterTwo
  | MonsterThree
  | MonsterFour
  | MonsterFive
  | MonsterSix
  | MonsterSeven
  | MonsterEight
  | MonsterNine
  | MonsterTen
  | DragonThree
  | DragonFourYounger
  | DragonFourOlder
  | DragonFiveYounger
  | DragonFiveOlder
  | DragonSix
  | DragonSeven
  | DragonEight
  | DragonNine
  | DragonTen
  | CharacterClassTable
  | CharacterRace
  | PeriodicCheckDoorOnly
  | TrickTrap
  | IllusionaryWallNature
  | GasTrapEffect
  | ChamberRoomContents
  | ChamberRoomStairs
  | TreasureWithoutMonster
  | TreasureProtectionType
  | TreasureProtectionGuardedBy
  | TreasureProtectionHiddenBy
  | TreasureContainer
  | TreasureMagicCategory
  | TreasurePotion
  | TreasurePotionAnimalControl
  | TreasurePotionDragonControl
  | TreasurePotionGiantControl
  | TreasurePotionGiantStrength
  | TreasurePotionHumanControl
  | TreasurePotionUndeadControl
  | TreasureScroll
  | TreasureScrollProtectionElementals
  | TreasureScrollProtectionLycanthropes
  | TreasureRing
  | TreasureRingContrariness
  | TreasureRingElementalCommand
  | TreasureRingProtection
  | TreasureRingRegeneration
  | TreasureRingTelekinesis
  | TreasureRingThreeWishes
  | TreasureRingWizardry
  | TreasureRodStaffWand;
