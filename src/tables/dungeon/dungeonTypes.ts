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
import type {
  DoorBeyond,
  PeriodicCheck,
} from '../../dungeon/features/navigation/entry/entryTable';
import type { DoorLocation } from '../../dungeon/features/navigation/doorChain/doorChainTable';
import type { PassageTurns } from '../../dungeon/features/navigation/passageTurn/passageTurnTable';
import type {
  ChamberDimensions,
  ChamberRoomContents,
  ChamberRoomStairs,
  RoomDimensions,
} from '../../dungeon/features/environment/roomsChambers/roomsChambersTable';
import type {
  UnusualShape,
  UnusualSize,
} from '../../dungeon/features/environment/unusualSpace/unusualSpaceTable';
import type { CircularContents } from '../../dungeon/features/environment/circularPools/circularPoolsTable';
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
import type { Pool } from '../../dungeon/features/environment/circularPools/circularPoolsTable';
import type {
  MagicPool,
  PoolAlignment,
  TransmuteType,
  TransporterLocation,
} from '../../dungeon/features/environment/circularPools/circularPoolsTable';
import type {
  MonsterDistributionLevel,
  MonsterLevel,
} from '../../dungeon/features/monsters/monsterLevel/monsterLevelTable';
import type { Human } from '../../dungeon/features/monsters/human/humanTable';
import type { MonsterOne } from '../../dungeon/features/monsters/monsterOne/monsterOneTables';
import type { MonsterTwo } from '../../dungeon/features/monsters/monsterTwo/monsterTwoTable';
import type {
  DragonThree,
  MonsterThree,
} from '../../dungeon/features/monsters/monsterThree/monsterThreeTables';
import type {
  DragonFourOlder,
  DragonFourYounger,
  MonsterFour,
} from '../../dungeon/features/monsters/monsterFour/monsterFourTables';
import type {
  DragonFiveOlder,
  DragonFiveYounger,
  MonsterFive,
} from '../../dungeon/features/monsters/monsterFive/monsterFiveTables';
import type {
  DragonSix,
  MonsterSix,
} from '../../dungeon/features/monsters/monsterSix/monsterSixTables';
import type {
  DragonSeven,
  MonsterSeven,
} from '../../dungeon/features/monsters/monsterSeven/monsterSevenTables';
import type {
  DragonEight,
  MonsterEight,
} from '../../dungeon/features/monsters/monsterEight/monsterEightTables';
import type {
  DragonNine,
  MonsterNine,
} from '../../dungeon/features/monsters/monsterNine/monsterNineTables';
import type {
  DragonTen,
  MonsterTen,
} from '../../dungeon/features/monsters/monsterTen/monsterTenTables';
import type { CharacterRace } from './monster/character/characterRace';
import type { CharacterClassTable } from './monster/character/characterClass';
import type { PeriodicCheckDoorOnly } from '../../dungeon/features/navigation/doorChain/doorChainTable';
import type { TrickTrap } from '../../dungeon/features/hazards/trickTrap/trickTrapTable';
import type { IllusionaryWallNature } from '../../dungeon/features/hazards/illusionaryWall/illusionaryWallTable';
import type { GasTrapEffect } from '../../dungeon/features/hazards/gasTrap/gasTrapTable';
import type { TreasureWithoutMonster } from '../../dungeon/features/treasure/treasure/treasureTable';
import type {
  TreasureProtectionType,
  TreasureProtectionGuardedBy,
  TreasureProtectionHiddenBy,
} from '../../dungeon/features/treasure/protection/protectionTables';
import type { TreasureContainer } from '../../dungeon/features/treasure/container/containerTable';
import type { TreasureMagicCategory } from '../../dungeon/features/treasure/magicCategory/magicCategoryTable';
import type {
  TreasurePotion,
  TreasurePotionAnimalControl,
  TreasurePotionDragonControl,
  TreasurePotionGiantControl,
  TreasurePotionGiantStrength,
  TreasurePotionHumanControl,
  TreasurePotionUndeadControl,
} from '../../dungeon/features/treasure/potion/potionTables';
import type { TreasureScroll } from '../../dungeon/features/treasure/scroll/scrollTables';
import type { TreasureScrollProtectionElementals } from '../../dungeon/features/treasure/scroll/scrollTables';
import type { TreasureScrollProtectionLycanthropes } from '../../dungeon/features/treasure/scroll/scrollTables';
import type {
  TreasureRing,
  TreasureRingContrariness,
  TreasureRingElementalCommand,
  TreasureRingProtection,
  TreasureRingRegeneration,
  TreasureRingTelekinesis,
  TreasureRingThreeWishes,
  TreasureRingWizardry,
} from '../../dungeon/features/treasure/ring/ringTables';
import type {
  TreasureRodStaffWand,
  TreasureStaffSerpent,
} from '../../dungeon/features/treasure/rodStaffWand/rodStaffWandTables';
import type {
  TreasureArtifactOrRelic,
  TreasureBagOfHolding,
  TreasureBagOfTricks,
  TreasureBracersOfDefense,
  TreasureBucknardsEverfullPurse,
} from '../../dungeon/features/treasure/miscMagicE1/miscMagicE1Subtables';
import type { TreasureMiscMagicE1 } from '../../dungeon/features/treasure/miscMagicE1/miscMagicE1Table';
import type { TreasureMiscMagicE2 } from '../../dungeon/features/treasure/miscMagicE2/miscMagicE2Table';
import type {
  TreasureCarpetOfFlying,
  TreasureCloakOfProtection,
  TreasureCrystalBall,
  TreasureDeckOfManyThings,
  TreasureEyesOfPetrification,
} from '../../dungeon/features/treasure/miscMagicE2/miscMagicE2Subtables';
import type { TreasureMiscMagicE3 } from '../../dungeon/features/treasure/miscMagicE3/miscMagicE3Table';
import type {
  TreasureFigurineOfWondrousPower,
  TreasureFigurineMarbleElephant,
  TreasureGirdleOfGiantStrength,
  TreasureInstrumentOfTheBards,
  TreasureIronFlaskContent,
  TreasureHornOfValhallaType,
  TreasureHornOfValhallaAttunement,
  TreasureHornOfValhallaAlignment,
  TreasureIounStoneType,
} from '../../dungeon/features/treasure/miscMagicE3/miscMagicE3Subtables';
import type { TreasureMiscMagicE4 } from '../../dungeon/features/treasure/miscMagicE4/miscMagicE4Table';
import type { TreasureMiscMagicE5 } from '../../dungeon/features/treasure/miscMagicE5/miscMagicE5Table';
import type {
  RobeOfUsefulItemsExtraPatch,
  TreasureRobeOfTheArchmagi,
  TreasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurseResolution,
} from '../../dungeon/features/treasure/miscMagicE5/miscMagicE5Subtables';
import type {
  TreasureManualOfGolems,
  TreasureMedallionRange,
  TreasureNecklaceOfMissiles,
  TreasureNecklacePrayerBead,
  TreasurePearlOfPowerEffect,
  TreasurePearlOfPowerRecall,
  TreasurePearlOfPowerRecallResult,
  TreasurePearlOfWisdomOutcome,
  TreasurePeriaptPoisonBonus,
  TreasurePhylacteryLongYearsOutcome,
  TreasureQuaalFeatherToken,
} from '../../dungeon/features/treasure/miscMagicE4/miscMagicE4Subtables';
import type { TreasureArmorShield } from '../../dungeon/features/treasure/armorShields/armorShieldsTable';
import type { TreasureMiscWeapon } from '../../dungeon/features/treasure/miscWeapons/miscWeaponsTable';
import type {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusual,
  TreasureSwordPrimaryAbilityCommand,
  TreasureSwordExtraordinaryPowerCommand,
  TreasureSwordDragonSlayerColor,
  TreasureSwordSpecialPurposeCommand,
  TreasureSwordSpecialPurposePowerCommand,
} from '../../dungeon/features/treasure/swords/swordsTables';
import type { TreasureSwordAlignment } from '../../dungeon/features/treasure/swords/swordsAlignmentTable';

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
