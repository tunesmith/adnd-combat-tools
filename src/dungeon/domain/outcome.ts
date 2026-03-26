import type {
  DoorBeyond,
  PeriodicCheck,
} from '../features/navigation/entry/entryTable';
import type { SidePassages } from '../features/navigation/sidePassage/sidePassageTable';
import type { PassageTurns } from '../features/navigation/passageTurn/passageTurnTable';
import type { Stairs, Egress } from '../features/navigation/exit/stairsTable';
import type { SpecialPassage } from '../features/navigation/specialPassage/specialPassageTable';
import type { PassageWidth } from '../features/navigation/passageWidth/passageWidthTable';
import type {
  RoomDimensions,
  ChamberDimensions,
  ChamberRoomContents,
  ChamberRoomStairs,
} from '../features/environment/roomsChambers/roomsChambersTable';
import type { NumberOfExits } from '../features/navigation/exit/numberOfExitsTable';
import type { CircularContents } from '../features/environment/circularPools/circularPoolsTable';
import type { UnusualShape } from '../features/environment/unusualSpace/unusualSpaceTable';
import type { UnusualSize } from '../features/environment/unusualSpace/unusualSpaceTable';
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
import type { Pool } from '../features/environment/circularPools/circularPoolsTable';
import type {
  MagicPool,
  TransmuteType,
  PoolAlignment,
  TransporterLocation,
} from '../features/environment/circularPools/circularPoolsTable';
import type { MonsterLevel } from '../features/monsters/monsterLevel/monsterLevelTable';
import type { Human } from '../features/monsters/human/humanTable';
import type { MonsterOne } from '../features/monsters/monsterOne/monsterOneTables';
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
} from '../features/monsters/monsterNine/monsterNineTables';
import type {
  MonsterTen,
  DragonTen,
} from '../features/monsters/monsterTen/monsterTenTables';
import type { IllusionaryWallNature } from '../features/hazards/illusionaryWall/illusionaryWallTable';
import type {
  ExitAlternative,
  ExitDirection,
  ExitLocation,
} from '../features/navigation/exit/exitLocationsTable';
import type { GasTrapEffect } from '../features/hazards/gasTrap/gasTrapTable';
import type { TrickTrap } from '../features/hazards/trickTrap/trickTrapTable';
import type { TreasureWithoutMonster } from '../features/treasure/treasure/treasureTable';
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
import type { TreasureMiscMagicE4 } from '../features/treasure/miscMagicE4/miscMagicE4Table';
import type { TreasureMiscMagicE5 } from '../features/treasure/miscMagicE5/miscMagicE5Table';
import type {
  RobeOfUsefulItemsBasePatchType,
  RobeOfUsefulItemsExtraPatch,
  TreasureRobeOfTheArchmagi,
  TreasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurseResolution,
} from '../features/treasure/miscMagicE5/miscMagicE5Subtables';
import type { TreasureStaffSerpent } from '../features/treasure/rodStaffWand/rodStaffWandTables';
import type { TreasureRodStaffWand } from '../features/treasure/rodStaffWand/rodStaffWandTables';
import type {
  TreasureManualOfGolems,
  TreasureMedallionRange,
  TreasureNecklaceOfMissiles,
  TreasureNecklacePrayerBead,
  TreasurePearlOfPowerEffect,
  TreasurePearlOfPowerRecallResult,
  TreasurePearlOfWisdomOutcome,
  TreasurePeriaptPoisonBonus,
  TreasurePhylacteryLongYearsOutcome,
  TreasureQuaalFeatherToken,
} from '../features/treasure/miscMagicE4/miscMagicE4Subtables';
import type {
  TreasureProtectionType,
  TreasureProtectionGuardedBy,
  TreasureProtectionHiddenBy,
} from '../features/treasure/protection/protectionTables';
import type { PartyResult } from '../models/character/characterSheet';
import type {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusualResult,
  TreasureSwordPrimaryAbilityResult,
  TreasureSwordExtraordinaryPowerResult,
  TreasureSwordSpecialPurposeResult,
  TreasureSwordSpecialPurposePowerResult,
  TreasureSwordDragonSlayerColorResult,
} from '../features/treasure/swords/swordsTables';
import type { TreasureSwordAlignmentResult } from '../features/treasure/swords/swordsAlignmentTable';
import type { TreasureMiscWeapon } from '../features/treasure/miscWeapons/miscWeaponsTable';
import type { TreasureArmorShield } from '../features/treasure/armorShields/armorShieldsTable';

export type DoorChainLaterality = 'Left' | 'Right';

type ResultOutcomeEvent<Kind extends string, TResult> = {
  kind: Kind;
  result: TResult;
};

type DungeonLevelResultOutcomeEvent<
  Kind extends string,
  TResult
> = ResultOutcomeEvent<Kind, TResult> & {
  dungeonLevel: number;
};

type MonsterTextOutcomeEvent<
  Kind extends string,
  TResult
> = DungeonLevelResultOutcomeEvent<Kind, TResult> & {
  text?: string;
  party?: PartyResult;
};

type DragonTextOutcomeEvent<
  Kind extends string,
  TResult
> = DungeonLevelResultOutcomeEvent<Kind, TResult> & {
  text: string;
};

type TreasureRollOutcomeEvent<
  Kind extends string,
  TResult
> = ResultOutcomeEvent<Kind, TResult> & {
  level: number;
  treasureRoll: number;
  rollIndex?: number;
};

type OptionalTreasureRollOutcomeEvent<
  Kind extends string,
  TResult
> = ResultOutcomeEvent<Kind, TResult> & {
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

type TreasureScrollDetails =
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

type SpellStoringDetails = {
  caster: 'magic-user' | 'illusionist' | 'cleric' | 'druid';
  spellLevels: number[];
};

type NavigationOutcomeEvent =
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
  | ResultOutcomeEvent<'sidePassages', SidePassages>
  | ResultOutcomeEvent<'passageTurns', PassageTurns>
  | ResultOutcomeEvent<'stairs', Stairs>
  | ResultOutcomeEvent<'specialPassage', SpecialPassage>
  | ResultOutcomeEvent<'passageWidth', PassageWidth>
  | (ResultOutcomeEvent<'egress', Egress> & {
      which: 'one' | 'two' | 'three';
    })
  | ResultOutcomeEvent<'chute', number>
  | (ResultOutcomeEvent<'numberOfExits', NumberOfExits> & {
      context: { length: number; width: number; isRoom: boolean };
      count: number;
    })
  | (ResultOutcomeEvent<'passageExitLocation', ExitLocation> & {
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    })
  | (ResultOutcomeEvent<'doorExitLocation', ExitLocation> & {
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    })
  | (ResultOutcomeEvent<'exitDirection', ExitDirection> & {
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    })
  | (ResultOutcomeEvent<'exitAlternative', ExitAlternative> & {
      exitType?: 'door' | 'passage';
    })
  | ResultOutcomeEvent<'wanderingWhereFrom', PeriodicCheck>
  | ResultOutcomeEvent<'galleryStairLocation', GalleryStairLocation>
  | ResultOutcomeEvent<'galleryStairOccurrence', GalleryStairOccurrence>
  | ResultOutcomeEvent<'streamConstruction', StreamConstruction>
  | ResultOutcomeEvent<'riverConstruction', RiverConstruction>
  | ResultOutcomeEvent<'riverBoatBank', RiverBoatBank>
  | ResultOutcomeEvent<'chasmDepth', ChasmDepth>
  | ResultOutcomeEvent<'chasmConstruction', ChasmConstruction>
  | ResultOutcomeEvent<'jumpingPlaceWidth', JumpingPlaceWidth>;

type EnvironmentOutcomeEvent =
  | ResultOutcomeEvent<'roomDimensions', RoomDimensions>
  | ResultOutcomeEvent<'chamberDimensions', ChamberDimensions>
  | ResultOutcomeEvent<'unusualShape', UnusualShape>
  | ResultOutcomeEvent<'circularContents', CircularContents>
  | ResultOutcomeEvent<'circularPool', Pool>
  | ResultOutcomeEvent<'circularMagicPool', MagicPool>
  | ResultOutcomeEvent<'transmuteType', TransmuteType>
  | ResultOutcomeEvent<'poolAlignment', PoolAlignment>
  | ResultOutcomeEvent<'transporterLocation', TransporterLocation>
  | (ResultOutcomeEvent<'unusualSize', UnusualSize> & {
      extra: number;
      area?: number;
    })
  | (ResultOutcomeEvent<'chamberRoomContents', ChamberRoomContents> & {
      autoResolved?: boolean;
    })
  | ResultOutcomeEvent<'chamberRoomStairs', ChamberRoomStairs>;

type HazardOutcomeEvent =
  | ResultOutcomeEvent<'trickTrap', TrickTrap>
  | ResultOutcomeEvent<'illusionaryWallNature', IllusionaryWallNature>
  | ResultOutcomeEvent<'gasTrapEffect', GasTrapEffect>;

type MonsterOutcomeEvent =
  | DungeonLevelResultOutcomeEvent<'monsterLevel', MonsterLevel>
  | MonsterTextOutcomeEvent<'monsterOne', MonsterOne>
  | MonsterTextOutcomeEvent<'monsterTwo', MonsterTwo>
  | MonsterTextOutcomeEvent<'monsterThree', MonsterThree>
  | MonsterTextOutcomeEvent<'monsterFour', MonsterFour>
  | MonsterTextOutcomeEvent<'monsterFive', MonsterFive>
  | MonsterTextOutcomeEvent<'monsterSix', MonsterSix>
  | MonsterTextOutcomeEvent<'monsterSeven', MonsterSeven>
  | MonsterTextOutcomeEvent<'monsterEight', MonsterEight>
  | MonsterTextOutcomeEvent<'monsterNine', MonsterNine>
  | MonsterTextOutcomeEvent<'monsterTen', MonsterTen>
  | DragonTextOutcomeEvent<'dragonThree', DragonThree>
  | DragonTextOutcomeEvent<'dragonFourYounger', DragonFourYounger>
  | DragonTextOutcomeEvent<'dragonFourOlder', DragonFourOlder>
  | DragonTextOutcomeEvent<'dragonFiveYounger', DragonFiveYounger>
  | DragonTextOutcomeEvent<'dragonFiveOlder', DragonFiveOlder>
  | DragonTextOutcomeEvent<'dragonSix', DragonSix>
  | DragonTextOutcomeEvent<'dragonSeven', DragonSeven>
  | DragonTextOutcomeEvent<'dragonEight', DragonEight>
  | DragonTextOutcomeEvent<'dragonNine', DragonNine>
  | DragonTextOutcomeEvent<'dragonTen', DragonTen>
  | MonsterTextOutcomeEvent<'human', Human>;

type TreasureOutcomeEvent =
  | {
      kind: 'treasure';
      level: number;
      withMonster: boolean;
      entries: TreasureEntry[];
      rollIndex?: number;
      totalRolls?: number;
    }
  | ResultOutcomeEvent<'treasureContainer', TreasureContainer>
  | ResultOutcomeEvent<'treasureProtectionType', TreasureProtectionType>
  | ResultOutcomeEvent<
      'treasureProtectionGuardedBy',
      TreasureProtectionGuardedBy
    >
  | ResultOutcomeEvent<'treasureProtectionHiddenBy', TreasureProtectionHiddenBy>
  | TreasureRollOutcomeEvent<'treasureMagicCategory', TreasureMagicCategory>
  | TreasureRollOutcomeEvent<'treasurePotion', TreasurePotion>
  | TreasureRollOutcomeEvent<
      'treasurePotionAnimalControl',
      TreasurePotionAnimalControl
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionDragonControl',
      TreasurePotionDragonControl
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionGiantControl',
      TreasurePotionGiantControl
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionGiantStrength',
      TreasurePotionGiantStrength
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionHumanControl',
      TreasurePotionHumanControl
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionUndeadControl',
      TreasurePotionUndeadControl
    >
  | (TreasureRollOutcomeEvent<'treasureScroll', TreasureScroll> & {
      scroll: TreasureScrollDetails;
    })
  | ResultOutcomeEvent<
      'treasureScrollProtectionElementals',
      TreasureScrollProtectionElementals
    >
  | ResultOutcomeEvent<
      'treasureScrollProtectionLycanthropes',
      TreasureScrollProtectionLycanthropes
    >
  | (TreasureRollOutcomeEvent<'treasureRing', TreasureRing> & {
      spellStoring?: SpellStoringDetails;
    })
  | ResultOutcomeEvent<'treasureRingContrariness', TreasureRingContrariness>
  | ResultOutcomeEvent<
      'treasureRingElementalCommand',
      TreasureRingElementalCommand
    >
  | ResultOutcomeEvent<'treasureRingProtection', TreasureRingProtection>
  | ResultOutcomeEvent<'treasureRingRegeneration', TreasureRingRegeneration>
  | ResultOutcomeEvent<'treasureRingTelekinesis', TreasureRingTelekinesis>
  | ResultOutcomeEvent<'treasureRingThreeWishes', TreasureRingThreeWishes>
  | ResultOutcomeEvent<'treasureRingWizardry', TreasureRingWizardry>
  | ResultOutcomeEvent<'treasureRodStaffWand', TreasureRodStaffWand>
  | ResultOutcomeEvent<'treasureBagOfHolding', TreasureBagOfHolding>
  | ResultOutcomeEvent<'treasureBagOfTricks', TreasureBagOfTricks>
  | ResultOutcomeEvent<'treasureBracersOfDefense', TreasureBracersOfDefense>
  | ResultOutcomeEvent<
      'treasureBucknardsEverfullPurse',
      TreasureBucknardsEverfullPurse
    >
  | ResultOutcomeEvent<'treasureArtifactOrRelic', TreasureArtifactOrRelic>
  | ResultOutcomeEvent<'treasureDeckOfManyThings', TreasureDeckOfManyThings>
  | ResultOutcomeEvent<
      'treasureFigurineOfWondrousPower',
      TreasureFigurineOfWondrousPower
    >
  | ResultOutcomeEvent<
      'treasureFigurineMarbleElephant',
      TreasureFigurineMarbleElephant
    >
  | ResultOutcomeEvent<
      'treasureGirdleOfGiantStrength',
      TreasureGirdleOfGiantStrength
    >
  | ResultOutcomeEvent<'treasureHornOfValhallaType', TreasureHornOfValhallaType>
  | ResultOutcomeEvent<
      'treasureHornOfValhallaAttunement',
      TreasureHornOfValhallaAttunement
    >
  | ResultOutcomeEvent<
      'treasureHornOfValhallaAlignment',
      TreasureHornOfValhallaAlignment
    >
  | ResultOutcomeEvent<'treasureIounStones', TreasureIounStonesResult>
  | ResultOutcomeEvent<
      'treasureEyesOfPetrification',
      TreasureEyesOfPetrification
    >
  | OptionalTreasureRollOutcomeEvent<'treasureMiscMagicE1', TreasureMiscMagicE1>
  | OptionalTreasureRollOutcomeEvent<'treasureMiscMagicE2', TreasureMiscMagicE2>
  | ResultOutcomeEvent<'treasureMiscMagicE3', TreasureMiscMagicE3>
  | ResultOutcomeEvent<'treasureMiscMagicE4', TreasureMiscMagicE4>
  | ResultOutcomeEvent<'treasureMiscMagicE5', TreasureMiscMagicE5>
  | ResultOutcomeEvent<
      'treasureScarabOfProtectionCurse',
      TreasureScarabOfProtectionCurse
    >
  | ResultOutcomeEvent<
      'treasureScarabOfProtectionCurseResolution',
      TreasureScarabOfProtectionCurseResolution
    >
  | TreasureRollOutcomeEvent<'treasureArmorShields', TreasureArmorShield>
  | (TreasureRollOutcomeEvent<'treasureSwords', TreasureSword> & {
      luckBladeWishes?: number;
    })
  | ResultOutcomeEvent<'treasureSwordKind', TreasureSwordKind>
  | ResultOutcomeEvent<'treasureSwordUnusual', TreasureSwordUnusualResult>
  | ResultOutcomeEvent<
      'treasureSwordPrimaryAbility',
      TreasureSwordPrimaryAbilityResult
    >
  | ResultOutcomeEvent<
      'treasureSwordExtraordinaryPower',
      TreasureSwordExtraordinaryPowerResult
    >
  | ResultOutcomeEvent<
      'treasureSwordSpecialPurpose',
      TreasureSwordSpecialPurposeResult
    >
  | ResultOutcomeEvent<
      'treasureSwordSpecialPurposePower',
      TreasureSwordSpecialPurposePowerResult
    >
  | ResultOutcomeEvent<
      'treasureSwordDragonSlayerColor',
      TreasureSwordDragonSlayerColorResult
    >
  | ResultOutcomeEvent<'treasureSwordAlignment', TreasureSwordAlignmentResult>
  | TreasureRollOutcomeEvent<'treasureMiscWeapons', TreasureMiscWeaponResult>
  | ResultOutcomeEvent<'treasureRobeOfTheArchmagi', TreasureRobeOfTheArchmagi>
  | ResultOutcomeEvent<'treasureRobeOfUsefulItems', RobeOfUsefulItemsResult>
  | ResultOutcomeEvent<'treasureManualOfGolems', TreasureManualOfGolems>
  | ResultOutcomeEvent<'treasureMedallionRange', TreasureMedallionRange>
  | ResultOutcomeEvent<'treasureNecklaceOfMissiles', TreasureNecklaceOfMissiles>
  | ResultOutcomeEvent<
      'treasureNecklaceOfPrayerBeads',
      TreasureNecklaceOfPrayerBeadsResult
    >
  | ResultOutcomeEvent<'treasurePearlOfPowerEffect', TreasurePearlOfPowerEffect>
  | ResultOutcomeEvent<
      'treasurePearlOfPowerRecall',
      TreasurePearlOfPowerRecallResult
    >
  | ResultOutcomeEvent<'treasurePearlOfWisdom', TreasurePearlOfWisdomOutcome>
  | ResultOutcomeEvent<
      'treasurePeriaptProofAgainstPoison',
      TreasurePeriaptPoisonBonus
    >
  | ResultOutcomeEvent<
      'treasurePhylacteryLongYears',
      TreasurePhylacteryLongYearsOutcome
    >
  | ResultOutcomeEvent<'treasureQuaalFeatherToken', TreasureQuaalFeatherToken>
  | ResultOutcomeEvent<'treasureCarpetOfFlying', TreasureCarpetOfFlying>
  | ResultOutcomeEvent<'treasureCloakOfProtection', TreasureCloakOfProtection>
  | ResultOutcomeEvent<
      'treasureInstrumentOfTheBards',
      TreasureInstrumentOfTheBards
    >
  | ResultOutcomeEvent<'treasureIronFlask', TreasureIronFlaskContent>
  | ResultOutcomeEvent<'treasureCrystalBall', TreasureCrystalBall>
  | ResultOutcomeEvent<'treasureStaffSerpent', TreasureStaffSerpent>;

// Domain outcome event kinds cover high-level tables we resolve.
export type OutcomeEvent =
  | NavigationOutcomeEvent
  | EnvironmentOutcomeEvent
  | HazardOutcomeEvent
  | MonsterOutcomeEvent
  | TreasureOutcomeEvent;

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

type TreasureGemKindProperty = 'transparent' | 'translucent' | 'opaque';

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

type TreasureIounStone = {
  index: number;
  roll: number;
  type: TreasureIounStoneType;
  color: string;
  shape: string;
  effect: string;
  status: TreasureIounStoneStatus;
  duplicateOf?: number;
};

type TreasureNecklacePrayerBeadSpecial = {
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

type RobeOfUsefulItemsBasePatchResult = {
  type: RobeOfUsefulItemsBasePatchType;
  count: number;
};

type RobeOfUsefulItemsExtraPatchResult = {
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
