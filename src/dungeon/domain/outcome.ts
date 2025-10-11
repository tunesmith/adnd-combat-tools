import type { PeriodicCheck } from '../../tables/dungeon/periodicCheck';
import type { DoorBeyond } from '../../tables/dungeon/doorBeyond';
import type { SidePassages } from '../../tables/dungeon/sidePassages';
import type { PassageTurns } from '../../tables/dungeon/passageTurns';
import type { Stairs, Egress } from '../../tables/dungeon/stairs';
import type { SpecialPassage } from '../../tables/dungeon/specialPassage';
import type { PassageWidth } from '../../tables/dungeon/passageWidth';
import type {
  RoomDimensions,
  ChamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import type { NumberOfExits } from '../../tables/dungeon/numberOfExits';
import type {
  UnusualShape,
  CircularContents,
} from '../../tables/dungeon/unusualShape';
import type { UnusualSize } from '../../tables/dungeon/unusualSize';
import type { DoorLocation } from '../../tables/dungeon/doorLocation';
import type { PeriodicCheckDoorOnly } from '../../tables/dungeon/periodicCheckDoorOnly';
import type {
  GalleryStairLocation,
  GalleryStairOccurrence,
  StreamConstruction,
  RiverConstruction,
  RiverBoatBank,
  ChasmDepth,
  ChasmConstruction,
  JumpingPlaceWidth,
} from '../../tables/dungeon/specialPassage';
import type { Pool } from '../../tables/dungeon/pool';
import type {
  MagicPool,
  TransmuteType,
  PoolAlignment,
  TransporterLocation,
} from '../../tables/dungeon/magicPool';
import type { MonsterLevel } from '../../tables/dungeon/monster/monsterLevel';
import type {
  MonsterOne,
  Human,
} from '../../tables/dungeon/monster/monsterOne';
import type { MonsterTwo } from '../../tables/dungeon/monster/monsterTwo';
import type {
  MonsterThree,
  DragonThree,
} from '../../tables/dungeon/monster/monsterThree';
import type {
  MonsterFour,
  DragonFourYounger,
  DragonFourOlder,
} from '../../tables/dungeon/monster/monsterFour';
import type {
  MonsterFive,
  DragonFiveYounger,
  DragonFiveOlder,
} from '../../tables/dungeon/monster/monsterFive';
import type {
  MonsterSix,
  DragonSix,
} from '../../tables/dungeon/monster/monsterSix';
import type { IllusionaryWallNature } from '../../tables/dungeon/illusionaryWallNature';
import type {
  ExitAlternative,
  ExitLocation,
} from '../../tables/dungeon/exitLocation';
import type { ExitDirection } from '../../tables/dungeon/exitDirection';
import type { GasTrapEffect } from '../../tables/dungeon/gasTrapEffect';
import type { TrickTrap } from '../../tables/dungeon/trickTrap';
import type { ChamberRoomContents } from '../../tables/dungeon/chamberRoomContents';
import type { ChamberRoomStairs } from '../../tables/dungeon/chamberRoomStairs';
import type { TreasureWithoutMonster } from '../../tables/dungeon/treasure';
import type { TreasureContainer } from '../../tables/dungeon/treasureContainer';
import type { TreasureMagicCategory } from '../../tables/dungeon/treasureMagic';
import type { TreasurePotion } from '../../tables/dungeon/treasurePotions';
import type { TreasurePotionAnimalControl } from '../../tables/dungeon/treasurePotionAnimalControl';
import type { TreasurePotionDragonControl } from '../../tables/dungeon/treasurePotionDragonControl';
import type { TreasurePotionGiantControl } from '../../tables/dungeon/treasurePotionGiantControl';
import type { TreasurePotionGiantStrength } from '../../tables/dungeon/treasurePotionGiantStrength';
import type { TreasurePotionHumanControl } from '../../tables/dungeon/treasurePotionHumanControl';
import type { TreasurePotionUndeadControl } from '../../tables/dungeon/treasurePotionUndeadControl';
import type { TreasureScroll } from '../../tables/dungeon/treasureScrolls';
import type { TreasureRing } from '../../tables/dungeon/treasureRings';
import type { TreasureRingContrariness } from '../../tables/dungeon/treasureRingContrariness';
import type { TreasureRingElementalCommand } from '../../tables/dungeon/treasureRingElementalCommand';
import type { TreasureRingProtection } from '../../tables/dungeon/treasureRingProtection';
import type { TreasureRingRegeneration } from '../../tables/dungeon/treasureRingRegeneration';
import type { TreasureRingTelekinesis } from '../../tables/dungeon/treasureRingTelekinesis';
import type { TreasureRingThreeWishes } from '../../tables/dungeon/treasureRingThreeWishes';
import type { TreasureRingWizardry } from '../../tables/dungeon/treasureRingWizardry';
import type { TreasureScrollProtectionElementals } from '../../tables/dungeon/treasureScrollProtectionElementals';
import type { TreasureScrollProtectionLycanthropes } from '../../tables/dungeon/treasureScrollProtectionLycanthropes';
import type { TreasureRodStaffWand } from '../../tables/dungeon/treasureRodsStavesWands';
import type { TreasureBagOfHolding } from '../../tables/dungeon/treasureBagOfHolding';
import type { TreasureBagOfTricks } from '../../tables/dungeon/treasureBagOfTricks';
import type { TreasureBracersOfDefense } from '../../tables/dungeon/treasureBracersOfDefense';
import type { TreasureBucknardsEverfullPurse } from '../../tables/dungeon/treasureBucknardsEverfullPurse';
import type { TreasureArtifactOrRelic } from '../../tables/dungeon/treasureArtifactOrRelic';
import type { TreasureMiscMagicE1 } from '../../tables/dungeon/treasureMiscMagicE1';
import type { TreasureMiscMagicE2 } from '../../tables/dungeon/treasureMiscMagicE2';
import type { TreasureCarpetOfFlying } from '../../tables/dungeon/treasureCarpetOfFlying';
import type { TreasureCloakOfProtection } from '../../tables/dungeon/treasureCloakOfProtection';
import type { TreasureCrystalBall } from '../../tables/dungeon/treasureCrystalBall';
import type { TreasureStaffSerpent } from '../../tables/dungeon/treasureStaffSerpent';
import type {
  TreasureProtectionType,
  TreasureProtectionGuardedBy,
  TreasureProtectionHiddenBy,
} from '../../tables/dungeon/treasureProtection';
import type { PartyResult } from '../models/character/characterSheet';

export type DoorChainLaterality = 'Left' | 'Right';

// Domain outcome event kinds cover high-level tables we resolve.
export type OutcomeEvent =
  | {
      kind: 'periodicCheck';
      result: PeriodicCheck;
      level: number;
      avoidMonster?: boolean;
    }
  | { kind: 'doorBeyond'; result: DoorBeyond; doorAhead?: boolean }
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
      kind: 'treasureMiscMagicE1';
      result: TreasureMiscMagicE1;
      level?: number;
      treasureRoll?: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasureMiscMagicE2';
      result: TreasureMiscMagicE2;
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
      kind: 'treasureCrystalBall';
      result: TreasureCrystalBall;
    }
  | {
      kind: 'treasureStaffSerpent';
      result: TreasureStaffSerpent;
    };

export type TreasureEntry = {
  roll: number;
  command: TreasureWithoutMonster;
  quantity?: number;
  display?: string;
  magicCategory?: TreasureMagicCategory;
  protection?: {
    type?: TreasureProtectionType;
    guardedBy?: TreasureProtectionGuardedBy;
    hiddenBy?: TreasureProtectionHiddenBy;
  };
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
