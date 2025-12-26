import type { PeriodicCheck } from '../../tables/dungeon/periodicCheck';
import type { DoorBeyond } from '../../tables/dungeon/doorBeyond';
import type { SidePassages } from '../features/navigation/sidePassage/sidePassageTable';
import type { PassageTurns } from '../features/navigation/passageTurn/passageTurnTable';
import type { Stairs, Egress } from '../features/navigation/exit/stairsTable';
import type { SpecialPassage } from '../features/navigation/specialPassage/specialPassageTable';
import type { PassageWidth } from '../features/navigation/passageWidth/passageWidthTable';
import type {
  RoomDimensions,
  ChamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import type { NumberOfExits } from '../features/navigation/exit/numberOfExitsTable';
import type {
  UnusualShape,
  CircularContents,
} from '../../tables/dungeon/unusualShape';
import type { UnusualSize } from '../../tables/dungeon/unusualSize';
import type {
  DoorLocation,
  PeriodicCheckDoorOnly,
} from '../features/navigation/doorChain/doorChainTable';
import type {
  GalleryStairLocation,
  GalleryStairOccurrence,
  StreamConstruction,
  RiverConstruction,
  RiverBoatBank,
} from '../features/navigation/specialPassage/specialPassageTable';
import type {
  ChasmDepth,
  ChasmConstruction,
  JumpingPlaceWidth,
} from '../features/navigation/chasm/chasmTable';
import type { Pool } from '../../tables/dungeon/pool';
import type {
  MagicPool,
  TransmuteType,
  PoolAlignment,
  TransporterLocation,
} from '../../tables/dungeon/magicPool';
import type { MonsterLevel } from '../features/monsters/monsterLevel/monsterLevelTable';
import type {
  MonsterOne,
  Human,
} from '../features/monsters/monsterOne/monsterOneTables';
import type { MonsterTwo } from '../features/monsters/monsterTwo/monsterTwoTable';
import type {
  MonsterThree,
  DragonThree,
} from '../features/monsters/monsterThree/monsterThreeTables';
import type {
  MonsterFour,
  DragonFourYounger,
  DragonFourOlder,
} from '../features/monsters/monsterFour/monsterFourTables';
import type {
  MonsterFive,
  DragonFiveYounger,
  DragonFiveOlder,
} from '../features/monsters/monsterFive/monsterFiveTables';
import type {
  MonsterSix,
  DragonSix,
} from '../features/monsters/monsterSix/monsterSixTables';
import type {
  MonsterSeven,
  DragonSeven,
} from '../features/monsters/monsterSeven/monsterSevenTables';
import type {
  MonsterEight,
  DragonEight,
} from '../features/monsters/monsterEight/monsterEightTables';
import type {
  MonsterNine,
  DragonNine,
} from '../../tables/dungeon/monster/monsterNine';
import type {
  MonsterTen,
  DragonTen,
} from '../../tables/dungeon/monster/monsterTen';
import type { IllusionaryWallNature } from '../features/hazards/illusionaryWall/illusionaryWallTable';
import type {
  ExitAlternative,
  ExitDirection,
  ExitLocation,
} from '../features/navigation/exit/exitLocationsTable';
import type { GasTrapEffect } from '../features/hazards/gasTrap/gasTrapTable';
import type { TrickTrap } from '../features/hazards/trickTrap/trickTrapTable';
import type { ChamberRoomContents } from '../../tables/dungeon/chamberRoomContents';
import type { ChamberRoomStairs } from '../../tables/dungeon/chamberRoomStairs';
import type { TreasureWithoutMonster } from '../../tables/dungeon/treasure';
import type { TreasureContainer } from '../features/treasure/container/containerTable';
import type { TreasureMagicCategory } from '../features/treasure/magicCategory/magicCategoryTable';
import type {
  TreasurePotion,
  TreasurePotionAnimalControl,
  TreasurePotionDragonControl,
  TreasurePotionGiantControl,
  TreasurePotionGiantStrength,
  TreasurePotionHumanControl,
  TreasurePotionUndeadControl,
} from '../features/treasure/potion/potionTables';
import type { TreasureScroll } from '../features/treasure/scroll/scrollTables';
import type {
  TreasureRing,
  TreasureRingContrariness,
  TreasureRingElementalCommand,
  TreasureRingProtection,
  TreasureRingRegeneration,
  TreasureRingTelekinesis,
  TreasureRingThreeWishes,
  TreasureRingWizardry,
} from '../features/treasure/ring/ringTables';
import type { TreasureScrollProtectionElementals } from '../features/treasure/scroll/scrollTables';
import type { TreasureScrollProtectionLycanthropes } from '../features/treasure/scroll/scrollTables';
import type { TreasureMiscMagicE1 } from '../features/treasure/miscMagicE1/miscMagicE1Table';
import type {
  TreasureArtifactOrRelic,
  TreasureBagOfHolding,
  TreasureBagOfTricks,
  TreasureBracersOfDefense,
  TreasureBucknardsEverfullPurse,
} from '../features/treasure/miscMagicE1/miscMagicE1Subtables';
import type { TreasureMiscMagicE2 } from '../features/treasure/miscMagicE2/miscMagicE2Table';
import type {
  TreasureCarpetOfFlying,
  TreasureCloakOfProtection,
  TreasureCrystalBall,
  TreasureDeckOfManyThings,
  TreasureEyesOfPetrification,
} from '../features/treasure/miscMagicE2/miscMagicE2Subtables';
import type { TreasureMiscMagicE3 } from '../features/treasure/miscMagicE3/miscMagicE3Table';
import type {
  TreasureFigurineOfWondrousPower,
  TreasureFigurineMarbleElephant,
  TreasureGirdleOfGiantStrength,
  TreasureHornOfValhallaType,
  TreasureHornOfValhallaAttunement,
  TreasureHornOfValhallaAlignment,
  TreasureIounStoneType,
  TreasureInstrumentOfTheBards,
  TreasureIronFlaskContent,
} from '../features/treasure/miscMagicE3/miscMagicE3Subtables';
import type { TreasureMiscMagicE4 } from '../../tables/dungeon/treasureMiscMagicE4';
import type { TreasureMiscMagicE5 } from '../../tables/dungeon/treasureMiscMagicE5';
import type { TreasureRobeOfTheArchmagi } from '../../tables/dungeon/treasureRobeOfTheArchmagi';
import type { RobeOfUsefulItemsExtraPatch } from '../../tables/dungeon/treasureRobeOfUsefulItems';
import type { RobeOfUsefulItemsBasePatchType } from '../helpers/robeOfUsefulItems';
import type { TreasureStaffSerpent } from '../features/treasure/rodStaffWand/rodStaffWandTables';
import type { TreasureRodStaffWand } from '../features/treasure/rodStaffWand/rodStaffWandTables';
import type { TreasureManualOfGolems } from '../../tables/dungeon/treasureManualOfGolems';
import type { TreasureMedallionRange } from '../../tables/dungeon/treasureMedallionEspRange';
import type { TreasureNecklaceOfMissiles } from '../../tables/dungeon/treasureNecklaceOfMissiles';
import type {
  TreasurePearlOfPowerEffect,
  TreasurePearlOfPowerRecallResult,
} from '../../tables/dungeon/treasurePearlOfPower';
import type { TreasurePearlOfWisdomOutcome } from '../../tables/dungeon/treasurePearlOfWisdom';
import type { TreasurePeriaptPoisonBonus } from '../../tables/dungeon/treasurePeriaptProofAgainstPoison';
import type { TreasurePhylacteryLongYearsOutcome } from '../../tables/dungeon/treasurePhylacteryLongYears';
import type { TreasureQuaalFeatherToken } from '../../tables/dungeon/treasureQuaalFeatherToken';
import type { TreasureNecklacePrayerBead } from '../../tables/dungeon/treasureNecklacePrayerBeads';
import type {
  TreasureProtectionType,
  TreasureProtectionGuardedBy,
  TreasureProtectionHiddenBy,
} from '../features/treasure/protection/protectionTables';
import type { PartyResult } from '../models/character/characterSheet';
import type {
  TreasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurseResolution,
} from '../../tables/dungeon/treasureScarabOfProtection';
import type {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusualResult,
  TreasureSwordPrimaryAbilityResult,
  TreasureSwordExtraordinaryPowerResult,
  TreasureSwordSpecialPurposeResult,
  TreasureSwordSpecialPurposePowerResult,
  TreasureSwordDragonSlayerColorResult,
} from '../../tables/dungeon/treasureSwords';
import type { TreasureSwordAlignmentResult } from '../../tables/dungeon/treasureSwordAlignment';
import type { TreasureMiscWeapon } from '../../tables/dungeon/treasureMiscWeapons';
import type { TreasureArmorShield } from '../../tables/dungeon/treasureArmorShields';

export type DoorChainLaterality = 'Left' | 'Right';

// Domain outcome event kinds cover high-level tables we resolve.
export type OutcomeEvent =
  | {
      kind: 'periodicCheck';
      result: PeriodicCheck;
      level: number;
      avoidMonster?: boolean;
    }
  | {
      kind: 'doorBeyond';
      result: DoorBeyond;
      doorAhead?: boolean;
      level?: number;
    }
  | {
      kind: 'doorLocation';
      result: DoorLocation;
      sequence: number;
      doorChain?: {
        existing: DoorChainLaterality[];
        repeated: boolean;
        added?: DoorChainLaterality;
      };
    }
  | {
      kind: 'periodicCheckDoorOnly';
      result: PeriodicCheckDoorOnly;
      sequence: number;
      doorChain?: {
        existing: DoorChainLaterality[];
      };
    }
  | { kind: 'sidePassages'; result: SidePassages }
  | { kind: 'passageTurns'; result: PassageTurns }
  | { kind: 'stairs'; result: Stairs }
  | { kind: 'specialPassage'; result: SpecialPassage }
  | { kind: 'passageWidth'; result: PassageWidth }
  | { kind: 'roomDimensions'; result: RoomDimensions }
  | { kind: 'chamberDimensions'; result: ChamberDimensions }
  | { kind: 'egress'; result: Egress; which: 'one' | 'two' | 'three' }
  | { kind: 'chute'; result: number }
  | {
      kind: 'numberOfExits';
      result: NumberOfExits;
      context: { length: number; width: number; isRoom: boolean };
      count: number;
    }
  | { kind: 'unusualShape'; result: UnusualShape }
  | { kind: 'circularContents'; result: CircularContents }
  | { kind: 'circularPool'; result: Pool }
  | { kind: 'circularMagicPool'; result: MagicPool }
  | { kind: 'transmuteType'; result: TransmuteType }
  | { kind: 'poolAlignment'; result: PoolAlignment }
  | { kind: 'transporterLocation'; result: TransporterLocation }
  | { kind: 'unusualSize'; result: UnusualSize; extra: number; area?: number }
  | {
      kind: 'chamberRoomContents';
      result: ChamberRoomContents;
      autoResolved?: boolean;
    }
  | { kind: 'chamberRoomStairs'; result: ChamberRoomStairs }
  | { kind: 'trickTrap'; result: TrickTrap }
  | { kind: 'illusionaryWallNature'; result: IllusionaryWallNature }
  | {
      kind: 'passageExitLocation';
      result: ExitLocation;
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    }
  | {
      kind: 'doorExitLocation';
      result: ExitLocation;
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    }
  | {
      kind: 'exitDirection';
      result: ExitDirection;
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    }
  | {
      kind: 'exitAlternative';
      result: ExitAlternative;
      exitType?: 'door' | 'passage';
    }
  | { kind: 'gasTrapEffect'; result: GasTrapEffect }
  | { kind: 'wanderingWhereFrom'; result: PeriodicCheck }
  | { kind: 'galleryStairLocation'; result: GalleryStairLocation }
  | { kind: 'galleryStairOccurrence'; result: GalleryStairOccurrence }
  | { kind: 'streamConstruction'; result: StreamConstruction }
  | { kind: 'riverConstruction'; result: RiverConstruction }
  | { kind: 'riverBoatBank'; result: RiverBoatBank }
  | { kind: 'chasmDepth'; result: ChasmDepth }
  | { kind: 'chasmConstruction'; result: ChasmConstruction }
  | { kind: 'jumpingPlaceWidth'; result: JumpingPlaceWidth }
  | {
      kind: 'monsterLevel';
      result: MonsterLevel;
      dungeonLevel: number;
    }
  | {
      kind: 'monsterOne';
      result: MonsterOne;
      dungeonLevel: number;
      text?: string;
    }
  | {
      kind: 'monsterTwo';
      result: MonsterTwo;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'monsterThree';
      result: MonsterThree;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'monsterFour';
      result: MonsterFour;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'monsterFive';
      result: MonsterFive;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'monsterSix';
      result: MonsterSix;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'monsterSeven';
      result: MonsterSeven;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'monsterEight';
      result: MonsterEight;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'monsterNine';
      result: MonsterNine;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'monsterTen';
      result: MonsterTen;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'dragonThree';
      result: DragonThree;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonFourYounger';
      result: DragonFourYounger;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonFourOlder';
      result: DragonFourOlder;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonFiveYounger';
      result: DragonFiveYounger;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonFiveOlder';
      result: DragonFiveOlder;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonSix';
      result: DragonSix;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonSeven';
      result: DragonSeven;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonEight';
      result: DragonEight;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonNine';
      result: DragonNine;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'dragonTen';
      result: DragonTen;
      dungeonLevel: number;
      text: string;
    }
  | {
      kind: 'human';
      result: Human;
      dungeonLevel: number;
      text?: string;
      party?: PartyResult;
    }
  | {
      kind: 'treasure';
      level: number;
      withMonster: boolean;
      entries: TreasureEntry[];
      rollIndex?: number;
      totalRolls?: number;
    }
  | {
      kind: 'treasureContainer';
      result: TreasureContainer;
    }
  | {
      kind: 'treasureProtectionType';
      result: TreasureProtectionType;
    }
  | {
      kind: 'treasureProtectionGuardedBy';
      result: TreasureProtectionGuardedBy;
    }
  | {
      kind: 'treasureProtectionHiddenBy';
      result: TreasureProtectionHiddenBy;
    }
  | {
      kind: 'treasureMagicCategory';
      result: TreasureMagicCategory;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasurePotion';
      result: TreasurePotion;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasurePotionAnimalControl';
      result: TreasurePotionAnimalControl;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasurePotionDragonControl';
      result: TreasurePotionDragonControl;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasurePotionGiantControl';
      result: TreasurePotionGiantControl;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasurePotionGiantStrength';
      result: TreasurePotionGiantStrength;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasurePotionHumanControl';
      result: TreasurePotionHumanControl;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasurePotionUndeadControl';
      result: TreasurePotionUndeadControl;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasureScroll';
      result: TreasureScroll;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
      scroll:
        | {
            type: 'spells';
            caster: 'magic-user' | 'illusionist' | 'cleric' | 'druid';
            spellLevels: number[];
          }
        | {
            type: 'protection';
            protection: TreasureScroll;
            elementals?: TreasureScrollProtectionElementals;
            lycanthropes?: TreasureScrollProtectionLycanthropes;
          }
        | {
            type: 'curse';
          };
    }
  | {
      kind: 'treasureScrollProtectionElementals';
      result: TreasureScrollProtectionElementals;
    }
  | {
      kind: 'treasureScrollProtectionLycanthropes';
      result: TreasureScrollProtectionLycanthropes;
    }
  | {
      kind: 'treasureRing';
      result: TreasureRing;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
      spellStoring?: {
        caster: 'magic-user' | 'illusionist' | 'cleric' | 'druid';
        spellLevels: number[];
      };
    }
  | {
      kind: 'treasureRingContrariness';
      result: TreasureRingContrariness;
    }
  | {
      kind: 'treasureRingElementalCommand';
      result: TreasureRingElementalCommand;
    }
  | {
      kind: 'treasureRingProtection';
      result: TreasureRingProtection;
    }
  | {
      kind: 'treasureRingRegeneration';
      result: TreasureRingRegeneration;
    }
  | {
      kind: 'treasureRingTelekinesis';
      result: TreasureRingTelekinesis;
    }
  | {
      kind: 'treasureRingThreeWishes';
      result: TreasureRingThreeWishes;
    }
  | {
      kind: 'treasureRingWizardry';
      result: TreasureRingWizardry;
    }
  | {
      kind: 'treasureRodStaffWand';
      result: TreasureRodStaffWand;
    }
  | {
      kind: 'treasureBagOfHolding';
      result: TreasureBagOfHolding;
    }
  | {
      kind: 'treasureBagOfTricks';
      result: TreasureBagOfTricks;
    }
  | {
      kind: 'treasureBracersOfDefense';
      result: TreasureBracersOfDefense;
    }
  | {
      kind: 'treasureBucknardsEverfullPurse';
      result: TreasureBucknardsEverfullPurse;
    }
  | {
      kind: 'treasureArtifactOrRelic';
      result: TreasureArtifactOrRelic;
    }
  | {
      kind: 'treasureDeckOfManyThings';
      result: TreasureDeckOfManyThings;
    }
  | {
      kind: 'treasureFigurineOfWondrousPower';
      result: TreasureFigurineOfWondrousPower;
    }
  | {
      kind: 'treasureFigurineMarbleElephant';
      result: TreasureFigurineMarbleElephant;
    }
  | {
      kind: 'treasureGirdleOfGiantStrength';
      result: TreasureGirdleOfGiantStrength;
    }
  | {
      kind: 'treasureHornOfValhallaType';
      result: TreasureHornOfValhallaType;
    }
  | {
      kind: 'treasureHornOfValhallaAttunement';
      result: TreasureHornOfValhallaAttunement;
    }
  | {
      kind: 'treasureHornOfValhallaAlignment';
      result: TreasureHornOfValhallaAlignment;
    }
  | {
      kind: 'treasureIounStones';
      result: TreasureIounStonesResult;
    }
  | {
      kind: 'treasureEyesOfPetrification';
      result: TreasureEyesOfPetrification;
    }
  | {
      kind: 'treasureMiscMagicE1';
      result: TreasureMiscMagicE1;
      level?: number;
      treasureRoll?: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasureMiscMagicE2';
      result: TreasureMiscMagicE2;
      level?: number;
      treasureRoll?: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasureMiscMagicE3';
      result: TreasureMiscMagicE3;
    }
  | {
      kind: 'treasureMiscMagicE4';
      result: TreasureMiscMagicE4;
    }
  | {
      kind: 'treasureMiscMagicE5';
      result: TreasureMiscMagicE5;
    }
  | {
      kind: 'treasureScarabOfProtectionCurse';
      result: TreasureScarabOfProtectionCurse;
    }
  | {
      kind: 'treasureScarabOfProtectionCurseResolution';
      result: TreasureScarabOfProtectionCurseResolution;
    }
  | {
      kind: 'treasureArmorShields';
      result: TreasureArmorShield;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasureSwords';
      result: TreasureSword;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
      luckBladeWishes?: number;
    }
  | { kind: 'treasureSwordKind'; result: TreasureSwordKind }
  | { kind: 'treasureSwordUnusual'; result: TreasureSwordUnusualResult }
  | {
      kind: 'treasureSwordPrimaryAbility';
      result: TreasureSwordPrimaryAbilityResult;
    }
  | {
      kind: 'treasureSwordExtraordinaryPower';
      result: TreasureSwordExtraordinaryPowerResult;
    }
  | {
      kind: 'treasureSwordSpecialPurpose';
      result: TreasureSwordSpecialPurposeResult;
    }
  | {
      kind: 'treasureSwordSpecialPurposePower';
      result: TreasureSwordSpecialPurposePowerResult;
    }
  | {
      kind: 'treasureSwordDragonSlayerColor';
      result: TreasureSwordDragonSlayerColorResult;
    }
  | { kind: 'treasureSwordAlignment'; result: TreasureSwordAlignmentResult }
  | {
      kind: 'treasureMiscWeapons';
      result: TreasureMiscWeaponResult;
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasureRobeOfTheArchmagi';
      result: TreasureRobeOfTheArchmagi;
    }
  | {
      kind: 'treasureRobeOfUsefulItems';
      result: RobeOfUsefulItemsResult;
    }
  | {
      kind: 'treasureManualOfGolems';
      result: TreasureManualOfGolems;
    }
  | {
      kind: 'treasureMedallionRange';
      result: TreasureMedallionRange;
    }
  | {
      kind: 'treasureNecklaceOfMissiles';
      result: TreasureNecklaceOfMissiles;
    }
  | {
      kind: 'treasureNecklaceOfPrayerBeads';
      result: TreasureNecklaceOfPrayerBeadsResult;
    }
  | {
      kind: 'treasurePearlOfPowerEffect';
      result: TreasurePearlOfPowerEffect;
    }
  | {
      kind: 'treasurePearlOfPowerRecall';
      result: TreasurePearlOfPowerRecallResult;
    }
  | {
      kind: 'treasurePearlOfWisdom';
      result: TreasurePearlOfWisdomOutcome;
    }
  | {
      kind: 'treasurePeriaptProofAgainstPoison';
      result: TreasurePeriaptPoisonBonus;
    }
  | {
      kind: 'treasurePhylacteryLongYears';
      result: TreasurePhylacteryLongYearsOutcome;
    }
  | {
      kind: 'treasureQuaalFeatherToken';
      result: TreasureQuaalFeatherToken;
    }
  | {
      kind: 'treasureCarpetOfFlying';
      result: TreasureCarpetOfFlying;
    }
  | {
      kind: 'treasureCloakOfProtection';
      result: TreasureCloakOfProtection;
    }
  | {
      kind: 'treasureInstrumentOfTheBards';
      result: TreasureInstrumentOfTheBards;
    }
  | {
      kind: 'treasureIronFlask';
      result: TreasureIronFlaskContent;
    }
  | {
      kind: 'treasureCrystalBall';
      result: TreasureCrystalBall;
    }
  | {
      kind: 'treasureStaffSerpent';
      result: TreasureStaffSerpent;
    };

export type TreasureJewelryPiece = {
  type: string;
  material: string;
  value: number;
  exceptionalQuality: boolean;
  exceptionalStone: boolean;
};

export type TreasureGemCategoryId =
  | 'ornamental'
  | 'semiPrecious'
  | 'fancy'
  | 'fancyPrecious'
  | 'gem'
  | 'jewel';

export type TreasureGemCategory = {
  id: TreasureGemCategoryId;
  description: string;
  typicalSize: string;
};

export type TreasureGemValueAdjustment =
  | { type: 'unchanged' }
  | { type: 'stepIncrease'; steps: number }
  | { type: 'stepDecrease'; steps: number }
  | { type: 'double' }
  | { type: 'increasePercent'; percent: number }
  | { type: 'decreasePercent'; percent: number };

export type TreasureGemKindProperty = 'transparent' | 'translucent' | 'opaque';

export type TreasureGemKind = {
  name: string;
  description: string;
  property: TreasureGemKindProperty;
};

export type TreasureGemLot = {
  count: number;
  category: TreasureGemCategory;
  baseValue: number;
  baseValueStep: number;
  finalBaseStep: number;
  size: string;
  value: number;
  adjustment: TreasureGemValueAdjustment;
  kind?: TreasureGemKind;
};

export type TreasureEntry = {
  roll: number;
  command: TreasureWithoutMonster;
  quantity?: number;
  display?: string;
  gems?: TreasureGemLot[];
  jewelry?: TreasureJewelryPiece[];
  magicCategory?: TreasureMagicCategory;
  protection?: {
    type?: TreasureProtectionType;
    guardedBy?: TreasureProtectionGuardedBy;
    hiddenBy?: TreasureProtectionHiddenBy;
  };
};

export type TreasureIounStoneStatus = 'active' | 'duplicate' | 'dead';

export type TreasureIounStone = {
  index: number;
  roll: number;
  type: TreasureIounStoneType;
  color: string;
  shape: string;
  effect: string;
  status: TreasureIounStoneStatus;
  duplicateOf?: number;
};

export type TreasureNecklacePrayerBeadSpecial = {
  roll: number;
  type: TreasureNecklacePrayerBead;
};

export type TreasureNecklaceOfPrayerBeadsResult = {
  totalBeads: number;
  semiPrecious: number;
  fancy: number;
  specialBeads: TreasureNecklacePrayerBeadSpecial[];
};

export type TreasureIounStonesResult = {
  countRoll: number;
  stones: TreasureIounStone[];
};

export type RobeOfUsefulItemsBasePatchResult = {
  type: RobeOfUsefulItemsBasePatchType;
  count: number;
};

export type RobeOfUsefulItemsExtraPatchResult = {
  roll: number;
  item: Exclude<
    RobeOfUsefulItemsExtraPatch,
    RobeOfUsefulItemsExtraPatch.RollTwiceMore
  >;
};

export type RobeOfUsefulItemsResult = {
  basePatches: RobeOfUsefulItemsBasePatchResult[];
  extraPatchCountRolls: number[];
  requestedExtraPatchCount: number;
  extraPatches: RobeOfUsefulItemsExtraPatchResult[];
};

export type TreasureMiscWeaponResult = {
  item: TreasureMiscWeapon;
  quantity?: number;
};

export type PendingRoll = {
  type: 'pending-roll';
  table: string;
  id?: string;
  // optional context used by the UI to thread chains like door locations
  context?: unknown;
};

export type OutcomeEventNode = {
  type: 'event';
  id?: string;
  event: OutcomeEvent;
  roll: number;
  children?: DungeonOutcomeNode[];
};

export type DungeonOutcomeNode = OutcomeEventNode | PendingRoll;
