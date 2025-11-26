import type {
  GalleryStairLocation,
  GalleryStairOccurrence,
  RiverBoatBank,
  RiverConstruction,
  SpecialPassage,
  StreamConstruction,
} from '../../dungeon/features/navigation/specialPassage/specialPassageTable';
import type {
  ChasmConstruction,
  ChasmDepth,
  JumpingPlaceWidth,
} from '../../dungeon/features/navigation/chasm/chasmTable';
import type { PassageWidth } from '../../dungeon/features/navigation/passageWidth/passageWidthTable';
import type { SidePassages } from '../../dungeon/features/navigation/sidePassage/sidePassageTable';
import type { DoorBeyond } from './doorBeyond';
import type { DoorLocation } from '../../dungeon/features/navigation/doorChain/doorChainTable';
import type { PeriodicCheck } from './periodicCheck';
import type { PassageTurns } from '../../dungeon/features/navigation/passageTurn/passageTurnTable';
import type { ChamberDimensions, RoomDimensions } from './chambersRooms';
import type { CircularContents, UnusualShape } from './unusualShape';
import type { UnusualSize } from './unusualSize';
import type {
  NumberOfExits,
  OneToFour,
} from '../../dungeon/features/navigation/exit/numberOfExitsTable';
import type {
  ExitAlternative,
  ExitDirection,
  ExitLocation,
} from '../../dungeon/features/navigation/exit/exitLocationsTable';
import type {
  Chute,
  Egress,
  Stairs,
} from '../../dungeon/features/navigation/exit/stairsTable';
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
import type { PeriodicCheckDoorOnly } from '../../dungeon/features/navigation/doorChain/doorChainTable';
import type { TrickTrap } from '../../dungeon/features/hazards/trickTrap/trickTrapTable';
import type { IllusionaryWallNature } from '../../dungeon/features/hazards/illusionaryWall/illusionaryWallTable';
import type { GasTrapEffect } from '../../dungeon/features/hazards/gasTrap/gasTrapTable';
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
import type {
  TreasurePotion,
  TreasurePotionAnimalControl,
  TreasurePotionDragonControl,
  TreasurePotionGiantControl,
  TreasurePotionGiantStrength,
  TreasurePotionHumanControl,
  TreasurePotionUndeadControl,
} from '../../dungeon/features/treasure/potion/potionTables';
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
import type { TreasureBagOfHolding } from './treasureBagOfHolding';
import type { TreasureBagOfTricks } from './treasureBagOfTricks';
import type { TreasureBracersOfDefense } from './treasureBracersOfDefense';
import type { TreasureBucknardsEverfullPurse } from './treasureBucknardsEverfullPurse';
import type { TreasureArtifactOrRelic } from './treasureArtifactOrRelic';
import type { TreasureMiscMagicE1 } from './treasureMiscMagicE1';
import type { TreasureMiscMagicE2 } from './treasureMiscMagicE2';
import type { TreasureMiscMagicE3 } from './treasureMiscMagicE3';
import type { TreasureMiscMagicE4 } from './treasureMiscMagicE4';
import type { TreasureMiscMagicE5 } from './treasureMiscMagicE5';
import type { TreasureRobeOfTheArchmagi } from './treasureRobeOfTheArchmagi';
import type { RobeOfUsefulItemsExtraPatch } from './treasureRobeOfUsefulItems';
import type { TreasureDeckOfManyThings } from './treasureDeckOfManyThings';
import type { TreasureFigurineOfWondrousPower } from './treasureFigurineOfWondrousPower';
import type { TreasureFigurineMarbleElephant } from './treasureFigurineMarbleElephant';
import type { TreasureGirdleOfGiantStrength } from './treasureGirdleOfGiantStrength';
import type { TreasureInstrumentOfTheBards } from './treasureInstrumentOfTheBards';
import type { TreasureIronFlaskContent } from './treasureIronFlask';
import type { TreasureHornOfValhallaType } from './treasureHornOfValhallaType';
import type { TreasureHornOfValhallaAttunement } from './treasureHornOfValhallaAttunement';
import type { TreasureHornOfValhallaAlignment } from './treasureHornOfValhallaAlignment';
import type { TreasureIounStoneType } from './treasureIounStones';
import type { TreasureEyesOfPetrification } from './treasureEyesOfPetrification';
import type { TreasureCarpetOfFlying } from './treasureCarpetOfFlying';
import type { TreasureCloakOfProtection } from './treasureCloakOfProtection';
import type { TreasureCrystalBall } from './treasureCrystalBall';
import type { TreasureStaffSerpent } from './treasureStaffSerpent';
import type { TreasureManualOfGolems } from './treasureManualOfGolems';
import type { TreasureMedallionRange } from './treasureMedallionEspRange';
import type { TreasureNecklaceOfMissiles } from './treasureNecklaceOfMissiles';
import type {
  TreasurePearlOfPowerEffect,
  TreasurePearlOfPowerRecall,
  TreasurePearlOfPowerRecallResult,
} from './treasurePearlOfPower';
import type { TreasurePearlOfWisdomOutcome } from './treasurePearlOfWisdom';
import type { TreasurePeriaptPoisonBonus } from './treasurePeriaptProofAgainstPoison';
import type { TreasurePhylacteryLongYearsOutcome } from './treasurePhylacteryLongYears';
import type { TreasureQuaalFeatherToken } from './treasureQuaalFeatherToken';
import type { TreasureNecklacePrayerBead } from './treasureNecklacePrayerBeads';
import type {
  TreasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurseResolution,
} from './treasureScarabOfProtection';
import type { TreasureArmorShield } from './treasureArmorShields';
import type { TreasureMiscWeapon } from './treasureMiscWeapons';
import type {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusual,
  TreasureSwordPrimaryAbilityCommand,
  TreasureSwordExtraordinaryPowerCommand,
  TreasureSwordDragonSlayerColor,
  TreasureSwordSpecialPurposeCommand,
  TreasureSwordSpecialPurposePowerCommand,
} from './treasureSwords';
import type { TreasureSwordAlignment } from './treasureSwordAlignment';

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
  | TreasureRodStaffWand
  | TreasureBagOfHolding
  | TreasureBagOfTricks
  | TreasureBracersOfDefense
  | TreasureBucknardsEverfullPurse
  | TreasureArtifactOrRelic
  | TreasureDeckOfManyThings
  | TreasureMiscMagicE2
  | TreasureMiscMagicE3
  | TreasureMiscMagicE4
  | TreasureMiscMagicE5
  | TreasureRobeOfTheArchmagi
  | RobeOfUsefulItemsExtraPatch
  | TreasureManualOfGolems
  | TreasureMedallionRange
  | TreasureNecklaceOfMissiles
  | TreasurePearlOfPowerEffect
  | TreasurePearlOfPowerRecall
  | TreasurePearlOfPowerRecallResult
  | TreasurePearlOfWisdomOutcome
  | TreasurePeriaptPoisonBonus
  | TreasurePhylacteryLongYearsOutcome
  | TreasureQuaalFeatherToken
  | TreasureNecklacePrayerBead
  | TreasureScarabOfProtectionCurse
  | TreasureScarabOfProtectionCurseResolution
  | TreasureArmorShield
  | TreasureSword
  | TreasureSwordKind
  | TreasureSwordUnusual
  | TreasureSwordPrimaryAbilityCommand
  | TreasureSwordExtraordinaryPowerCommand
  | TreasureSwordDragonSlayerColor
  | TreasureSwordSpecialPurposeCommand
  | TreasureSwordSpecialPurposePowerCommand
  | TreasureSwordAlignment
  | TreasureMiscMagicE1
  | TreasureFigurineOfWondrousPower
  | TreasureFigurineMarbleElephant
  | TreasureGirdleOfGiantStrength
  | TreasureInstrumentOfTheBards
  | TreasureIronFlaskContent
  | TreasureHornOfValhallaType
  | TreasureHornOfValhallaAttunement
  | TreasureHornOfValhallaAlignment
  | TreasureIounStoneType
  | TreasureStaffSerpent
  | TreasureCarpetOfFlying
  | TreasureCloakOfProtection
  | TreasureCrystalBall
  | TreasureEyesOfPetrification
  | TreasureMiscWeapon;
