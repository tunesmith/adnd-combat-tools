import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
import { ROBE_OF_USEFUL_ITEMS_BASE_PATCHES } from '../helpers/robeOfUsefulItems';
import type { PartyResult } from '../models/character/characterSheet';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../tables/dungeon/periodicCheck';
import { doorBeyond, DoorBeyond } from '../../tables/dungeon/doorBeyond';
import { doorLocation, DoorLocation } from '../../tables/dungeon/doorLocation';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from './outcome';
import {
  stairs,
  Stairs,
  egressOne,
  egressTwo,
  egressThree,
} from '../../tables/dungeon/stairs';
import {
  numberOfExits,
  NumberOfExits,
} from '../../tables/dungeon/numberOfExits';
import {
  passageWidth,
  PassageWidth,
} from '../features/navigation/passageWidth/passageWidthTable';
import { pool, Pool } from '../../tables/dungeon/pool';
import {
  magicPool,
  MagicPool,
  transmuteType,
  poolAlignment,
  transporterLocation,
} from '../../tables/dungeon/magicPool';
import { trickTrap, TrickTrap } from '../../tables/dungeon/trickTrap';
import {
  illusionaryWallNature,
  IllusionaryWallNature,
} from '../../tables/dungeon/illusionaryWallNature';
import {
  roomDimensions,
  RoomDimensions,
  chamberDimensions,
  ChamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import {
  unusualShape,
  UnusualShape,
  circularContents,
  CircularContents,
} from '../../tables/dungeon/unusualShape';
import { unusualSize, UnusualSize } from '../../tables/dungeon/unusualSize';
import {
  chamberRoomContents,
  ChamberRoomContents,
} from '../../tables/dungeon/chamberRoomContents';
import { chamberRoomStairs } from '../../tables/dungeon/chamberRoomStairs';
import {
  treasureWithoutMonster,
  treasureWithMonster,
  TreasureWithoutMonster,
} from '../../tables/dungeon/treasure';
import { treasureContainer } from '../../tables/dungeon/treasureContainer';
import {
  treasureMagicCategory,
  TreasureMagicCategory,
} from '../../tables/dungeon/treasureMagic';
import {
  treasurePotion,
  TreasurePotion,
} from '../../tables/dungeon/treasurePotions';
import { treasurePotionAnimalControl } from '../../tables/dungeon/treasurePotionAnimalControl';
import { treasurePotionDragonControl } from '../../tables/dungeon/treasurePotionDragonControl';
import { treasurePotionGiantControl } from '../../tables/dungeon/treasurePotionGiantControl';
import { treasurePotionGiantStrength } from '../../tables/dungeon/treasurePotionGiantStrength';
import { treasurePotionHumanControl } from '../../tables/dungeon/treasurePotionHumanControl';
import { treasurePotionUndeadControl } from '../../tables/dungeon/treasurePotionUndeadControl';
import {
  treasureScrolls,
  TreasureScroll,
} from '../../tables/dungeon/treasureScrolls';
import { treasureScrollProtectionElementals } from '../../tables/dungeon/treasureScrollProtectionElementals';
import { treasureScrollProtectionLycanthropes } from '../../tables/dungeon/treasureScrollProtectionLycanthropes';
import {
  treasureRings,
  TreasureRing,
} from '../../tables/dungeon/treasureRings';
import { treasureRingContrariness } from '../../tables/dungeon/treasureRingContrariness';
import { treasureRingElementalCommand } from '../../tables/dungeon/treasureRingElementalCommand';
import { treasureRingProtection } from '../../tables/dungeon/treasureRingProtection';
import { treasureRingRegeneration } from '../../tables/dungeon/treasureRingRegeneration';
import { treasureRingTelekinesis } from '../../tables/dungeon/treasureRingTelekinesis';
import { treasureRingThreeWishes } from '../../tables/dungeon/treasureRingThreeWishes';
import { treasureRingWizardry } from '../../tables/dungeon/treasureRingWizardry';
import {
  treasureRodsStavesWands,
  TreasureRodStaffWand,
} from '../../tables/dungeon/treasureRodsStavesWands';
import { treasureBagOfHolding } from '../../tables/dungeon/treasureBagOfHolding';
import { treasureBagOfTricks } from '../../tables/dungeon/treasureBagOfTricks';
import { treasureBracersOfDefense } from '../../tables/dungeon/treasureBracersOfDefense';
import { treasureBucknardsEverfullPurse } from '../../tables/dungeon/treasureBucknardsEverfullPurse';
import { treasureArtifactOrRelic } from '../../tables/dungeon/treasureArtifactOrRelic';
import type { TreasureArtifactOrRelic } from '../../tables/dungeon/treasureArtifactOrRelic';
import {
  treasureMiscMagicE1,
  TreasureMiscMagicE1,
} from '../../tables/dungeon/treasureMiscMagicE1';
import {
  treasureMiscMagicE2,
  TreasureMiscMagicE2,
} from '../../tables/dungeon/treasureMiscMagicE2';
import {
  treasureMiscMagicE3,
  TreasureMiscMagicE3,
} from '../../tables/dungeon/treasureMiscMagicE3';
import {
  treasureMiscMagicE4,
  TreasureMiscMagicE4,
} from '../../tables/dungeon/treasureMiscMagicE4';
import {
  treasureMiscMagicE5,
  TreasureMiscMagicE5,
} from '../../tables/dungeon/treasureMiscMagicE5';
import { treasureRobeOfTheArchmagi } from '../../tables/dungeon/treasureRobeOfTheArchmagi';
import type { TreasureRobeOfTheArchmagi } from '../../tables/dungeon/treasureRobeOfTheArchmagi';
import {
  treasureRobeOfUsefulItems,
  RobeOfUsefulItemsExtraPatch,
} from '../../tables/dungeon/treasureRobeOfUsefulItems';
import {
  treasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurse,
  treasureScarabOfProtectionCursedResolution,
} from '../../tables/dungeon/treasureScarabOfProtection';
import type { TreasureScarabOfProtectionCurseResolution } from '../../tables/dungeon/treasureScarabOfProtection';
import { treasureArmorShields } from '../../tables/dungeon/treasureArmorShields';
import {
  treasureSwords,
  TreasureSword,
  treasureSwordKind,
  treasureSwordUnusual,
  SWORD_UNUSUAL_DETAILS,
  treasureSwordPrimaryAbility,
  treasureSwordPrimaryAbilityRestricted,
  TreasureSwordPrimaryAbilityCommand,
  describeSwordPrimaryAbility,
  treasureSwordExtraordinaryPower,
  treasureSwordExtraordinaryPowerRestricted,
  treasureSwordSpecialPurpose,
  treasureSwordSpecialPurposePower,
  TreasureSwordUnusual,
  TreasureSwordExtraordinaryPower,
  TreasureSwordExtraordinaryPowerCommand,
  describeSwordExtraordinaryPower,
  describeSwordSpecialPurpose,
  describeSwordSpecialPurposePower,
  DRAGON_SLAYER_COLOR_DETAILS,
  dragonSlayerColorTableForAlignment,
} from '../../tables/dungeon/treasureSwords';
import type {
  TreasureSwordPrimaryAbility,
  TreasureSwordSpecialPurpose,
  TreasureSwordSpecialPurposePower,
  TreasureSwordKind,
  TreasureSwordUnusualResult,
  TreasureSwordPrimaryAbilityResult,
  TreasureSwordExtraordinaryPowerResult,
  TreasureSwordSpecialPurposeResult,
  TreasureSwordSpecialPurposePowerResult,
  TreasureSwordDragonSlayerColorResult,
} from '../../tables/dungeon/treasureSwords';
import {
  treasureMiscWeapons,
  TreasureMiscWeapon,
} from '../../tables/dungeon/treasureMiscWeapons';
import {
  treasureSwordAlignment,
  treasureSwordAlignmentChaotic,
  treasureSwordAlignmentLawful,
  TreasureSwordAlignment,
  SWORD_ALIGNMENT_DETAILS as SWORD_ALIGNMENT,
  type TreasureSwordAlignmentResult,
} from '../../tables/dungeon/treasureSwordAlignment';
import {
  treasureFigurineOfWondrousPower,
  TreasureFigurineOfWondrousPower,
} from '../../tables/dungeon/treasureFigurineOfWondrousPower';
import { treasureFigurineMarbleElephant } from '../../tables/dungeon/treasureFigurineMarbleElephant';
import { treasureGirdleOfGiantStrength } from '../../tables/dungeon/treasureGirdleOfGiantStrength';
import { treasureInstrumentOfTheBards } from '../../tables/dungeon/treasureInstrumentOfTheBards';
import { treasureIronFlask } from '../../tables/dungeon/treasureIronFlask';
import {
  treasureIounStones,
  TreasureIounStoneType,
  IOUN_STONE_DEFINITIONS,
} from '../../tables/dungeon/treasureIounStones';
import { treasureManualOfGolems } from '../../tables/dungeon/treasureManualOfGolems';
import { treasureMedallionRange } from '../../tables/dungeon/treasureMedallionEspRange';
import { treasureNecklaceOfMissiles } from '../../tables/dungeon/treasureNecklaceOfMissiles';
import {
  treasurePearlOfPowerEffect,
  treasurePearlOfPowerRecall,
  TreasurePearlOfPowerEffect,
  resolvePearlRecallResult,
} from '../../tables/dungeon/treasurePearlOfPower';
import { treasurePearlOfWisdom } from '../../tables/dungeon/treasurePearlOfWisdom';
import { treasurePeriaptPoisonBonus } from '../../tables/dungeon/treasurePeriaptProofAgainstPoison';
import { treasurePhylacteryLongYears } from '../../tables/dungeon/treasurePhylacteryLongYears';
import { treasureQuaalFeatherToken } from '../../tables/dungeon/treasureQuaalFeatherToken';
import { treasureNecklacePrayerBeads } from '../../tables/dungeon/treasureNecklacePrayerBeads';
import type { TreasureNecklacePrayerBead } from '../../tables/dungeon/treasureNecklacePrayerBeads';
import { treasureHornOfValhallaType } from '../../tables/dungeon/treasureHornOfValhallaType';
import type { TreasureHornOfValhallaType } from '../../tables/dungeon/treasureHornOfValhallaType';
import {
  treasureHornOfValhallaAttunement,
  TreasureHornOfValhallaAttunement,
} from '../../tables/dungeon/treasureHornOfValhallaAttunement';
import { treasureHornOfValhallaAlignment } from '../../tables/dungeon/treasureHornOfValhallaAlignment';
import type { TreasureHornOfValhallaAlignment } from '../../tables/dungeon/treasureHornOfValhallaAlignment';
import { treasureDeckOfManyThings } from '../../tables/dungeon/treasureDeckOfManyThings';
import { treasureEyesOfPetrification } from '../../tables/dungeon/treasureEyesOfPetrification';
import { treasureCarpetOfFlying } from '../../tables/dungeon/treasureCarpetOfFlying';
import { treasureCloakOfProtection } from '../../tables/dungeon/treasureCloakOfProtection';
import { treasureCrystalBall } from '../../tables/dungeon/treasureCrystalBall';
import { treasureStaffSerpent } from '../../tables/dungeon/treasureStaffSerpent';
import {
  treasureProtectionType,
  TreasureProtectionType,
  treasureProtectionGuardedBy,
  treasureProtectionHiddenBy,
} from '../../tables/dungeon/treasureProtection';
import type {
  TreasureEntry,
  TreasureIounStonesResult,
  TreasureIounStoneStatus,
  RobeOfUsefulItemsResult,
  TreasureJewelryPiece,
  TreasureGemLot,
  TreasureGemCategory,
  TreasureGemValueAdjustment,
  TreasureGemKind,
  TreasureGemCategoryId,
} from './outcome';
import {
  periodicCheckDoorOnly,
  PeriodicCheckDoorOnly,
} from '../../tables/dungeon/periodicCheckDoorOnly';
import { getMonsterTable } from '../services/wanderingMonsterResult';
import {
  monsterOne,
  MonsterOne,
  human,
} from '../../tables/dungeon/monster/monsterOne';
import { monsterTwo } from '../../tables/dungeon/monster/monsterTwo';
import {
  monsterThree,
  MonsterThree,
  dragonThree,
} from '../../tables/dungeon/monster/monsterThree';
import {
  monsterFour,
  MonsterFour,
  dragonFourYounger,
  dragonFourOlder,
} from '../../tables/dungeon/monster/monsterFour';
import {
  monsterFive,
  MonsterFive,
  dragonFiveYounger,
  dragonFiveOlder,
} from '../../tables/dungeon/monster/monsterFive';
import {
  monsterSix,
  MonsterSix,
  dragonSix,
} from '../../tables/dungeon/monster/monsterSix';
import {
  monsterSeven,
  MonsterSeven,
  dragonSeven,
} from '../../tables/dungeon/monster/monsterSeven';
import {
  monsterEight,
  MonsterEight,
  dragonEight,
} from '../../tables/dungeon/monster/monsterEight';
import {
  monsterNine,
  MonsterNine,
  dragonNine,
} from '../../tables/dungeon/monster/monsterNine';
import {
  monsterTen,
  MonsterTen,
  dragonTen,
} from '../../tables/dungeon/monster/monsterTen';
import {
  monsterOneTextForCommand,
  humanTextForCommand,
} from '../services/monster/monsterOneResult';
import { monsterTwoTextForCommand } from '../services/monster/monsterTwoResult';
import {
  monsterThreeTextForCommand,
  dragonThreeTextForCommand,
} from '../services/monster/monsterThreeResult';
import {
  monsterFourTextForCommand,
  dragonFourYoungerTextForCommand,
  dragonFourOlderTextForCommand,
} from '../services/monster/monsterFourResult';
import {
  monsterFiveTextForCommand,
  dragonFiveYoungerTextForCommand,
  dragonFiveOlderTextForCommand,
} from '../services/monster/monsterFiveResult';
import {
  monsterSixTextForCommand,
  dragonSixTextForCommand,
} from '../services/monster/monsterSixResult';
import {
  monsterSevenTextForCommand,
  dragonSevenTextForCommand,
} from '../services/monster/monsterSevenResult';
import {
  monsterEightTextForCommand,
  dragonEightTextForCommand,
} from '../services/monster/monsterEightResult';
import {
  monsterNineTextForCommand,
  dragonNineTextForCommand,
} from '../services/monster/monsterNineResult';
import {
  monsterTenTextForCommand,
  dragonTenTextForCommand,
} from '../services/monster/monsterTenResult';
import { MonsterLevel } from '../../tables/dungeon/monster/monsterLevel';
import { oneToFour, OneToFour } from '../../tables/dungeon/numberOfExits';
import type { DoorChainLaterality } from './outcome';
import { resolveSubtable } from './resolveSubtable';
import { buildTreasureEvent } from './buildTreasureEvent';

type ScrollCaster = 'magic-user' | 'illusionist' | 'cleric' | 'druid';

type ScrollSpellDetail = {
  spells: number;
  magicUserRange: [number, number];
  clericRange: [number, number];
};

const SCROLL_SPELL_DETAILS: Partial<Record<TreasureScroll, ScrollSpellDetail>> =
  {
    [TreasureScroll.SpellOneLevel1to4]: {
      spells: 1,
      magicUserRange: [1, 4],
      clericRange: [1, 4],
    },
    [TreasureScroll.SpellOneLevel1to6]: {
      spells: 1,
      magicUserRange: [1, 6],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellOneLevel2to9]: {
      spells: 1,
      magicUserRange: [2, 9],
      clericRange: [2, 7],
    },
    [TreasureScroll.SpellTwoLevel1to4]: {
      spells: 2,
      magicUserRange: [1, 4],
      clericRange: [1, 4],
    },
    [TreasureScroll.SpellTwoLevel1to8]: {
      spells: 2,
      magicUserRange: [1, 8],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellThreeLevel1to4]: {
      spells: 3,
      magicUserRange: [1, 4],
      clericRange: [1, 4],
    },
    [TreasureScroll.SpellThreeLevel2to9]: {
      spells: 3,
      magicUserRange: [2, 9],
      clericRange: [2, 7],
    },
    [TreasureScroll.SpellFourLevel1to6]: {
      spells: 4,
      magicUserRange: [1, 6],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellFourLevel1to8]: {
      spells: 4,
      magicUserRange: [1, 8],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellFiveLevel1to6]: {
      spells: 5,
      magicUserRange: [1, 6],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellFiveLevel1to8]: {
      spells: 5,
      magicUserRange: [1, 8],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellSixLevel1to6]: {
      spells: 6,
      magicUserRange: [1, 6],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellSixLevel3to8]: {
      spells: 6,
      magicUserRange: [3, 8],
      clericRange: [3, 6],
    },
    [TreasureScroll.SpellSevenLevel1to8]: {
      spells: 7,
      magicUserRange: [1, 8],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellSevenLevel2to9]: {
      spells: 7,
      magicUserRange: [2, 9],
      clericRange: [2, 7],
    },
    [TreasureScroll.SpellSevenLevel4to9]: {
      spells: 7,
      magicUserRange: [4, 9],
      clericRange: [4, 7],
    },
  };

function isSpellScroll(result: TreasureScroll): boolean {
  return Object.prototype.hasOwnProperty.call(SCROLL_SPELL_DETAILS, result);
}

function isProtectionScroll(result: TreasureScroll): boolean {
  switch (result) {
    case TreasureScroll.ProtectionDemons:
    case TreasureScroll.ProtectionDevils:
    case TreasureScroll.ProtectionElementals:
    case TreasureScroll.ProtectionLycanthropes:
    case TreasureScroll.ProtectionMagic:
    case TreasureScroll.ProtectionPetrification:
    case TreasureScroll.ProtectionPossession:
    case TreasureScroll.ProtectionUndead:
      return true;
    default:
      return false;
  }
}

function rollCasterType(): ScrollCaster {
  const clericRoll = rollDice(100);
  if (clericRoll >= 71) {
    const druidRoll = rollDice(100);
    return druidRoll <= 25 ? 'druid' : 'cleric';
  }
  const illusionistRoll = rollDice(100);
  return illusionistRoll <= 10 ? 'illusionist' : 'magic-user';
}

function rollSpellLevels(count: number, range: [number, number]): number[] {
  const [min, max] = range;
  const levels: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const level = rollDice(max - min + 1) + min - 1;
    levels.push(level);
  }
  return levels;
}

function rollSpellStoringLevels(count: number, caster: ScrollCaster): number[] {
  const levels: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (caster === 'cleric' || caster === 'druid') {
      const baseRoll = rollDice(6);
      levels.push(baseRoll === 6 ? rollDice(4) : baseRoll);
    } else {
      const baseRoll = rollDice(8);
      levels.push(baseRoll === 8 ? rollDice(6) : baseRoll);
    }
  }
  return levels;
}

function toLaterality(loc: DoorLocation): DoorChainLaterality | undefined {
  if (loc === DoorLocation.Left) return 'Left';
  if (loc === DoorLocation.Right) return 'Right';
  return undefined;
}

export function resolvePeriodicCheck(options?: {
  roll?: number;
  level?: number;
  avoidMonster?: boolean;
}): DungeonOutcomeNode {
  const level = options?.level ?? 1;
  const usedRoll = options?.roll ?? rollDice(periodicCheck.sides);
  const command = getTableEntry(usedRoll, periodicCheck);
  const children: DungeonOutcomeNode[] = [];
  switch (command) {
    case PeriodicCheck.Door:
      children.push({
        type: 'pending-roll',
        table: 'doorLocation:0',
      });
      break;
    case PeriodicCheck.SidePassage:
      children.push({ type: 'pending-roll', table: 'sidePassages' });
      break;
    case PeriodicCheck.PassageTurn:
      children.push({ type: 'pending-roll', table: 'passageTurns' });
      break;
    case PeriodicCheck.Chamber:
      children.push({
        type: 'pending-roll',
        table: 'chamberDimensions',
        context: { kind: 'chamberDimensions', level },
      });
      break;
    case PeriodicCheck.Stairs:
      children.push({ type: 'pending-roll', table: 'stairs' });
      break;
    case PeriodicCheck.TrickTrap:
      children.push({ type: 'pending-roll', table: 'trickTrap' });
      break;
    case PeriodicCheck.WanderingMonster:
      children.push({ type: 'pending-roll', table: 'wanderingWhereFrom' });
      children.push({
        type: 'pending-roll',
        table: `monsterLevel:${level}`,
        context: { kind: 'wandering', level },
      });
      break;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'periodicCheck',
      result: command,
      level,
      avoidMonster: options?.avoidMonster,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDoorBeyond(options?: {
  roll?: number;
  doorAhead?: boolean;
  level?: number;
}): DungeonOutcomeNode {
  const level = options?.level ?? 1;
  const usedRoll = options?.roll ?? rollDice(doorBeyond.sides);
  const command = getTableEntry(usedRoll, doorBeyond);
  const children: DungeonOutcomeNode[] = [];
  if (command === DoorBeyond.Room) {
    children.push({
      type: 'pending-roll',
      table: 'roomDimensions',
      // Carry dungeon level forward so manual/detail resolutions roll monsters at the
      // correct level for rooms discovered beyond doors.
      context: { kind: 'chamberDimensions', level },
    });
  } else if (command === DoorBeyond.Chamber) {
    children.push({
      type: 'pending-roll',
      table: 'chamberDimensions',
      context: { kind: 'chamberDimensions', level },
    });
  } else if (
    command === DoorBeyond.PassageStraightAhead ||
    command === DoorBeyond.Passage45AheadBehind ||
    command === DoorBeyond.Passage45BehindAhead ||
    (command === DoorBeyond.ParallelPassageOrCloset && !options?.doorAhead)
  ) {
    children.push({ type: 'pending-roll', table: 'passageWidth' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'doorBeyond',
      result: command,
      doorAhead: options?.doorAhead,
      level,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveWanderingWhereFrom(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  let usedRoll = options?.roll ?? rollDice(periodicCheck.sides);
  let command = getTableEntry(usedRoll, periodicCheck);
  while (command === PeriodicCheck.WanderingMonster) {
    usedRoll = rollDice(periodicCheck.sides);
    command = getTableEntry(usedRoll, periodicCheck);
  }
  const children: DungeonOutcomeNode[] = [];
  switch (command) {
    case PeriodicCheck.Door:
      children.push({
        type: 'pending-roll',
        table: 'doorLocation:0',
      });
      break;
    case PeriodicCheck.SidePassage:
      children.push({ type: 'pending-roll', table: 'sidePassages' });
      break;
    case PeriodicCheck.PassageTurn:
      children.push({ type: 'pending-roll', table: 'passageTurns' });
      break;
    case PeriodicCheck.Chamber:
      children.push({ type: 'pending-roll', table: 'chamberDimensions' });
      break;
    case PeriodicCheck.Stairs:
      children.push({ type: 'pending-roll', table: 'stairs' });
      break;
    case PeriodicCheck.TrickTrap:
      children.push({ type: 'pending-roll', table: 'trickTrap' });
      break;
    default:
      break;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'wanderingWhereFrom',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

/**
 * When doing passage checks, the rules subtly imply this looks for *closed*
 * doors. Opening a door is a fresh move. For closed doors, we don't need to
 * roll what is behind the door. Roll for that when a decision is made to
 * open a door (or when the situation calls for it, like listening at doors).
 *
 * Check again immediately on TABLE I (periodicCheck) unless
 * door is straight ahead; if another door is not indicated,
 * then ignore the result and check again 30' past the door.
 */
export function resolveDoorLocation(options?: {
  roll?: number;
  existing?: DoorChainLaterality[];
  sequence?: number;
}): DungeonOutcomeNode {
  const existing = options?.existing ? [...options.existing] : [];
  const usedRoll = options?.roll ?? rollDice(doorLocation.sides);
  const command = getTableEntry(usedRoll, doorLocation);
  const lateral = toLaterality(command);
  const repeated = lateral ? existing.includes(lateral) : false;
  const sequence =
    options?.sequence !== undefined ? options.sequence : existing.length;
  const children: DungeonOutcomeNode[] = [];
  if (lateral && !repeated) {
    children.push({
      type: 'pending-roll',
      table: `periodicCheckDoorOnly:${sequence}`,
    });
  }
  const updatedExisting =
    lateral && !repeated ? [...existing, lateral] : existing;
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'doorLocation',
      result: command,
      sequence,
      doorChain: {
        existing: updatedExisting,
        repeated,
        added: !repeated ? lateral : undefined,
      },
    },
    children: children.length ? children : undefined,
  };
}

export function resolvePeriodicDoorOnly(options?: {
  roll?: number;
  existing?: DoorChainLaterality[];
  sequence?: number;
}): DungeonOutcomeNode {
  const existing = options?.existing ? [...options.existing] : [];
  const usedRoll = options?.roll ?? rollDice(periodicCheckDoorOnly.sides);
  const command = getTableEntry(usedRoll, periodicCheckDoorOnly);
  const sequence =
    options?.sequence !== undefined ? options.sequence : existing.length;
  const children: DungeonOutcomeNode[] = [];
  if (command === PeriodicCheckDoorOnly.Door) {
    children.push({
      type: 'pending-roll',
      table: `doorLocation:${sequence + 1}`,
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'periodicCheckDoorOnly',
      result: command,
      sequence,
      doorChain: {
        existing,
      },
    },
    children: children.length ? children : undefined,
  };
}

export function resolveStairs(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(stairs.sides);
  const command = getTableEntry(usedRoll, stairs);
  const event: OutcomeEvent = {
    kind: 'stairs',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === Stairs.DownOne) {
    children.push({ type: 'pending-roll', table: 'egress:one' });
  } else if (command === Stairs.DownTwo) {
    children.push({ type: 'pending-roll', table: 'egress:two' });
  } else if (command === Stairs.DownThree) {
    children.push({ type: 'pending-roll', table: 'egress:three' });
  } else if (command === Stairs.UpDead || command === Stairs.DownDead) {
    children.push({ type: 'pending-roll', table: 'chute' });
  } else if (command === Stairs.UpOneDownTwo) {
    children.push({ type: 'pending-roll', table: 'chamberDimensions' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolvePassageWidth(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(passageWidth.sides);
  const command = getTableEntry(usedRoll, passageWidth);
  const event: OutcomeEvent = {
    kind: 'passageWidth',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === PassageWidth.SpecialPassage) {
    children.push({ type: 'pending-roll', table: 'specialPassage' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveEgress(options: {
  roll?: number;
  which: 'one' | 'two' | 'three';
}): DungeonOutcomeNode {
  const table =
    options.which === 'one'
      ? egressOne
      : options.which === 'two'
      ? egressTwo
      : egressThree;
  const usedRoll = options.roll ?? rollDice(table.sides);
  const command = getTableEntry(usedRoll, table);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'egress',
      result: command,
      which: options.which,
    } as OutcomeEvent,
  };
}

export function resolveNumberOfExits(options: {
  roll?: number;
  length: number;
  width: number;
  isRoom: boolean;
}): DungeonOutcomeNode {
  const usedRoll = options.roll ?? rollDice(numberOfExits.sides);
  const command = getTableEntry(usedRoll, numberOfExits);
  const area = options.length * options.width;
  let count = 0;
  switch (command) {
    case NumberOfExits.OneTwo600:
      count = area <= 600 ? 1 : 2;
      break;
    case NumberOfExits.TwoThree600:
      count = area <= 600 ? 2 : 3;
      break;
    case NumberOfExits.ThreeFour600:
      count = area <= 600 ? 3 : 4;
      break;
    case NumberOfExits.ZeroOne1200:
      count = area <= 1200 ? 0 : 1;
      break;
    case NumberOfExits.ZeroOne1600:
      count = area <= 1600 ? 0 : 1;
      break;
    case NumberOfExits.OneToFour: {
      const countRoll = rollDice(oneToFour.sides);
      const bucket = getTableEntry(countRoll, oneToFour);
      count =
        bucket === OneToFour.One
          ? 1
          : bucket === OneToFour.Two
          ? 2
          : bucket === OneToFour.Three
          ? 3
          : 4;
      break;
    }
    case NumberOfExits.DoorChamberOrPassageRoom:
      count = 1;
      break;
  }
  const origin: 'room' | 'chamber' = options.isRoom ? 'room' : 'chamber';
  const baseExitType: 'door' | 'passage' = options.isRoom ? 'door' : 'passage';
  const exitType =
    command === NumberOfExits.DoorChamberOrPassageRoom
      ? baseExitType === 'door'
        ? 'passage'
        : 'door'
      : baseExitType;

  const children: DungeonOutcomeNode[] = [];
  if (count > 0) {
    for (let index = 1; index <= count; index += 1) {
      children.push({
        type: 'pending-roll',
        table: exitType === 'door' ? 'doorExitLocation' : 'passageExitLocation',
        id: `exit:${exitType}:${index}`,
        context: {
          kind: 'exit',
          exitType,
          index,
          total: count,
          origin,
        },
      });
    }
  }

  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'numberOfExits',
      result: command,
      context: {
        length: options.length,
        width: options.width,
        isRoom: options.isRoom,
      },
      count,
    } as OutcomeEvent,
    children: children.length > 0 ? children : undefined,
  };
}

export function resolveRoomDimensions(options?: {
  roll?: number;
  level?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(roomDimensions.sides);
  const command = getTableEntry(usedRoll, roomDimensions);
  const dungeonLevel = options?.level ?? 1;
  const event: OutcomeEvent = {
    kind: 'roomDimensions',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  switch (command) {
    case RoomDimensions.Square10x10:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 10, width: 10, isRoom: true },
      });
      break;
    case RoomDimensions.Square20x20:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 20, width: 20, isRoom: true },
      });
      break;
    case RoomDimensions.Square30x30:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 30, width: 30, isRoom: true },
      });
      break;
    case RoomDimensions.Square40x40:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 40, width: 40, isRoom: true },
      });
      break;
    case RoomDimensions.Rectangular10x20:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 10, width: 20, isRoom: true },
      });
      break;
    case RoomDimensions.Rectangular20x30:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 20, width: 30, isRoom: true },
      });
      break;
    case RoomDimensions.Rectangular20x40:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 20, width: 40, isRoom: true },
      });
      break;
    case RoomDimensions.Rectangular30x40:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 30, width: 40, isRoom: true },
      });
      break;
    case RoomDimensions.Unusual:
      children.push({ type: 'pending-roll', table: 'unusualShape' });
      children.push({
        type: 'pending-roll',
        table: 'unusualSize',
        context: { kind: 'unusualSize', extra: 0, isRoom: true },
      });
      break;
  }
  children.push({
    type: 'pending-roll',
    table: 'chamberRoomContents',
    context: { kind: 'chamberContents', level: dungeonLevel },
  });
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveChamberDimensions(options?: {
  roll?: number;
  context?: {
    forcedContents?: ChamberRoomContents;
    level?: number;
  };
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chamberDimensions.sides);
  const command = getTableEntry(usedRoll, chamberDimensions);
  const event: OutcomeEvent = {
    kind: 'chamberDimensions',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  const forcedContents = options?.context?.forcedContents;
  const forcedContentsLevel = options?.context?.level;
  const dungeonLevel = options?.context?.level ?? 1;
  switch (command) {
    case ChamberDimensions.Square20x20:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 20, width: 20, isRoom: false },
      });
      break;
    case ChamberDimensions.Square30x30:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 30, width: 30, isRoom: false },
      });
      break;
    case ChamberDimensions.Square40x40:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 40, width: 40, isRoom: false },
      });
      break;
    case ChamberDimensions.Rectangular20x30:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 20, width: 30, isRoom: false },
      });
      break;
    case ChamberDimensions.Rectangular30x50:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 30, width: 50, isRoom: false },
      });
      break;
    case ChamberDimensions.Rectangular40x60:
      children.push({
        type: 'pending-roll',
        table: 'numberOfExits',
        context: { kind: 'exits', length: 40, width: 60, isRoom: false },
      });
      break;
    case ChamberDimensions.Unusual:
      children.push({ type: 'pending-roll', table: 'unusualShape' });
      children.push({
        type: 'pending-roll',
        table: 'unusualSize',
        context: { kind: 'unusualSize', extra: 0, isRoom: false },
      });
      break;
  }
  if (forcedContents !== undefined) {
    children.push(
      resolveChamberRoomContents({
        level: forcedContentsLevel ?? dungeonLevel,
        forcedResult: forcedContents,
      })
    );
  } else {
    children.push({
      type: 'pending-roll',
      table: 'chamberRoomContents',
      context: { kind: 'chamberContents', level: dungeonLevel },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveUnusualShape(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(unusualShape.sides);
  const command = getTableEntry(usedRoll, unusualShape);
  const children: DungeonOutcomeNode[] = [];
  if (command === UnusualShape.Circular) {
    children.push({ type: 'pending-roll', table: 'circularContents' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'unusualShape', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveUnusualSize(options?: {
  roll?: number;
  extra?: number;
  isRoom?: boolean;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(unusualSize.sides);
  const command = getTableEntry(usedRoll, unusualSize);
  const extra = options?.extra ?? 0;
  const isRoom = options?.isRoom ?? false;
  const children: DungeonOutcomeNode[] = [];
  if (command === UnusualSize.RollAgain) {
    children.push({
      type: 'pending-roll',
      table: 'unusualSize',
      context: { kind: 'unusualSize', extra: extra + 2000, isRoom },
    });
  }
  const baseArea =
    command === UnusualSize.RollAgain
      ? undefined
      : unusualSizeBaseArea(command);
  const area = baseArea !== undefined ? baseArea + extra : undefined;
  if (area !== undefined && command !== UnusualSize.RollAgain) {
    children.push({
      type: 'pending-roll',
      table: 'numberOfExits',
      context: {
        kind: 'exits',
        length: area,
        width: 1,
        isRoom,
      },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'unusualSize',
      result: command,
      extra,
      area,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

function unusualSizeBaseArea(result: UnusualSize): number | undefined {
  switch (result) {
    case UnusualSize.SqFt500:
      return 500;
    case UnusualSize.SqFt900:
      return 900;
    case UnusualSize.SqFt1300:
      return 1300;
    case UnusualSize.SqFt2000:
      return 2000;
    case UnusualSize.SqFt2700:
      return 2700;
    case UnusualSize.SqFt3400:
      return 3400;
    default:
      return undefined;
  }
}

export function resolveChamberRoomContents(options?: {
  roll?: number;
  level?: number;
  forcedResult?: ChamberRoomContents;
}): DungeonOutcomeNode {
  const forcedResult = options?.forcedResult;
  const level = options?.level ?? 1;
  let usedRoll: number;
  let command: ChamberRoomContents;

  if (forcedResult !== undefined) {
    command = forcedResult;
    usedRoll =
      options?.roll ?? representativeRollForChamberContents(forcedResult);
  } else {
    usedRoll = options?.roll ?? rollDice(chamberRoomContents.sides);
    command = getTableEntry(usedRoll, chamberRoomContents);
  }
  const children: DungeonOutcomeNode[] = [];
  switch (command) {
    case ChamberRoomContents.MonsterOnly:
    case ChamberRoomContents.MonsterAndTreasure: {
      children.push({
        type: 'pending-roll',
        table: `monsterLevel:${level}`,
        context: { kind: 'wandering', level },
      });
      break;
    }
    case ChamberRoomContents.Special:
      children.push({ type: 'pending-roll', table: 'chamberRoomStairs' });
      break;
    case ChamberRoomContents.TrickTrap:
      children.push({ type: 'pending-roll', table: 'trickTrap' });
      break;
    default:
      break;
  }
  if (
    command === ChamberRoomContents.MonsterAndTreasure ||
    command === ChamberRoomContents.Treasure
  ) {
    const totalRolls =
      command === ChamberRoomContents.MonsterAndTreasure ? 2 : 1;
    for (let index = 1; index <= totalRolls; index += 1) {
      children.push({
        type: 'pending-roll',
        table: 'treasure',
        id: totalRolls > 1 ? `treasure:${index}` : undefined,
        context: {
          kind: 'treasure',
          level,
          withMonster: command === ChamberRoomContents.MonsterAndTreasure,
          rollIndex: index,
          totalRolls,
        },
      });
    }
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'chamberRoomContents',
      result: command,
      autoResolved: forcedResult !== undefined,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveChamberRoomStairs(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chamberRoomStairs.sides);
  const command = getTableEntry(usedRoll, chamberRoomStairs);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'chamberRoomStairs',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasure(options?: {
  roll?: number;
  level?: number;
  withMonster?: boolean;
  rollIndex?: number;
  totalRolls?: number;
}): DungeonOutcomeNode {
  const level = options?.level ?? 1;
  const withMonster = options?.withMonster ?? false;
  const table = withMonster ? treasureWithMonster : treasureWithoutMonster;
  const sides = table.sides;

  const usedRoll = options?.roll ?? rollDice(sides);
  const command = getTableEntry(usedRoll, table);
  const entry: TreasureEntry = { roll: usedRoll, command };
  enrichTreasureEntry(entry, level);

  const event: OutcomeEvent = {
    kind: 'treasure',
    level,
    withMonster,
    entries: [entry],
    rollIndex: options?.rollIndex,
    totalRolls: options?.totalRolls,
  } as OutcomeEvent;

  const children: DungeonOutcomeNode[] = [];
  if (entry.command === TreasureWithoutMonster.Magic) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMagicCategory',
      id: options?.rollIndex
        ? `treasureMagicCategory:${options.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level,
        treasureRoll: usedRoll,
        rollIndex: options?.rollIndex,
      },
    });
  }

  children.push(
    {
      type: 'pending-roll',
      table: 'treasureContainer',
      context: {
        kind: 'treasureContainer',
      },
    },
    {
      type: 'pending-roll',
      table: 'treasureProtectionType',
      context: {
        kind: 'treasureProtection',
        treasureRoll: usedRoll,
      },
    }
  );

  const node: OutcomeEventNode = {
    type: 'event',
    roll: usedRoll,
    event,
    children,
  };

  return node;
}

function enrichTreasureEntry(entry: TreasureEntry, level: number): void {
  switch (entry.command) {
    case TreasureWithoutMonster.CopperPerLevel:
      setCoinEntry(entry, 1000 * level, 'copper piece', 'copper pieces');
      break;
    case TreasureWithoutMonster.SilverPerLevel:
      setCoinEntry(entry, 1000 * level, 'silver piece', 'silver pieces');
      break;
    case TreasureWithoutMonster.ElectrumPerLevel:
      setCoinEntry(entry, 750 * level, 'electrum piece', 'electrum pieces');
      break;
    case TreasureWithoutMonster.GoldPerLevel:
      setCoinEntry(entry, 250 * level, 'gold piece', 'gold pieces');
      break;
    case TreasureWithoutMonster.PlatinumPerLevel:
      setCoinEntry(entry, 100 * level, 'platinum piece', 'platinum pieces');
      break;
    case TreasureWithoutMonster.GemsPerLevel: {
      const quantity = rollDice(4, level);
      entry.gems = quantity > 0 ? generateGemLots(quantity) : [];
      setCountEntry(entry, quantity, 'gem', 'gems');
      break;
    }
    case TreasureWithoutMonster.JewelryPerLevel: {
      entry.jewelry = generateJewelryPieces(level);
      setCountEntry(entry, level, 'piece of jewelry', 'pieces of jewelry');
      break;
    }
    case TreasureWithoutMonster.Magic:
      entry.magicCategory = undefined;
      break;
    default:
      break;
  }
}

function setCoinEntry(
  entry: TreasureEntry,
  quantity: number,
  singular: string,
  plural: string
): void {
  entry.quantity = quantity;
  entry.display = formatQuantity(quantity, singular, plural);
}

function setCountEntry(
  entry: TreasureEntry,
  quantity: number,
  singular: string,
  plural: string
): void {
  entry.quantity = quantity;
  entry.display = formatQuantity(quantity, singular, plural);
}

function formatQuantity(
  quantity: number,
  singular: string,
  plural: string
): string {
  const unit = quantity === 1 ? singular : plural;
  return `${quantity.toLocaleString()} ${unit}`;
}

type GemValueStep = {
  value: number;
};

const GEM_VALUE_STEPS: GemValueStep[] = [
  { value: 0.1 }, // 1 sp
  { value: 0.5 }, // 5 sp
  { value: 1 },
  { value: 5 },
  { value: 10 },
  { value: 50 },
  { value: 100 },
  { value: 500 },
  { value: 1000 },
  { value: 5000 },
  { value: 10000 },
  { value: 25000 },
  { value: 50000 },
  { value: 100000 },
  { value: 250000 },
  { value: 500000 },
  { value: 1000000 },
];

const GEM_SIZE_THRESHOLDS: { maxValue: number; label: string }[] = [
  { maxValue: 10, label: 'very small' },
  { maxValue: 50, label: 'small' },
  { maxValue: 100, label: 'average' },
  { maxValue: 500, label: 'large' },
  { maxValue: 1000, label: 'very large' },
  { maxValue: Number.POSITIVE_INFINITY, label: 'huge' },
];

type GemBaseTableEntry = {
  range: [number, number];
  category: TreasureGemCategory;
  baseValueStep: number;
};

const gemValueStepIndex = (value: number): number => {
  const index = GEM_VALUE_STEPS.findIndex((step) => step.value === value);
  if (index === -1) {
    throw new Error(`Unknown gem value step for ${value}`);
  }
  return index;
};

const GEM_BASE_TABLE: GemBaseTableEntry[] = [
  {
    range: [1, 25],
    category: {
      id: 'ornamental',
      description: 'Ornamental Stones',
      typicalSize: 'very small',
    },
    baseValueStep: gemValueStepIndex(10),
  },
  {
    range: [26, 50],
    category: {
      id: 'semiPrecious',
      description: 'Semi-precious Stones',
      typicalSize: 'small',
    },
    baseValueStep: gemValueStepIndex(50),
  },
  {
    range: [51, 70],
    category: {
      id: 'fancy',
      description: 'Fancy Stones',
      typicalSize: 'average',
    },
    baseValueStep: gemValueStepIndex(100),
  },
  {
    range: [71, 90],
    category: {
      id: 'fancyPrecious',
      description: 'Fancy Stones (Precious)',
      typicalSize: 'large',
    },
    baseValueStep: gemValueStepIndex(500),
  },
  {
    range: [91, 99],
    category: {
      id: 'gem',
      description: 'Gem Stones',
      typicalSize: 'very large',
    },
    baseValueStep: gemValueStepIndex(1000),
  },
  {
    range: [100, 100],
    category: {
      id: 'jewel',
      description: 'Gem Stones (Jewels)',
      typicalSize: 'huge',
    },
    baseValueStep: gemValueStepIndex(5000),
  },
];

type GemKindTableEntry = {
  range: [number, number];
  kind: TreasureGemKind;
};

const ORNAMENTAL_STONE_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Azurite',
      description: 'mottled deep blue',
      property: 'opaque',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Banded Agate',
      description: 'striped brown and blue and white and reddish',
      property: 'translucent',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Blue Quartz',
      description: 'pale blue',
      property: 'transparent',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Eye Agate',
      description: 'circles of gray, white, brown, blue and/or green',
      property: 'translucent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Hematite',
      description: 'gray-black',
      property: 'opaque',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Lapis Lazuli',
      description: 'light and dark blue with yellow flecks',
      property: 'opaque',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Malachite',
      description: 'striated light and dark green',
      property: 'opaque',
    },
  },
  {
    range: [8, 8],
    kind: {
      name: 'Moss Agate',
      description:
        'pink or yellow-white with grayish or greenish "moss" markings',
      property: 'translucent',
    },
  },
  {
    range: [9, 9],
    kind: {
      name: 'Obsidian',
      description: 'black',
      property: 'opaque',
    },
  },
  {
    range: [10, 10],
    kind: {
      name: 'Rhodochrosite',
      description: 'light pink',
      property: 'opaque',
    },
  },
  {
    range: [11, 11],
    kind: {
      name: 'Tiger Eye',
      description: 'rich brown with golden center under-hue',
      property: 'translucent',
    },
  },
  {
    range: [12, 12],
    kind: {
      name: 'Turquoise',
      description: 'light blue-green',
      property: 'opaque',
    },
  },
];

const SEMI_PRECIOUS_STONE_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Bloodstone',
      description: 'dark gray with red flecks',
      property: 'opaque',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Carnelian',
      description: 'orange to reddish brown (also called Sard)',
      property: 'opaque',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Chalcedony',
      description: 'white',
      property: 'opaque',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Chrysoprase',
      description: 'apple green to emerald green',
      property: 'translucent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Citrine',
      description: 'pale yellow brown',
      property: 'transparent',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Jasper',
      description: 'blue, black to brown',
      property: 'opaque',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Moonstone',
      description: 'white with pale blue glow',
      property: 'translucent',
    },
  },
  {
    range: [8, 8],
    kind: {
      name: 'Onyx',
      description: 'bands of black and white or pure black or white',
      property: 'opaque',
    },
  },
  {
    range: [9, 9],
    kind: {
      name: 'Rock Crystal',
      description: 'clear',
      property: 'transparent',
    },
  },
  {
    range: [10, 10],
    kind: {
      name: 'Sardonyx',
      description: 'bands of sard (red) and onyx (white) or sard',
      property: 'opaque',
    },
  },
  {
    range: [11, 11],
    kind: {
      name: 'Smoky Quartz',
      description: 'gray, yellow, or blue (Cairngorm), all light',
      property: 'transparent',
    },
  },
  {
    range: [12, 12],
    kind: {
      name: 'Star Rose Quartz',
      description: 'translucent rosy stone with white "star" center',
      property: 'translucent',
    },
  },
  {
    range: [13, 13],
    kind: {
      name: 'Zircon',
      description: 'clear pale blue-green',
      property: 'transparent',
    },
  },
];

const FANCY_STONE_100_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Amber',
      description: 'watery gold to rich gold',
      property: 'translucent',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Alexandrite',
      description: 'dark green',
      property: 'transparent',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Amethyst',
      description: 'deep purple',
      property: 'transparent',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Chrysoberyl',
      description: 'yellow green to green',
      property: 'transparent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Coral',
      description: 'crimson',
      property: 'opaque',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Garnet',
      description: 'red, brown-green, or violet (common varieties)',
      property: 'transparent',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Jade',
      description: 'light green, deep green, green and white, or white',
      property: 'translucent',
    },
  },
  {
    range: [8, 8],
    kind: {
      name: 'Jet',
      description: 'deep black',
      property: 'opaque',
    },
  },
  {
    range: [9, 9],
    kind: {
      name: 'Pearl',
      description: 'lustrous white, yellowish, pinkish, etc.',
      property: 'opaque',
    },
  },
  {
    range: [10, 10],
    kind: {
      name: 'Spinel',
      description: 'red, red-brown, deep green, or very deep blue',
      property: 'transparent',
    },
  },
  {
    range: [11, 11],
    kind: {
      name: 'Tourmaline',
      description: 'pale green, blue, brown, or reddish stones',
      property: 'transparent',
    },
  },
];

const FANCY_STONE_500_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Aquamarine',
      description: 'pale blue green',
      property: 'transparent',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Garnet',
      description: 'rare brilliant red, brown-green, or violet varieties',
      property: 'transparent',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Pearl',
      description: 'exceptional stones including pure black pearls',
      property: 'opaque',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Peridot',
      description: 'rich olive green (chrysolite)',
      property: 'transparent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Spinel',
      description: 'rare red, deep green, or very deep blue stones',
      property: 'transparent',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Topaz',
      description: 'golden yellow',
      property: 'transparent',
    },
  },
];

const GEM_STONE_1000_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Black Opal',
      description: 'dark green with black mottling and golden flecks',
      property: 'translucent',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Emerald',
      description: 'deep bright green',
      property: 'transparent',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Fire Opal',
      description: 'fiery red',
      property: 'translucent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Opal',
      description: 'pale blue with green and golden mottling',
      property: 'translucent',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Oriental Amethyst',
      description: 'rich purple (Corundum)',
      property: 'transparent',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Oriental Topaz',
      description: 'fiery yellow (Corundum)',
      property: 'transparent',
    },
  },
  {
    range: [8, 8],
    kind: {
      name: 'Sapphire',
      description: 'clear to medium blue (Corundum)',
      property: 'transparent',
    },
  },
];

const GEM_STONE_5000_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Black Sapphire',
      description: 'lustrous black with glowing highlights',
      property: 'transparent',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Diamond',
      description: 'clear blue-white or brilliant tinted stones',
      property: 'transparent',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Jacinth',
      description: 'fiery orange (corundum)',
      property: 'transparent',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Oriental Emerald',
      description: 'clear bright green corundum',
      property: 'transparent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Ruby',
      description: 'clear red to deep crimson corundum',
      property: 'transparent',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Star Ruby',
      description: 'translucent ruby with white star center',
      property: 'translucent',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Star Sapphire',
      description: 'translucent sapphire with white star center',
      property: 'translucent',
    },
  },
];

type GemKindTable =
  | GemKindTableEntry[]
  | {
      default: GemKindTableEntry[];
      highValue?: GemKindTableEntry[];
      highValueThreshold?: number;
    };

const GEM_KIND_TABLES: Partial<Record<TreasureGemCategoryId, GemKindTable>> = {
  ornamental: ORNAMENTAL_STONE_KINDS,
  semiPrecious: SEMI_PRECIOUS_STONE_KINDS,
  fancy: {
    default: FANCY_STONE_100_KINDS,
    highValue: FANCY_STONE_500_KINDS,
    highValueThreshold: 500,
  },
  fancyPrecious: {
    default: FANCY_STONE_500_KINDS,
    highValue: FANCY_STONE_500_KINDS,
  },
  gem: {
    default: GEM_STONE_1000_KINDS,
    highValue: GEM_STONE_5000_KINDS,
    highValueThreshold: 5000,
  },
  jewel: { default: GEM_STONE_5000_KINDS, highValue: GEM_STONE_5000_KINDS },
};

function getGemValueByStep(step: number): number {
  const entry = GEM_VALUE_STEPS[step];
  if (!entry) {
    throw new Error(`No gem value step for index ${step}`);
  }
  return entry.value;
}

type GemVariationResult = {
  finalBaseStep: number;
  value: number;
  adjustment: TreasureGemValueAdjustment;
};

function generateGemLots(totalGems: number): TreasureGemLot[] {
  if (totalGems <= 0) {
    return [];
  }
  const lotSizes = convertToGemLots(totalGems);
  return lotSizes.map((count) => rollGemLot(count));
}

function convertToGemLots(total: number): number[] {
  const lots: number[] = [];
  let remaining = total;
  const denominations = [10, 5, 1];
  for (const size of denominations) {
    const batches = Math.floor(remaining / size);
    for (let i = 0; i < batches; i++) {
      lots.push(size);
    }
    remaining -= batches * size;
  }
  return lots;
}

function rollGemLot(count: number): TreasureGemLot {
  const baseRoll = rollDice(100);
  const baseEntry = findGemBaseEntry(baseRoll);
  const differentialRoll = rollDice(100);
  const differential = getGemDifferential(differentialRoll);
  const adjustedStep = clampGemValueStep(
    baseEntry.baseValueStep + differential
  );
  const kind = rollGemKind(baseEntry.category.id, adjustedStep);
  const baseValue = getGemValueByStep(adjustedStep);
  const variation = applyGemValueVariation(adjustedStep);
  const size = gemSizeForStep(variation.finalBaseStep);

  return {
    count,
    category: baseEntry.category,
    baseValue,
    baseValueStep: adjustedStep,
    finalBaseStep: variation.finalBaseStep,
    size,
    value: variation.value,
    adjustment: variation.adjustment,
    kind,
  };
}

function findGemBaseEntry(roll: number): GemBaseTableEntry {
  const entry = GEM_BASE_TABLE.find(
    (candidate) => roll >= candidate.range[0] && roll <= candidate.range[1]
  );
  if (!entry) {
    throw new Error(`Gem base roll ${roll} out of range`);
  }
  return entry;
}

function getGemDifferential(roll: number): number {
  if (roll <= 25) return -2;
  if (roll <= 50) return -1;
  if (roll <= 70) return 0;
  if (roll <= 90) return 1;
  if (roll <= 99) return 2;
  return 3;
}

function rollGemKind(
  categoryId: TreasureGemCategoryId,
  valueStep: number
): TreasureGemKind | undefined {
  const rawTable = GEM_KIND_TABLES[categoryId];
  if (!rawTable) {
    return undefined;
  }
  let table: GemKindTableEntry[] | undefined;
  if (Array.isArray(rawTable)) {
    table = rawTable;
  } else {
    const thresholdValue = rawTable.highValueThreshold;
    const thresholdStep =
      thresholdValue !== undefined
        ? gemValueStepIndex(thresholdValue)
        : undefined;
    const isHighValue =
      thresholdStep !== undefined &&
      rawTable.highValue &&
      valueStep >= thresholdStep;
    table =
      isHighValue && rawTable.highValue ? rawTable.highValue : rawTable.default;
  }
  if (!table || table.length === 0) {
    return undefined;
  }
  const max = table[table.length - 1]?.range[1] ?? 0;
  if (max <= 0) return undefined;
  const roll = rollDice(max);
  const entry = table.find(
    (candidate) => roll >= candidate.range[0] && roll <= candidate.range[1]
  );
  return entry?.kind;
}

function clampGemValueStep(step: number): number {
  if (step < 0) return 0;
  const maxIndex = GEM_VALUE_STEPS.length - 1;
  if (step > maxIndex) return maxIndex;
  return step;
}

function applyGemValueVariation(baseStep: number): GemVariationResult {
  const maxStep = Math.min(baseStep + 7, GEM_VALUE_STEPS.length - 1);
  const minStep = Math.max(baseStep - 5, 0);
  let currentStep = baseStep;
  let netStepChange = 0;
  let rerollMode: 'increase' | 'decrease' | undefined;

  while (true) {
    const roll = rollD10Digit();
    if (rerollMode === 'increase' && roll > 8) {
      continue;
    }
    if (rerollMode === 'decrease' && roll < 2) {
      continue;
    }

    if (roll === 1) {
      if (currentStep >= maxStep) {
        rerollMode = undefined;
        continue;
      }
      currentStep += 1;
      netStepChange += 1;
      rerollMode = 'increase';
      continue;
    }

    if (roll === 0) {
      if (currentStep <= minStep) {
        rerollMode = undefined;
        continue;
      }
      currentStep -= 1;
      netStepChange -= 1;
      rerollMode = 'decrease';
      continue;
    }

    const baseValue = getGemValueByStep(currentStep);

    switch (roll) {
      case 2:
        return {
          finalBaseStep: currentStep,
          value: baseValue * 2,
          adjustment: { type: 'double' },
        };
      case 3: {
        const percent = rollDice(6) * 10;
        return {
          finalBaseStep: currentStep,
          value: baseValue * (1 + percent / 100),
          adjustment: { type: 'increasePercent', percent },
        };
      }
      case 4:
      case 5:
      case 6:
      case 7:
      case 8: {
        let adjustment: TreasureGemValueAdjustment = { type: 'unchanged' };
        if (netStepChange > 0) {
          adjustment = { type: 'stepIncrease', steps: netStepChange };
        } else if (netStepChange < 0) {
          adjustment = {
            type: 'stepDecrease',
            steps: Math.abs(netStepChange),
          };
        }
        return {
          finalBaseStep: currentStep,
          value: baseValue,
          adjustment,
        };
      }
      case 9: {
        const percent = rollDice(4) * 10;
        return {
          finalBaseStep: currentStep,
          value: baseValue * (1 - percent / 100),
          adjustment: { type: 'decreasePercent', percent },
        };
      }
      default:
        break;
    }
  }
}

function rollD10Digit(): number {
  const roll = rollDice(10);
  return roll === 10 ? 0 : roll;
}

function gemSizeForStep(step: number): string {
  const clampedStep = clampGemValueStep(step);
  const value = getGemValueByStep(clampedStep);
  const match = GEM_SIZE_THRESHOLDS.find((entry) => value <= entry.maxValue);
  return match ? match.label : 'huge';
}

type JewelryValueClass = {
  range: [number, number];
  material: string;
  hasGems: boolean;
  dice: { count: number; sides: number; multiplier: number };
  maxValue: number;
};

type JewelryTypeEntry = {
  range: [number, number];
  type: string;
};

const JEWELRY_VALUE_CLASSES: JewelryValueClass[] = [
  {
    range: [1, 10],
    material: 'ivory or wrought silver',
    hasGems: false,
    dice: { count: 1, sides: 10, multiplier: 100 },
    maxValue: 1000,
  },
  {
    range: [11, 20],
    material: 'wrought silver and gold',
    hasGems: false,
    dice: { count: 2, sides: 6, multiplier: 100 },
    maxValue: 1200,
  },
  {
    range: [21, 40],
    material: 'wrought gold',
    hasGems: false,
    dice: { count: 3, sides: 6, multiplier: 100 },
    maxValue: 1800,
  },
  {
    range: [41, 50],
    material: 'jade, coral, or wrought platinum',
    hasGems: false,
    dice: { count: 5, sides: 6, multiplier: 100 },
    maxValue: 3000,
  },
  {
    range: [51, 70],
    material: 'silver with gems',
    hasGems: true,
    dice: { count: 1, sides: 6, multiplier: 1000 },
    maxValue: 6000,
  },
  {
    range: [71, 90],
    material: 'gold with gems',
    hasGems: true,
    dice: { count: 2, sides: 4, multiplier: 1000 },
    maxValue: 8000,
  },
  {
    range: [91, 100],
    material: 'platinum with gems',
    hasGems: true,
    dice: { count: 2, sides: 6, multiplier: 1000 },
    maxValue: 12000,
  },
];

const JEWELRY_TYPE_TABLE: JewelryTypeEntry[] = [
  { range: [1, 2], type: 'anklet' },
  { range: [3, 6], type: 'arm band' },
  { range: [7, 9], type: 'belt' },
  { range: [10, 12], type: 'box (small)' },
  { range: [13, 16], type: 'bracelet' },
  { range: [17, 19], type: 'brooch' },
  { range: [20, 21], type: 'buckle' },
  { range: [22, 25], type: 'chain' },
  { range: [26, 26], type: 'chalice' },
  { range: [27, 27], type: 'choker' },
  { range: [28, 30], type: 'clasp' },
  { range: [31, 32], type: 'coffer' },
  { range: [33, 33], type: 'collar' },
  { range: [34, 35], type: 'comb' },
  { range: [36, 36], type: 'coronet' },
  { range: [37, 37], type: 'crown' },
  { range: [38, 39], type: 'decanter' },
  { range: [40, 40], type: 'diadem' },
  { range: [41, 45], type: 'earring' },
  { range: [46, 47], type: 'fob' },
  { range: [48, 52], type: 'goblet' },
  { range: [53, 54], type: 'headband (fillet)' },
  { range: [55, 57], type: 'idol' },
  { range: [58, 59], type: 'locket' },
  { range: [60, 62], type: 'medal' },
  { range: [63, 68], type: 'medallion' },
  { range: [69, 75], type: 'necklace' },
  { range: [76, 78], type: 'pendant' },
  { range: [79, 83], type: 'pin' },
  { range: [84, 84], type: 'orb' },
  { range: [85, 93], type: 'ring' },
  { range: [94, 94], type: 'sceptre' },
  { range: [95, 96], type: 'seal' },
  { range: [97, 99], type: 'statuette' },
  { range: [100, 100], type: 'tiara' },
];

function generateJewelryPieces(count: number): TreasureJewelryPiece[] {
  const pieces: TreasureJewelryPiece[] = [];
  for (let i = 0; i < count; i++) {
    let classIndex = findJewelryValueClass(rollDice(100));
    let classInfo = getJewelryValueClass(classIndex);
    let value = rollJewelryValue(classInfo);
    let exceptionalQuality = false;

    while (rollDice(10) === 1) {
      exceptionalQuality = true;
      if (classIndex >= JEWELRY_VALUE_CLASSES.length - 1) {
        value = classInfo.maxValue;
        break;
      }
      classIndex += 1;
      classInfo = getJewelryValueClass(classIndex);
      value = rollJewelryValue(classInfo);
    }

    let exceptionalStone = false;
    if (classInfo.hasGems && rollDice(8) === 1) {
      exceptionalStone = true;
      let bonus = 5000;
      while (bonus < 640000 && rollDice(6) === 1) {
        bonus = Math.min(bonus * 2, 640000);
      }
      value += bonus;
    }

    pieces.push({
      type: rollJewelryType(),
      material: resolveMaterialVariant(classInfo.material),
      value,
      exceptionalQuality,
      exceptionalStone,
    });
  }
  return pieces;
}

function resolveMaterialVariant(material: string): string {
  if (material === 'ivory or wrought silver') {
    return rollDice(2) === 1 ? 'ivory' : 'wrought silver';
  }
  if (material === 'jade, coral, or wrought platinum') {
    const roll = rollDice(3);
    if (roll === 1) return 'jade';
    if (roll === 2) return 'coral';
    return 'wrought platinum';
  }
  return material;
}

function rollJewelryValue(info: JewelryValueClass): number {
  const base = rollDice(info.dice.sides, info.dice.count);
  return base * info.dice.multiplier;
}

function rollJewelryType(): string {
  const roll = rollDice(100);
  const entry = findByRange(JEWELRY_TYPE_TABLE, roll);
  return entry.type;
}

function findJewelryValueClass(roll: number): number {
  const index = JEWELRY_VALUE_CLASSES.findIndex((entry) =>
    isWithinRange(entry.range, roll)
  );
  if (index === -1) return JEWELRY_VALUE_CLASSES.length - 1;
  return index;
}

function getJewelryValueClass(index: number): JewelryValueClass {
  const length = JEWELRY_VALUE_CLASSES.length;
  if (length === 0) {
    throw new Error('No jewelry value classes configured');
  }
  const clamped = Math.min(Math.max(index, 0), length - 1);
  const result = JEWELRY_VALUE_CLASSES[clamped];
  if (!result) {
    throw new Error('Unable to resolve jewelry value class');
  }
  return result;
}

function findByRange<T extends { range: [number, number] }>(
  entries: T[],
  roll: number
): T {
  if (entries.length === 0) {
    throw new Error('No entries defined for jewelry lookup');
  }
  const found = entries.find((entry) => isWithinRange(entry.range, roll));
  const fallback = entries[entries.length - 1];
  if (!fallback) {
    throw new Error('Unable to resolve fallback jewelry entry');
  }
  return found ?? fallback;
}

function isWithinRange(range: [number, number], roll: number): boolean {
  return roll >= range[0] && roll <= range[1];
}

export function resolveTreasureProtectionType(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureProtectionType.sides);
  const command = getTableEntry(usedRoll, treasureProtectionType);
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureProtectionType.Guarded) {
    children.push({
      type: 'pending-roll',
      table: 'treasureProtectionGuardedBy',
    });
  } else {
    children.push({
      type: 'pending-roll',
      table: 'treasureProtectionHiddenBy',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureProtectionType',
      result: command,
    } as OutcomeEvent,
    children,
  };
}

export function resolveTreasureProtectionGuardedBy(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureProtectionGuardedBy.sides);
  const command = getTableEntry(usedRoll, treasureProtectionGuardedBy);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureProtectionGuardedBy',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureProtectionHiddenBy(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureProtectionHiddenBy.sides);
  const command = getTableEntry(usedRoll, treasureProtectionHiddenBy);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureProtectionHiddenBy',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureMagicCategory(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMagicCategory.sides);
  const command = getTableEntry(usedRoll, treasureMagicCategory);
  const event: OutcomeEvent = {
    kind: 'treasureMagicCategory',
    result: command,
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? usedRoll,
    rollIndex: options?.rollIndex,
  };
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMagicCategory.Potions) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePotion',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.Scrolls) {
    children.push({
      type: 'pending-roll',
      table: 'treasureScroll',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.Rings) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRing',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.RodsStavesWands) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRodStaffWand',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE1) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE1',
      id: event.rollIndex
        ? `treasureMiscMagicE1:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE2) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE2',
      id: event.rollIndex
        ? `treasureMiscMagicE2:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE3) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE3',
      id: event.rollIndex
        ? `treasureMiscMagicE3:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE4) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE4',
      id: event.rollIndex
        ? `treasureMiscMagicE4:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscMagicE5) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscMagicE5',
      id: event.rollIndex
        ? `treasureMiscMagicE5:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.ArmorShields) {
    children.push({
      type: 'pending-roll',
      table: 'treasureArmorShields',
      id: event.rollIndex
        ? `treasureArmorShields:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.Swords) {
    children.push({
      type: 'pending-roll',
      table: 'treasureSwords',
      id: event.rollIndex ? `treasureSwords:${event.rollIndex}` : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasureMagicCategory.MiscWeapons) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMiscWeapons',
      id: event.rollIndex
        ? `treasureMiscWeapons:${event.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasurePotion(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePotion.sides);
  const command = getTableEntry(usedRoll, treasurePotion);
  const event: OutcomeEvent = {
    kind: 'treasurePotion',
    result: command,
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? usedRoll,
    rollIndex: options?.rollIndex,
  };
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasurePotion.AnimalControl) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePotionAnimalControl',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasurePotion.DragonControl) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePotionDragonControl',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasurePotion.GiantControl) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePotionGiantControl',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasurePotion.GiantStrength) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePotionGiantStrength',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasurePotion.HumanControl) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePotionHumanControl',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  } else if (command === TreasurePotion.UndeadControl) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePotionUndeadControl',
      context: {
        kind: 'treasureMagic',
        level: event.level,
        treasureRoll: usedRoll,
        rollIndex: event.rollIndex,
      },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasurePotionAnimalControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePotionAnimalControl,
    roll: options?.roll,
    buildEvent: (command, usedRoll) =>
      buildTreasureEvent(
        'treasurePotionAnimalControl',
        command,
        usedRoll,
        options
      ),
  });
}

export function resolveTreasurePotionDragonControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePotionDragonControl,
    roll: options?.roll,
    buildEvent: (command, usedRoll) =>
      buildTreasureEvent(
        'treasurePotionDragonControl',
        command,
        usedRoll,
        options
      ),
  });
}

export function resolveTreasurePotionGiantControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePotionGiantControl,
    roll: options?.roll,
    buildEvent: (command, usedRoll) =>
      buildTreasureEvent(
        'treasurePotionGiantControl',
        command,
        usedRoll,
        options
      ),
  });
}

export function resolveTreasurePotionGiantStrength(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePotionGiantStrength,
    roll: options?.roll,
    buildEvent: (command, usedRoll) =>
      buildTreasureEvent(
        'treasurePotionGiantStrength',
        command,
        usedRoll,
        options
      ),
  });
}

export function resolveTreasurePotionHumanControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePotionHumanControl,
    roll: options?.roll,
    buildEvent: (command, usedRoll) =>
      buildTreasureEvent(
        'treasurePotionHumanControl',
        command,
        usedRoll,
        options
      ),
  });
}

export function resolveTreasurePotionUndeadControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePotionUndeadControl,
    roll: options?.roll,
    buildEvent: (command, usedRoll) =>
      buildTreasureEvent(
        'treasurePotionUndeadControl',
        command,
        usedRoll,
        options
      ),
  });
}

export function resolveTreasureScroll(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureScrolls.sides);
  const command = getTableEntry(usedRoll, treasureScrolls);
  const event: OutcomeEvent = {
    kind: 'treasureScroll',
    result: command,
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? usedRoll,
    rollIndex: options?.rollIndex,
    scroll: { type: 'curse' },
  };
  const children: DungeonOutcomeNode[] = [];

  if (isSpellScroll(command)) {
    const detail = SCROLL_SPELL_DETAILS[command];
    const caster = rollCasterType();
    const range = detail
      ? caster === 'magic-user' || caster === 'illusionist'
        ? detail.magicUserRange
        : detail.clericRange
      : undefined;
    const spellCount = detail?.spells ?? 0;
    const levels = range ? rollSpellLevels(spellCount, range) : [];
    event.scroll = {
      type: 'spells',
      caster,
      spellLevels: levels,
    };
  } else if (isProtectionScroll(command)) {
    event.scroll = {
      type: 'protection',
      protection: command,
    };
    if (command === TreasureScroll.ProtectionElementals) {
      children.push({
        type: 'pending-roll',
        table: 'treasureScrollProtectionElementals',
        context: {
          kind: 'treasureMagic',
          level: event.level,
          treasureRoll: usedRoll,
          rollIndex: event.rollIndex,
        },
      });
    } else if (command === TreasureScroll.ProtectionLycanthropes) {
      children.push({
        type: 'pending-roll',
        table: 'treasureScrollProtectionLycanthropes',
        context: {
          kind: 'treasureMagic',
          level: event.level,
          treasureRoll: usedRoll,
          rollIndex: event.rollIndex,
        },
      });
    }
  } else {
    event.scroll = { type: 'curse' };
  }

  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureScrollProtectionElementals(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureScrollProtectionElementals.sides);
  const command = getTableEntry(usedRoll, treasureScrollProtectionElementals);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureScrollProtectionElementals',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureScrollProtectionLycanthropes(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureScrollProtectionLycanthropes.sides);
  const command = getTableEntry(usedRoll, treasureScrollProtectionLycanthropes);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureScrollProtectionLycanthropes',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRing(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRings.sides);
  const command = getTableEntry(usedRoll, treasureRings);
  const children: DungeonOutcomeNode[] = [];
  let spellStoring:
    | {
        caster: 'magic-user' | 'illusionist' | 'cleric' | 'druid';
        spellLevels: number[];
      }
    | undefined;
  if (command === TreasureRing.Contrariness) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingContrariness',
    });
  } else if (command === TreasureRing.ElementalCommand) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingElementalCommand',
    });
  } else if (command === TreasureRing.Protection) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingProtection',
    });
  } else if (command === TreasureRing.SpellStoring) {
    const spellCount = rollDice(4) + 1;
    const caster = rollCasterType();
    const spellLevels = rollSpellStoringLevels(spellCount, caster);
    spellStoring = { caster, spellLevels };
  } else if (command === TreasureRing.Regeneration) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingRegeneration',
    });
  } else if (command === TreasureRing.Telekinesis) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingTelekinesis',
    });
  } else if (command === TreasureRing.ThreeWishes) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingThreeWishes',
    });
  } else if (command === TreasureRing.Wizardry) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingWizardry',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRing',
      result: command,
      level: options?.level ?? 1,
      treasureRoll: options?.treasureRoll ?? usedRoll,
      rollIndex: options?.rollIndex,
      spellStoring,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureRingContrariness(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingContrariness.sides);
  const command = getTableEntry(usedRoll, treasureRingContrariness);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingContrariness',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingElementalCommand(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureRingElementalCommand.sides);
  const command = getTableEntry(usedRoll, treasureRingElementalCommand);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingElementalCommand',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingProtection(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingProtection.sides);
  const command = getTableEntry(usedRoll, treasureRingProtection);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingProtection',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingRegeneration(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingRegeneration.sides);
  const command = getTableEntry(usedRoll, treasureRingRegeneration);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingRegeneration',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingTelekinesis(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingTelekinesis.sides);
  const command = getTableEntry(usedRoll, treasureRingTelekinesis);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingTelekinesis',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingThreeWishes(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingThreeWishes.sides);
  const command = getTableEntry(usedRoll, treasureRingThreeWishes);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingThreeWishes',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingWizardry(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingWizardry.sides);
  const command = getTableEntry(usedRoll, treasureRingWizardry);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingWizardry',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRodStaffWand(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRodsStavesWands.sides);
  const command = getTableEntry(usedRoll, treasureRodsStavesWands);
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureRodStaffWand.StaffSerpent) {
    children.push({
      type: 'pending-roll',
      table: 'treasureStaffSerpent',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRodStaffWand',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureMiscMagicE1(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE1.sides);
  const command: TreasureMiscMagicE1 = getTableEntry(
    usedRoll,
    treasureMiscMagicE1
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMiscMagicE1.BagOfHolding) {
    children.push({
      type: 'pending-roll',
      table: 'treasureBagOfHolding',
      id: options?.rollIndex
        ? `treasureBagOfHolding:${options.rollIndex}`
        : undefined,
    });
  } else if (command === TreasureMiscMagicE1.BagOfTricks) {
    children.push({
      type: 'pending-roll',
      table: 'treasureBagOfTricks',
      id: options?.rollIndex
        ? `treasureBagOfTricks:${options.rollIndex}`
        : undefined,
    });
  } else if (command === TreasureMiscMagicE1.BracersOfDefense) {
    children.push({
      type: 'pending-roll',
      table: 'treasureBracersOfDefense',
      id: options?.rollIndex
        ? `treasureBracersOfDefense:${options.rollIndex}`
        : undefined,
    });
  } else if (command === TreasureMiscMagicE1.BucknardsEverfullPurse) {
    children.push({
      type: 'pending-roll',
      table: 'treasureBucknardsEverfullPurse',
      id: options?.rollIndex
        ? `treasureBucknardsEverfullPurse:${options.rollIndex}`
        : undefined,
    });
  } else if (command === TreasureMiscMagicE1.ArtifactOrRelic) {
    children.push({
      type: 'pending-roll',
      table: 'treasureArtifactOrRelic',
      id: options?.rollIndex
        ? `treasureArtifactOrRelic:${options.rollIndex}`
        : undefined,
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureMiscMagicE1',
      result: command,
      level: options?.level,
      treasureRoll: options?.treasureRoll,
      rollIndex: options?.rollIndex,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureMiscMagicE2(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE2.sides);
  const command: TreasureMiscMagicE2 = getTableEntry(
    usedRoll,
    treasureMiscMagicE2
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMiscMagicE2.CarpetOfFlying) {
    children.push({ type: 'pending-roll', table: 'treasureCarpetOfFlying' });
  } else if (command === TreasureMiscMagicE2.CrystalBall) {
    children.push({ type: 'pending-roll', table: 'treasureCrystalBall' });
  } else if (command === TreasureMiscMagicE2.DeckOfManyThings) {
    children.push({ type: 'pending-roll', table: 'treasureDeckOfManyThings' });
  } else if (command === TreasureMiscMagicE2.EyesOfPetrification) {
    children.push({
      type: 'pending-roll',
      table: 'treasureEyesOfPetrification',
    });
  } else if (command === TreasureMiscMagicE2.CloakOfProtection) {
    children.push({ type: 'pending-roll', table: 'treasureCloakOfProtection' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureMiscMagicE2',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureMiscMagicE3(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE3.sides);
  const command: TreasureMiscMagicE3 = getTableEntry(
    usedRoll,
    treasureMiscMagicE3
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMiscMagicE3.FigurineOfWondrousPower) {
    children.push({
      type: 'pending-roll',
      table: 'treasureFigurineOfWondrousPower',
    });
  } else if (command === TreasureMiscMagicE3.GirdleOfGiantStrength) {
    children.push({
      type: 'pending-roll',
      table: 'treasureGirdleOfGiantStrength',
    });
  } else if (command === TreasureMiscMagicE3.IounStones) {
    children.push(resolveTreasureIounStones());
  } else if (command === TreasureMiscMagicE3.InstrumentOfTheBards) {
    children.push({
      type: 'pending-roll',
      table: 'treasureInstrumentOfTheBards',
    });
  } else if (command === TreasureMiscMagicE3.IronFlask) {
    children.push({ type: 'pending-roll', table: 'treasureIronFlask' });
  } else if (command === TreasureMiscMagicE3.HornOfValhalla) {
    children.push({
      type: 'pending-roll',
      table: 'treasureHornOfValhallaType',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureMiscMagicE3',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureMiscMagicE4(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE4.sides);
  const command: TreasureMiscMagicE4 = getTableEntry(
    usedRoll,
    treasureMiscMagicE4
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMiscMagicE4.ManualOfGolems) {
    children.push({ type: 'pending-roll', table: 'treasureManualOfGolems' });
  } else if (command === TreasureMiscMagicE4.MedallionOfESP) {
    children.push({ type: 'pending-roll', table: 'treasureMedallionRange' });
  } else if (command === TreasureMiscMagicE4.MedallionOfThoughtProjection) {
    children.push({ type: 'pending-roll', table: 'treasureMedallionRange' });
  } else if (command === TreasureMiscMagicE4.NecklaceOfMissiles) {
    children.push({
      type: 'pending-roll',
      table: 'treasureNecklaceOfMissiles',
    });
  } else if (command === TreasureMiscMagicE4.NecklaceOfPrayerBeads) {
    children.push(resolveTreasureNecklaceOfPrayerBeads());
  } else if (command === TreasureMiscMagicE4.PearlOfPower) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePearlOfPowerEffect',
    });
  } else if (command === TreasureMiscMagicE4.PearlOfWisdom) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePearlOfWisdom',
    });
  } else if (command === TreasureMiscMagicE4.PhylacteryOfLongYears) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePhylacteryLongYears',
    });
  } else if (command === TreasureMiscMagicE4.PeriaptOfProofAgainstPoison) {
    children.push({
      type: 'pending-roll',
      table: 'treasurePeriaptProofAgainstPoison',
    });
  } else if (command === TreasureMiscMagicE4.QuaalsFeatherToken) {
    children.push({
      type: 'pending-roll',
      table: 'treasureQuaalFeatherToken',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureMiscMagicE4',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureMiscMagicE5(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE5.sides);
  const command: TreasureMiscMagicE5 = getTableEntry(
    usedRoll,
    treasureMiscMagicE5
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMiscMagicE5.RobeOfTheArchmagi) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRobeOfTheArchmagi',
    });
  } else if (command === TreasureMiscMagicE5.RobeOfUsefulItems) {
    children.push(resolveTreasureRobeOfUsefulItems());
  } else if (command === TreasureMiscMagicE5.ScarabOfProtection) {
    children.push({
      type: 'pending-roll',
      table: 'treasureScarabOfProtectionCurse',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureMiscMagicE5',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureRobeOfTheArchmagi(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRobeOfTheArchmagi.sides);
  const command: TreasureRobeOfTheArchmagi = getTableEntry(
    usedRoll,
    treasureRobeOfTheArchmagi
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRobeOfTheArchmagi',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRobeOfUsefulItems(options?: {
  countRolls?: number[];
  patchRolls?: number[];
}): DungeonOutcomeNode {
  const countRolls: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const preset = options?.countRolls?.[i];
    const roll = preset ?? rollDice(4);
    countRolls.push(roll);
  }
  const requestedExtraPatchCount = countRolls.reduce(
    (sum, roll) => sum + roll,
    0
  );
  const extraPatches: RobeOfUsefulItemsResult['extraPatches'] = [];
  const presetPatchRolls = options?.patchRolls ?? [];
  let remaining = requestedExtraPatchCount;
  let index = 0;
  while (remaining > 0) {
    remaining -= 1;
    const preset = presetPatchRolls[index];
    const usedRoll =
      preset !== undefined ? preset : rollDice(treasureRobeOfUsefulItems.sides);
    const patch: RobeOfUsefulItemsExtraPatch = getTableEntry(
      usedRoll,
      treasureRobeOfUsefulItems
    );
    if (patch === RobeOfUsefulItemsExtraPatch.RollTwiceMore) {
      remaining += 2;
    } else {
      extraPatches.push({
        roll: usedRoll,
        item: patch,
      });
    }
    index += 1;
  }

  const basePatches = ROBE_OF_USEFUL_ITEMS_BASE_PATCHES.map((definition) => ({
    type: definition.type,
    count: definition.count,
  }));

  const result: RobeOfUsefulItemsResult = {
    basePatches,
    extraPatchCountRolls: countRolls,
    requestedExtraPatchCount,
    extraPatches,
  };

  return {
    type: 'event',
    roll: requestedExtraPatchCount,
    event: {
      kind: 'treasureRobeOfUsefulItems',
      result,
    } as OutcomeEvent,
  };
}

export function resolveTreasureScarabOfProtectionCurse(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureScarabOfProtectionCurse.sides);
  const command: TreasureScarabOfProtectionCurse = getTableEntry(
    usedRoll,
    treasureScarabOfProtectionCurse
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureScarabOfProtectionCurse.Cursed) {
    children.push({
      type: 'pending-roll',
      table: 'treasureScarabOfProtectionCurseResolution',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureScarabOfProtectionCurse',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureScarabOfProtectionCurseResolution(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureScarabOfProtectionCursedResolution.sides);
  const command: TreasureScarabOfProtectionCurseResolution = getTableEntry(
    usedRoll,
    treasureScarabOfProtectionCursedResolution
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureScarabOfProtectionCurseResolution',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureArmorShields(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureArmorShields,
    roll: options?.roll,
    buildEvent: (command, usedRoll) =>
      buildTreasureEvent('treasureArmorShields', command, usedRoll, options),
  });
}

export function resolveTreasureSwords(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
  kindRoll?: number;
  unusualRoll?: number;
  alignmentRoll?: number;
  languageRolls?: number[];
  primaryAbilityRolls?: number[];
  extraordinaryPowerRolls?: number[];
  luckBladeWishes?: number;
  dragonSlayerColorRoll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureSwords.sides);
  const command: TreasureSword = getTableEntry(usedRoll, treasureSwords);
  const luckBladeWishes =
    command === TreasureSword.SwordPlus1LuckBlade
      ? resolveLuckBladeWishes(options?.luckBladeWishes)
      : undefined;
  const event: OutcomeEvent = {
    kind: 'treasureSwords',
    result: command,
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? usedRoll,
    rollIndex: options?.rollIndex,
    luckBladeWishes,
  };
  const children: DungeonOutcomeNode[] = [];
  if (options?.kindRoll !== undefined) {
    children.push(resolveTreasureSwordKind({ roll: options.kindRoll }));
  } else {
    children.push({
      type: 'pending-roll',
      table: 'treasureSwordKind',
      id: options?.rollIndex
        ? `treasureSwordKind:${options.rollIndex}`
        : undefined,
    });
  }
  if (options?.unusualRoll !== undefined) {
    children.push(
      resolveTreasureSwordUnusual({
        roll: options.unusualRoll,
        sword: command,
        rollIndex: options?.rollIndex,
        alignmentRoll: options?.alignmentRoll,
        languageRolls: options?.languageRolls,
        primaryAbilityRolls: options?.primaryAbilityRolls,
        extraordinaryPowerRolls: options?.extraordinaryPowerRolls,
        dragonSlayerColorRoll: options?.dragonSlayerColorRoll,
      })
    );
  } else {
    children.push({
      type: 'pending-roll',
      table: 'treasureSwordUnusual',
      id: options?.rollIndex
        ? `treasureSwordUnusual:${options.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureSword',
        sword: command,
        rollIndex: options?.rollIndex,
        languageRolls: options?.languageRolls
          ? [...options.languageRolls]
          : undefined,
        primaryAbilityRolls: options?.primaryAbilityRolls
          ? [...options.primaryAbilityRolls]
          : undefined,
        extraordinaryPowerRolls: options?.extraordinaryPowerRolls
          ? [...options.extraordinaryPowerRolls]
          : undefined,
        luckBladeWishes,
        dragonSlayerColorRoll: options?.dragonSlayerColorRoll,
      },
    });
  }
  switch (command) {
    case TreasureSword.SwordPlus5HolyAvenger: {
      children.push(
        createFixedSwordAlignmentNode(
          TreasureSwordAlignment.LawfulGood,
          'holyAvenger'
        )
      );
      break;
    }
    case TreasureSword.SwordOfSharpness: {
      if (options?.alignmentRoll !== undefined) {
        children.push(
          resolveTreasureSwordAlignment({
            roll: options.alignmentRoll,
            variant: 'chaotic',
          })
        );
      } else {
        children.push(
          buildPendingSwordAlignmentNode('chaotic', command, options?.rollIndex)
        );
      }
      break;
    }
    case TreasureSword.SwordVorpalWeapon: {
      if (options?.alignmentRoll !== undefined) {
        children.push(
          resolveTreasureSwordAlignment({
            roll: options.alignmentRoll,
            variant: 'lawful',
          })
        );
      } else {
        children.push(
          buildPendingSwordAlignmentNode('lawful', command, options?.rollIndex)
        );
      }
      break;
    }
    default:
      break;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children,
  };
}

export function resolveTreasureSwordKind(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureSwordKind.sides);
  const command: TreasureSwordKind = getTableEntry(usedRoll, treasureSwordKind);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureSwordKind',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureSwordUnusual(options?: {
  roll?: number;
  sword?: TreasureSword;
  rollIndex?: number;
  alignmentRoll?: number;
  languageRolls?: number[];
  primaryAbilityRolls?: number[];
  extraordinaryPowerRolls?: number[];
  dragonSlayerColorRoll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureSwordUnusual.sides);
  const command: TreasureSwordUnusual = getTableEntry(
    usedRoll,
    treasureSwordUnusual
  );
  const details = SWORD_UNUSUAL_DETAILS[command];
  const result: TreasureSwordUnusualResult = {
    ...details,
    variant: command,
  };
  const children: DungeonOutcomeNode[] = [];
  const sword = options?.sword;
  if (sword !== undefined) {
    const instruction = determineSwordAlignmentInstruction(sword, result);
    applySwordAlignmentInstruction(children, instruction, {
      sword,
      rollIndex: options?.rollIndex,
      alignmentRoll: options?.alignmentRoll,
    });
  }
  if (result.intelligence !== undefined && result.intelligence >= 14) {
    const languageRolls = options?.languageRolls
      ? [...options.languageRolls]
      : [];
    const languagesKnown = rollSwordLanguages(languageRolls);
    result.languagesKnown = languagesKnown;
  }
  if (result.primaryAbilityCount > 0) {
    const abilityNodes: DungeonOutcomeNode[] = [];
    const queuedRolls = options?.primaryAbilityRolls
      ? [...options.primaryAbilityRolls]
      : [];
    for (let index = 0; index < result.primaryAbilityCount; index += 1) {
      const slotKey = `auto-${index}`;
      const forcedRoll = queuedRolls.shift();
      if (forcedRoll !== undefined) {
        abilityNodes.push(
          resolveTreasureSwordPrimaryAbility({
            rollIndex: options?.rollIndex,
            slotKey,
            roll: forcedRoll,
            tableVariant: 'standard',
          })
        );
      } else {
        abilityNodes.push(
          buildSwordPrimaryAbilityPending({
            slotKey,
            rollIndex: options?.rollIndex,
            tableVariant: 'standard',
          })
        );
      }
    }
    if (abilityNodes.length > 0) {
      children.push(...abilityNodes);
    }
  }
  if (result.extraordinaryPower) {
    const slotKey = 'extra-0';
    const queuedExtra =
      options?.extraordinaryPowerRolls &&
      options.extraordinaryPowerRolls.length > 0
        ? [...options.extraordinaryPowerRolls]
        : undefined;
    const forcedExtra = queuedExtra ? queuedExtra.shift() : undefined;
    if (forcedExtra !== undefined) {
      children.push(
        resolveTreasureSwordExtraordinaryPower({
          roll: forcedExtra,
          slotKey,
          rollIndex: options?.rollIndex,
          tableVariant: 'standard',
        })
      );
    } else {
      children.push(
        buildSwordExtraordinaryPowerPending({
          slotKey,
          rollIndex: options?.rollIndex,
          tableVariant: 'standard',
        })
      );
    }
  }
  if (sword === TreasureSword.SwordPlus2DragonSlayer) {
    let alignmentForColor: TreasureSwordAlignment | undefined;
    let colorAlignmentReady = false;
    const alignmentChild = children.find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordAlignment'
    );
    if (
      alignmentChild &&
      alignmentChild.event.kind === 'treasureSwordAlignment'
    ) {
      const alignmentResult = alignmentChild.event.result;
      alignmentForColor = alignmentResult.alignment;
      colorAlignmentReady = true;
    }
    const slotKey = `dragon-${options?.rollIndex ?? 'auto'}`;
    if (command === TreasureSwordUnusual.Normal) {
      if (options?.dragonSlayerColorRoll !== undefined) {
        children.push(
          resolveTreasureSwordDragonSlayerColor({
            roll: options.dragonSlayerColorRoll,
            slotKey,
            rollIndex: options?.rollIndex,
            alignment: alignmentForColor,
          })
        );
      } else {
        children.push(
          buildSwordDragonSlayerColorPending({
            slotKey,
            rollIndex: options?.rollIndex,
            alignment: alignmentForColor,
            alignmentReady: true,
          })
        );
      }
    } else if (result.requiresAlignment) {
      if (
        options?.dragonSlayerColorRoll !== undefined &&
        alignmentForColor !== undefined
      ) {
        children.push(
          resolveTreasureSwordDragonSlayerColor({
            roll: options.dragonSlayerColorRoll,
            slotKey,
            rollIndex: options?.rollIndex,
            alignment: alignmentForColor,
          })
        );
      } else {
        children.push(
          buildSwordDragonSlayerColorPending({
            slotKey,
            rollIndex: options?.rollIndex,
            alignment: alignmentForColor,
            alignmentReady: colorAlignmentReady,
          })
        );
      }
    }
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureSwordUnusual',
      result,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureSwordPrimaryAbility(options?: {
  roll?: number;
  rollIndex?: number;
  slotKey?: string;
  tableVariant?: 'standard' | 'restricted';
}): DungeonOutcomeNode {
  const rollIndex = options?.rollIndex;
  const slotKey =
    options?.slotKey ?? `auto-${Math.random().toString(36).slice(2)}`;
  const variant = options?.tableVariant ?? 'standard';
  const table =
    variant === 'restricted'
      ? treasureSwordPrimaryAbilityRestricted
      : treasureSwordPrimaryAbility;

  const resolveRoll = (): number => {
    if (options?.roll !== undefined) {
      const provided = Math.trunc(options.roll);
      if (!Number.isFinite(provided) || provided < 1) {
        return 1;
      }
      if (provided > table.sides) {
        return table.sides;
      }
      return provided;
    }
    return rollDice(table.sides);
  };

  const usedRoll = resolveRoll();
  const command = getTableEntry(usedRoll, table);

  if (
    command === TreasureSwordPrimaryAbilityCommand.RollTwice &&
    variant === 'standard'
  ) {
    const nodeId = primaryAbilityNodeId(slotKey, rollIndex);
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: nodeId,
      event: {
        kind: 'treasureSwordPrimaryAbility',
        result: {
          kind: 'instruction',
          instruction: 'rollTwice',
          roll: usedRoll,
          note: 'Roll twice on this table (ignore 93-00).',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordPrimaryAbilityPending({
          slotKey: `${slotKey}:a`,
          rollIndex,
          tableVariant: 'restricted',
        }),
        buildSwordPrimaryAbilityPending({
          slotKey: `${slotKey}:b`,
          rollIndex,
          tableVariant: 'restricted',
        }),
      ],
    };
    return node;
  }

  if (command === TreasureSwordPrimaryAbilityCommand.ExtraordinaryPower) {
    const nodeId = primaryAbilityNodeId(slotKey, rollIndex);
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: nodeId,
      event: {
        kind: 'treasureSwordPrimaryAbility',
        result: {
          kind: 'instruction',
          instruction: 'extraordinaryPower',
          roll: usedRoll,
          note: 'Roll on the Extraordinary Power table.',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:extra`,
          rollIndex,
          tableVariant: 'standard',
        }),
      ],
    };
    return node;
  }

  const ability = command as unknown as TreasureSwordPrimaryAbility;
  const result: TreasureSwordPrimaryAbilityResult = {
    kind: 'ability',
    ability,
    rolls: [usedRoll],
    multiplier: 1,
    description: describeSwordPrimaryAbility(ability, 1),
    tableVariant: variant,
  };
  const node: OutcomeEventNode = {
    type: 'event',
    roll: usedRoll,
    id: primaryAbilityNodeId(slotKey, rollIndex),
    event: {
      kind: 'treasureSwordPrimaryAbility',
      result,
    } as OutcomeEvent,
  };
  return node;
}

function buildSwordPrimaryAbilityPending(options: {
  slotKey: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
}): PendingRoll {
  const { slotKey, rollIndex, tableVariant } = options;
  const variant = tableVariant ?? 'standard';
  const tableName =
    variant === 'restricted'
      ? 'treasureSwordPrimaryAbilityRestricted'
      : 'treasureSwordPrimaryAbility';
  return {
    type: 'pending-roll',
    table: tableName,
    id: primaryAbilityNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordPrimaryAbility',
      slotKey,
      rollIndex,
      tableVariant: variant,
    },
  };
}

function primaryAbilityNodeId(slotKey: string, rollIndex?: number): string {
  return rollIndex !== undefined
    ? `treasureSwordPrimaryAbility:${rollIndex}:${slotKey}`
    : `treasureSwordPrimaryAbility:${slotKey}`;
}

export function resolveTreasureSwordExtraordinaryPower(options?: {
  roll?: number;
  rollIndex?: number;
  slotKey?: string;
  tableVariant?: 'standard' | 'restricted';
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const rollIndex = options?.rollIndex;
  const slotKey =
    options?.slotKey ?? `extra-${Math.random().toString(36).slice(2)}`;
  const variant = options?.tableVariant ?? 'standard';
  const table =
    variant === 'restricted'
      ? treasureSwordExtraordinaryPowerRestricted
      : treasureSwordExtraordinaryPower;

  const resolveRoll = (): number => {
    if (options?.roll !== undefined) {
      const provided = Math.trunc(options.roll);
      if (!Number.isFinite(provided) || provided < 1) {
        return 1;
      }
      if (provided > table.sides) {
        return table.sides;
      }
      return provided;
    }
    return rollDice(table.sides);
  };

  const usedRoll = resolveRoll();
  const command = getTableEntry(usedRoll, table);

  if (
    command === TreasureSwordExtraordinaryPowerCommand.RollTwice &&
    variant === 'standard'
  ) {
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: extraordinaryPowerNodeId(slotKey, rollIndex),
      event: {
        kind: 'treasureSwordExtraordinaryPower',
        result: {
          kind: 'instruction',
          instruction: 'rollTwice',
          roll: usedRoll,
          note: 'Roll twice on this table ignoring scores of 95-97.',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:a`,
          rollIndex,
          tableVariant: 'restricted',
          alignment: options?.alignment,
        }),
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:b`,
          rollIndex,
          tableVariant: 'restricted',
          alignment: options?.alignment,
        }),
      ],
    };
    return node;
  }

  const power =
    command === TreasureSwordExtraordinaryPowerCommand.ChooseAny
      ? TreasureSwordExtraordinaryPower.ChooseAny
      : command ===
        TreasureSwordExtraordinaryPowerCommand.ChooseAnyAndSpecialPurpose
      ? TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose
      : (command as unknown as TreasureSwordExtraordinaryPower);
  const result: TreasureSwordExtraordinaryPowerResult = {
    kind: 'power',
    power,
    rolls: [usedRoll],
    multiplier: 1,
    description: describeSwordExtraordinaryPower(power, 1),
    tableVariant: variant,
    alignmentRequired:
      power === TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose &&
      options?.alignment === undefined
        ? true
        : undefined,
  };
  const children: DungeonOutcomeNode[] = [];
  if (power === TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose) {
    const parentSlotKey = slotKey;
    const purposeSlotKey = `${slotKey}:purpose`;
    const powerSlotKey = `${slotKey}:power`;
    children.push(
      buildSwordSpecialPurposePending({
        slotKey: purposeSlotKey,
        parentSlotKey,
        rollIndex,
        alignment: options?.alignment,
      })
    );
    children.push(
      buildSwordSpecialPurposePowerPending({
        slotKey: powerSlotKey,
        rollIndex,
        parentSlotKey,
        alignment: options?.alignment,
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    id: extraordinaryPowerNodeId(slotKey, rollIndex),
    event: {
      kind: 'treasureSwordExtraordinaryPower',
      result,
    } as OutcomeEvent,
    children: children.length > 0 ? children : undefined,
  };
}

function buildSwordExtraordinaryPowerPending(options: {
  slotKey: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, tableVariant, alignment } = options;
  const variant = tableVariant ?? 'standard';
  const tableName =
    variant === 'restricted'
      ? 'treasureSwordExtraordinaryPowerRestricted'
      : 'treasureSwordExtraordinaryPower';
  return {
    type: 'pending-roll',
    table: tableName,
    id: extraordinaryPowerNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordExtraordinaryPower',
      slotKey,
      rollIndex,
      tableVariant: variant,
      alignment,
    },
  };
}

function extraordinaryPowerNodeId(slotKey: string, rollIndex?: number): string {
  return rollIndex !== undefined
    ? `treasureSwordExtraordinaryPower:${rollIndex}:${slotKey}`
    : `treasureSwordExtraordinaryPower:${slotKey}`;
}

export function resolveTreasureSwordSpecialPurpose(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey =
    options?.slotKey ?? `purpose-${Math.random().toString(36).slice(2)}`;
  const parentSlotKey = options?.parentSlotKey;
  const alignment = options?.alignment;
  const resolveRoll = (): number => {
    if (options?.roll !== undefined) {
      const provided = Math.trunc(options.roll);
      if (!Number.isFinite(provided) || provided < 1) {
        return 1;
      }
      if (provided > treasureSwordSpecialPurpose.sides) {
        return treasureSwordSpecialPurpose.sides;
      }
      return provided;
    }
    return rollDice(treasureSwordSpecialPurpose.sides);
  };
  const usedRoll = resolveRoll();
  const command = getTableEntry(usedRoll, treasureSwordSpecialPurpose);
  const purpose = command as unknown as TreasureSwordSpecialPurpose;
  const result: TreasureSwordSpecialPurposeResult = {
    kind: 'purpose',
    purpose,
    rolls: [usedRoll],
    description: describeSwordSpecialPurpose(purpose, {
      alignment,
    }),
    alignment,
    slotKey,
    parentSlotKey,
  };
  const node: OutcomeEventNode = {
    type: 'event',
    roll: usedRoll,
    id: specialPurposeNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordSpecialPurpose',
      result,
    } as OutcomeEvent,
  };
  if (!parentSlotKey) {
    node.children = [
      buildSwordSpecialPurposePowerPending({
        slotKey: `${slotKey}:power`,
        rollIndex: options?.rollIndex,
        parentSlotKey: slotKey,
        alignment,
      }),
    ];
  }
  return node;
}

export function resolveTreasureSwordSpecialPurposePower(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey =
    options?.slotKey ?? `purpose-power-${Math.random().toString(36).slice(2)}`;
  const resolveRoll = (): number => {
    if (options?.roll !== undefined) {
      const provided = Math.trunc(options.roll);
      if (!Number.isFinite(provided) || provided < 1) {
        return 1;
      }
      if (provided > treasureSwordSpecialPurposePower.sides) {
        return treasureSwordSpecialPurposePower.sides;
      }
      return provided;
    }
    return rollDice(treasureSwordSpecialPurposePower.sides);
  };
  const usedRoll = resolveRoll();
  const command = getTableEntry(usedRoll, treasureSwordSpecialPurposePower);
  const power = command as unknown as TreasureSwordSpecialPurposePower;
  const result: TreasureSwordSpecialPurposePowerResult = {
    kind: 'specialPurposePower',
    power,
    rolls: [usedRoll],
    description: describeSwordSpecialPurposePower(power),
    slotKey,
    parentSlotKey: options?.parentSlotKey,
  };
  return {
    type: 'event',
    roll: usedRoll,
    id: specialPurposePowerNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordSpecialPurposePower',
      result,
    } as OutcomeEvent,
  };
}

export function resolveTreasureSwordDragonSlayerColor(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey =
    options?.slotKey ?? `dragon-slayer-${Math.random().toString(36).slice(2)}`;
  const table = dragonSlayerColorTableForAlignment(options?.alignment);
  const resolveRoll = (): number => {
    if (options?.roll !== undefined) {
      const provided = Math.trunc(options.roll);
      if (!Number.isFinite(provided) || provided < 1) {
        return 1;
      }
      if (provided > table.sides) {
        return table.sides;
      }
      return provided;
    }
    return rollDice(table.sides);
  };
  const usedRoll = resolveRoll();
  const command = getTableEntry(usedRoll, table);
  const detail = DRAGON_SLAYER_COLOR_DETAILS[command];
  const result: TreasureSwordDragonSlayerColorResult = {
    kind: 'dragonSlayerColor',
    color: command,
    rolls: [usedRoll],
    label: detail.label,
    alignment: detail.alignment,
  };
  return {
    type: 'event',
    roll: usedRoll,
    id: dragonSlayerColorNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordDragonSlayerColor',
      result,
    } as OutcomeEvent,
  };
}

function buildSwordSpecialPurposePending(options: {
  slotKey: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, parentSlotKey, alignment } = options;
  const alignmentReady = alignment !== undefined;
  return {
    type: 'pending-roll',
    table: 'treasureSwordSpecialPurpose',
    id: specialPurposeNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordSpecialPurpose',
      slotKey,
      rollIndex,
      parentSlotKey,
      alignment,
      alignmentReady,
    },
  };
}

function buildSwordSpecialPurposePowerPending(options: {
  slotKey: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, parentSlotKey, alignment } = options;
  return {
    type: 'pending-roll',
    table: 'treasureSwordSpecialPurposePower',
    id: specialPurposePowerNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordSpecialPurposePower',
      slotKey,
      rollIndex,
      parentSlotKey,
      alignment,
    },
  };
}

function specialPurposeNodeId(slotKey: string, rollIndex?: number): string {
  return rollIndex !== undefined
    ? `treasureSwordSpecialPurpose:${rollIndex}:${slotKey}`
    : `treasureSwordSpecialPurpose:${slotKey}`;
}

function specialPurposePowerNodeId(
  slotKey: string,
  rollIndex?: number
): string {
  return rollIndex !== undefined
    ? `treasureSwordSpecialPurposePower:${rollIndex}:${slotKey}`
    : `treasureSwordSpecialPurposePower:${slotKey}`;
}

function buildSwordDragonSlayerColorPending(options: {
  slotKey: string;
  rollIndex?: number;
  alignment?: TreasureSwordAlignment;
  alignmentReady?: boolean;
}): PendingRoll {
  const { slotKey, rollIndex, alignment, alignmentReady } = options;
  return {
    type: 'pending-roll',
    table: 'treasureSwordDragonSlayerColor',
    id: dragonSlayerColorNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordDragonSlayerColor',
      slotKey,
      rollIndex,
      alignment,
      alignmentReady: alignmentReady ?? alignment !== undefined,
    },
  };
}

function dragonSlayerColorNodeId(slotKey: string, rollIndex?: number): string {
  return rollIndex !== undefined
    ? `treasureSwordDragonSlayerColor:${rollIndex}:${slotKey}`
    : `treasureSwordDragonSlayerColor:${slotKey}`;
}

type SwordAlignmentVariant = 'standard' | 'chaotic' | 'lawful';

export function resolveTreasureSwordAlignment(options?: {
  roll?: number;
  variant?: SwordAlignmentVariant;
}): DungeonOutcomeNode {
  const variant = options?.variant ?? 'standard';
  const table =
    variant === 'chaotic'
      ? treasureSwordAlignmentChaotic
      : variant === 'lawful'
      ? treasureSwordAlignmentLawful
      : treasureSwordAlignment;
  const usedRoll = options?.roll ?? rollDice(table.sides);
  const alignment: TreasureSwordAlignment = getTableEntry(usedRoll, table);
  const result = buildSwordAlignmentResult(alignment, variant);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureSwordAlignment',
      result,
    } as OutcomeEvent,
  };
}

type SwordAlignmentInstruction =
  | { kind: 'none' }
  | {
      kind: 'fixed';
      alignment: TreasureSwordAlignment;
      source: 'holyAvenger' | 'cursedUnusual';
    }
  | { kind: 'pending'; variant: SwordAlignmentVariant };

function determineSwordAlignmentInstruction(
  sword: TreasureSword,
  unusual: TreasureSwordUnusualResult
): SwordAlignmentInstruction {
  if (isFixedAlignmentSword(sword)) {
    return { kind: 'none' };
  }
  if (!unusual || unusual.category !== 'intelligent') {
    return { kind: 'none' };
  }
  if (
    sword === TreasureSword.SwordPlus1Cursed ||
    sword === TreasureSword.SwordMinus2Cursed ||
    sword === TreasureSword.SwordCursedBerserking
  ) {
    return {
      kind: 'fixed',
      alignment: TreasureSwordAlignment.NeutralAbsolute,
      source: 'cursedUnusual',
    };
  }
  return { kind: 'pending', variant: 'standard' };
}

function isFixedAlignmentSword(sword: TreasureSword): boolean {
  return (
    sword === TreasureSword.SwordPlus5HolyAvenger ||
    sword === TreasureSword.SwordOfSharpness ||
    sword === TreasureSword.SwordVorpalWeapon
  );
}

function applySwordAlignmentInstruction(
  collector: DungeonOutcomeNode[],
  instruction: SwordAlignmentInstruction,
  options: {
    sword: TreasureSword;
    rollIndex?: number;
    alignmentRoll?: number;
  }
): void {
  switch (instruction.kind) {
    case 'none':
      return;
    case 'fixed': {
      collector.push(
        createFixedSwordAlignmentNode(instruction.alignment, instruction.source)
      );
      break;
    }
    case 'pending': {
      if (
        instruction.variant === 'standard' &&
        options.alignmentRoll !== undefined
      ) {
        collector.push(
          resolveTreasureSwordAlignment({
            roll: options.alignmentRoll,
            variant: instruction.variant,
          })
        );
        break;
      }
      collector.push(
        buildPendingSwordAlignmentNode(
          instruction.variant,
          options.sword,
          options.rollIndex
        )
      );
      break;
    }
    default:
      break;
  }
}

function createFixedSwordAlignmentNode(
  alignment: TreasureSwordAlignment,
  source: 'holyAvenger' | 'cursedUnusual'
): DungeonOutcomeNode {
  const result = buildSwordAlignmentResult(alignment, 'fixed');
  const rollValue = source === 'holyAvenger' ? 0 : 0;
  return {
    type: 'event',
    roll: rollValue,
    event: {
      kind: 'treasureSwordAlignment',
      result,
    } as OutcomeEvent,
  };
}

function buildPendingSwordAlignmentNode(
  variant: SwordAlignmentVariant,
  sword: TreasureSword,
  rollIndex?: number
): DungeonOutcomeNode {
  const tableId =
    variant === 'chaotic'
      ? 'treasureSwordAlignmentChaotic'
      : variant === 'lawful'
      ? 'treasureSwordAlignmentLawful'
      : 'treasureSwordAlignment';
  return {
    type: 'pending-roll',
    table: tableId,
    id: rollIndex ? `${tableId}:${rollIndex}` : undefined,
    context: {
      kind: 'treasureSwordAlignment',
      variant,
      sword,
    },
  };
}

function resolveLuckBladeWishes(provided?: number): number {
  if (provided === undefined) {
    return rollDice(4) + 1;
  }
  const truncated = Math.trunc(provided);
  if (!Number.isFinite(truncated)) return 2;
  if (truncated < 2) return 2;
  if (truncated > 5) return 5;
  return truncated;
}

function buildSwordAlignmentResult(
  alignment: TreasureSwordAlignment,
  variant: SwordAlignmentVariant | 'fixed'
): TreasureSwordAlignmentResult {
  const detail = SWORD_ALIGNMENT[alignment];
  return {
    alignment,
    label: detail.label,
    source: variant,
    requiresLanguageTable: detail.requiresLanguageTable,
  };
}

function rollSwordLanguages(languageRolls: number[]): number {
  const useProvided =
    languageRolls.length > 0 ? languageRolls.shift() : undefined;
  const rollValue = useProvided ?? rollDice(100);
  if (rollValue === 100) {
    let total = 0;
    for (let i = 0; i < 2; i += 1) {
      let extraRoll: number;
      do {
        extraRoll =
          languageRolls.length > 0
            ? languageRolls.shift() ?? rollDice(100)
            : rollDice(100);
      } while (extraRoll === 100);
      total += mapSwordLanguageRoll(extraRoll);
    }
    return Math.max(6, total);
  }
  return mapSwordLanguageRoll(rollValue);
}

function mapSwordLanguageRoll(roll: number): number {
  if (roll <= 40) return 1;
  if (roll <= 70) return 2;
  if (roll <= 85) return 3;
  if (roll <= 95) return 4;
  if (roll <= 99) return 5;
  return 6;
}

export function resolveTreasureMiscWeapons(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscWeapons.sides);
  const item: TreasureMiscWeapon = getTableEntry(usedRoll, treasureMiscWeapons);
  let quantity: number | undefined;
  switch (item) {
    case TreasureMiscWeapon.ArrowPlus1:
      quantity = rollDice(12, 2);
      break;
    case TreasureMiscWeapon.ArrowPlus2:
      quantity = rollDice(8, 2);
      break;
    case TreasureMiscWeapon.ArrowPlus3:
      quantity = rollDice(6, 2);
      break;
    case TreasureMiscWeapon.BoltPlus2:
      quantity = rollDice(10, 2);
      break;
    default:
      quantity = undefined;
      break;
  }
  const event: OutcomeEvent = {
    kind: 'treasureMiscWeapons',
    result: {
      item,
      quantity,
    },
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? usedRoll,
    rollIndex: options?.rollIndex,
  };
  return {
    type: 'event',
    roll: usedRoll,
    event,
  };
}

export function resolveTreasureManualOfGolems(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureManualOfGolems,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureManualOfGolems',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureMedallionRange(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureMedallionRange,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureMedallionRange',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureNecklaceOfMissiles(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureNecklaceOfMissiles,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureNecklaceOfMissiles',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasurePearlOfPowerEffect(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePearlOfPowerEffect,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasurePearlOfPowerEffect',
        result: command,
      } as OutcomeEvent),
    buildChildren: (command) =>
      command === TreasurePearlOfPowerEffect.Recall
        ? [{ type: 'pending-roll', table: 'treasurePearlOfPowerRecall' }]
        : undefined,
  });
}

export function resolveTreasurePearlOfPowerRecall(options?: {
  roll?: number;
  d6?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePearlOfPowerRecall.sides);
  const command = getTableEntry(usedRoll, treasurePearlOfPowerRecall);
  const d6Roll = options?.d6 ?? rollDice(6);
  const result = resolvePearlRecallResult(command, () => d6Roll);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePearlOfPowerRecall',
      result,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePearlOfWisdom(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePearlOfWisdom,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasurePearlOfWisdom',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasurePeriaptProofAgainstPoison(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePeriaptPoisonBonus,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasurePeriaptProofAgainstPoison',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasurePhylacteryLongYears(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasurePhylacteryLongYears,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasurePhylacteryLongYears',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureNecklaceOfPrayerBeads(options?: {
  totalRoll?: number;
  specialCountRoll?: number;
  specialRolls?: number[];
}): DungeonOutcomeNode {
  const totalBase = options?.totalRoll ?? rollDice(6);
  const totalBeads = 24 + totalBase;
  const semiPrecious = Math.round(totalBeads * 0.6);
  const fancy = totalBeads - semiPrecious;

  const countBase = options?.specialCountRoll ?? rollDice(4);
  const specialCount = countBase + 2;
  const specialRolls: number[] = options?.specialRolls ?? [];
  const specialBeads: { roll: number; type: TreasureNecklacePrayerBead }[] =
    Array.from({ length: specialCount }, (_, index) => {
      const roll =
        specialRolls[index] ?? rollDice(treasureNecklacePrayerBeads.sides);
      const type = getTableEntry(roll, treasureNecklacePrayerBeads);
      return { type, roll };
    });

  return {
    type: 'event',
    roll: totalBeads,
    event: {
      kind: 'treasureNecklaceOfPrayerBeads',
      result: {
        totalBeads,
        semiPrecious,
        fancy,
        specialBeads,
      },
    } as OutcomeEvent,
  };
}

export function resolveTreasureQuaalFeatherToken(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureQuaalFeatherToken,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureQuaalFeatherToken',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureFigurineOfWondrousPower(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureFigurineOfWondrousPower.sides);
  const command: TreasureFigurineOfWondrousPower = getTableEntry(
    usedRoll,
    treasureFigurineOfWondrousPower
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureFigurineOfWondrousPower.MarbleElephant) {
    children.push({
      type: 'pending-roll',
      table: 'treasureFigurineMarbleElephant',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureFigurineOfWondrousPower',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureFigurineMarbleElephant(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureFigurineMarbleElephant,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureFigurineMarbleElephant',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureGirdleOfGiantStrength(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureGirdleOfGiantStrength,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureGirdleOfGiantStrength',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureIounStones(options?: {
  countRoll?: number;
  stoneRolls?: number[];
}): DungeonOutcomeNode {
  const countRoll = options?.countRoll ?? rollDice(10);
  const count = Math.max(1, Math.min(10, countRoll));
  const rolls = options?.stoneRolls ?? [];
  const stones: TreasureIounStonesResult['stones'] = [];
  const seen = new Map<TreasureIounStoneType, number>();

  for (let index = 0; index < count; index += 1) {
    const preset = rolls[index];
    const usedRoll =
      preset !== undefined ? preset : rollDice(treasureIounStones.sides);
    const type: TreasureIounStoneType = getTableEntry(
      usedRoll,
      treasureIounStones
    );
    const definition = IOUN_STONE_DEFINITIONS[type];
    const firstIndex = seen.get(type);
    const status: TreasureIounStoneStatus =
      type === TreasureIounStoneType.DullGray
        ? 'dead'
        : firstIndex !== undefined
        ? 'duplicate'
        : 'active';
    if (firstIndex === undefined) {
      seen.set(type, index);
    }
    stones.push({
      index: index + 1,
      roll: usedRoll,
      type,
      color: definition.color,
      shape: definition.shape,
      effect: definition.effect,
      status,
      duplicateOf: firstIndex !== undefined ? firstIndex + 1 : undefined,
    });
  }

  const result: TreasureIounStonesResult = {
    countRoll,
    stones,
  };

  return {
    type: 'event',
    roll: countRoll,
    event: {
      kind: 'treasureIounStones',
      result,
    } as OutcomeEvent,
  };
}

export function resolveTreasureHornOfValhallaType(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureHornOfValhallaType.sides);
  const command: TreasureHornOfValhallaType = getTableEntry(
    usedRoll,
    treasureHornOfValhallaType
  );
  const children: DungeonOutcomeNode[] = [
    { type: 'pending-roll', table: 'treasureHornOfValhallaAttunement' },
  ];
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureHornOfValhallaType',
      result: command,
    } as OutcomeEvent,
    children,
  };
}

export function resolveTreasureHornOfValhallaAttunement(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureHornOfValhallaAttunement.sides);
  const command: TreasureHornOfValhallaAttunement = getTableEntry(
    usedRoll,
    treasureHornOfValhallaAttunement
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureHornOfValhallaAttunement.Aligned) {
    children.push({
      type: 'pending-roll',
      table: 'treasureHornOfValhallaAlignment',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureHornOfValhallaAttunement',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureHornOfValhallaAlignment(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureHornOfValhallaAlignment.sides);
  const command: TreasureHornOfValhallaAlignment = getTableEntry(
    usedRoll,
    treasureHornOfValhallaAlignment
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureHornOfValhallaAlignment',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureBagOfHolding(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureBagOfHolding,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureBagOfHolding',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureBagOfTricks(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureBagOfTricks,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureBagOfTricks',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureBracersOfDefense(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureBracersOfDefense,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureBracersOfDefense',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureBucknardsEverfullPurse(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureBucknardsEverfullPurse,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureBucknardsEverfullPurse',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureCarpetOfFlying(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureCarpetOfFlying,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureCarpetOfFlying',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureCloakOfProtection(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureCloakOfProtection,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureCloakOfProtection',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureInstrumentOfTheBards(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureInstrumentOfTheBards,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureInstrumentOfTheBards',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureIronFlask(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureIronFlask,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureIronFlask',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureCrystalBall(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureCrystalBall,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureCrystalBall',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureDeckOfManyThings(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureDeckOfManyThings,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureDeckOfManyThings',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureEyesOfPetrification(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureEyesOfPetrification,
    roll: options?.roll,
    buildEvent: (command) =>
      ({
        kind: 'treasureEyesOfPetrification',
        result: command,
      } as OutcomeEvent),
  });
}

export function resolveTreasureArtifactOrRelic(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureArtifactOrRelic.sides);
  const command: TreasureArtifactOrRelic = getTableEntry(
    usedRoll,
    treasureArtifactOrRelic
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureArtifactOrRelic',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureStaffSerpent(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureStaffSerpent.sides);
  const command = getTableEntry(usedRoll, treasureStaffSerpent);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureStaffSerpent',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureContainer(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureContainer.sides);
  const command = getTableEntry(usedRoll, treasureContainer);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureContainer',
      result: command,
    } as OutcomeEvent,
  };
}

function representativeRollForChamberContents(
  result: ChamberRoomContents
): number {
  switch (result) {
    case ChamberRoomContents.Empty:
      return 1;
    case ChamberRoomContents.MonsterOnly:
      return 13;
    case ChamberRoomContents.MonsterAndTreasure:
      return 15;
    case ChamberRoomContents.Special:
      return 18;
    case ChamberRoomContents.TrickTrap:
      return 19;
    case ChamberRoomContents.Treasure:
      return 20;
    default:
      return 1;
  }
}

export function resolveCircularContents(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(circularContents.sides);
  const command = getTableEntry(usedRoll, circularContents);
  const children: DungeonOutcomeNode[] = [];
  if (command === CircularContents.Pool) {
    children.push({ type: 'pending-roll', table: 'circularPool' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'circularContents', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveCircularPool(options?: {
  roll?: number;
  level?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(pool.sides);
  const command = getTableEntry(usedRoll, pool);
  const children: DungeonOutcomeNode[] = [];
  const level = options?.level ?? 1;
  if (command === Pool.PoolMonster || command === Pool.PoolMonsterTreasure) {
    children.push({
      type: 'pending-roll',
      table: `monsterLevel:${level}`,
      context: { kind: 'wandering', level },
    });
  }
  if (command === Pool.PoolMonsterTreasure) {
    for (let index = 1; index <= 2; index += 1) {
      children.push({
        type: 'pending-roll',
        table: 'treasure',
        id: `treasure:${index}`,
        context: {
          kind: 'treasure',
          level,
          withMonster: true,
          rollIndex: index,
          totalRolls: 2,
        },
      });
    }
  }
  if (command === Pool.MagicPool) {
    children.push({ type: 'pending-roll', table: 'circularMagicPool' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'circularPool', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveCircularMagicPool(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(magicPool.sides);
  const command = getTableEntry(usedRoll, magicPool);
  const children: DungeonOutcomeNode[] = [];
  if (command === MagicPool.TransmuteGold) {
    children.push({ type: 'pending-roll', table: 'transmuteType' });
  } else if (command === MagicPool.WishOrDamage) {
    children.push({ type: 'pending-roll', table: 'poolAlignment' });
  } else if (command === MagicPool.Transporter) {
    children.push({ type: 'pending-roll', table: 'transporterLocation' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'circularMagicPool', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTransmuteType(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(transmuteType.sides);
  const command = getTableEntry(usedRoll, transmuteType);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'transmuteType', result: command } as OutcomeEvent,
  };
}

export function resolvePoolAlignment(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(poolAlignment.sides);
  const command = getTableEntry(usedRoll, poolAlignment);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'poolAlignment', result: command } as OutcomeEvent,
  };
}

export function resolveTransporterLocation(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(transporterLocation.sides);
  const command = getTableEntry(usedRoll, transporterLocation);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'transporterLocation', result: command } as OutcomeEvent,
  };
}

export function resolveTrickTrap(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(trickTrap.sides);
  const command = getTableEntry(usedRoll, trickTrap);
  const children: DungeonOutcomeNode[] = [];
  if (command === TrickTrap.IllusionaryWall) {
    children.push({ type: 'pending-roll', table: 'illusionaryWallNature' });
  } else if (command === TrickTrap.GasCorridor) {
    children.push({ type: 'pending-roll', table: 'gasTrapEffect' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'trickTrap', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveIllusionaryWallNature(options?: {
  roll?: number;
  takeOverride?: (tableId: string) => number | undefined;
}): DungeonOutcomeNode {
  const overridden = options?.takeOverride?.('illusionaryWallNature');
  const usedRoll =
    overridden ?? options?.roll ?? rollDice(illusionaryWallNature.sides);
  const command = getTableEntry(usedRoll, illusionaryWallNature);
  const children: DungeonOutcomeNode[] = [];
  if (command === IllusionaryWallNature.Chamber) {
    children.push({
      type: 'pending-roll',
      table: 'chamberDimensions',
      context: {
        kind: 'chamberDimensions',
        forcedContents: ChamberRoomContents.MonsterAndTreasure,
      },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'illusionaryWallNature', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveMonsterLevel(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const table = getMonsterTable(dungeonLevel);
  const usedRoll = options?.roll ?? rollDice(table.sides);
  const result = getTableEntry(usedRoll, table);
  const children: DungeonOutcomeNode[] = [];
  const context = { kind: 'wandering', level: dungeonLevel } as const;
  switch (result) {
    case MonsterLevel.One:
      children.push({ type: 'pending-roll', table: 'monsterOne', context });
      break;
    case MonsterLevel.Two:
      children.push({ type: 'pending-roll', table: 'monsterTwo', context });
      break;
    case MonsterLevel.Three:
      children.push({ type: 'pending-roll', table: 'monsterThree', context });
      break;
    case MonsterLevel.Four:
      children.push({ type: 'pending-roll', table: 'monsterFour', context });
      break;
    case MonsterLevel.Five:
      children.push({ type: 'pending-roll', table: 'monsterFive', context });
      break;
    case MonsterLevel.Six:
      children.push({ type: 'pending-roll', table: 'monsterSix', context });
      break;
    case MonsterLevel.Seven:
      children.push({ type: 'pending-roll', table: 'monsterSeven', context });
      break;
    case MonsterLevel.Eight:
      children.push({ type: 'pending-roll', table: 'monsterEight', context });
      break;
    case MonsterLevel.Nine:
      children.push({ type: 'pending-roll', table: 'monsterNine', context });
      break;
    case MonsterLevel.Ten:
      children.push({ type: 'pending-roll', table: 'monsterTen', context });
      break;
    default:
      break;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterLevel',
      result,
      dungeonLevel,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveMonsterOne(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterOne.sides);
  const result = getTableEntry(usedRoll, monsterOne);
  const children: DungeonOutcomeNode[] = [];
  let text: string | undefined;
  if (result === MonsterOne.Human) {
    children.push({
      type: 'pending-roll',
      table: 'human',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    text = monsterOneTextForCommand(dungeonLevel, result);
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterOne',
      result,
      dungeonLevel,
      text,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveMonsterTwo(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterTwo.sides);
  const result = getTableEntry(usedRoll, monsterTwo);
  const { text, party } = monsterTwoTextForCommand(dungeonLevel, result);
  const eventText = party ? undefined : text;
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterTwo',
      result,
      dungeonLevel,
      text: eventText,
      party,
    },
  };
}

export function resolveMonsterThree(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterThree.sides);
  const result = getTableEntry(usedRoll, monsterThree);
  const children: DungeonOutcomeNode[] = [];
  let text: string | undefined;
  let party: PartyResult | undefined;
  if (result === MonsterThree.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonThree',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    const resolved = monsterThreeTextForCommand(dungeonLevel, result);
    text = resolved.party ? undefined : resolved.text;
    party = resolved.party;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterThree',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonThree(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 3;
  const usedRoll = options?.roll ?? rollDice(dragonThree.sides);
  const result = getTableEntry(usedRoll, dragonThree);
  const text = dragonThreeTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonThree',
      result,
      dungeonLevel,
      text,
    },
  };
}

export function resolveMonsterFour(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterFour.sides);
  const result = getTableEntry(usedRoll, monsterFour);
  const children: DungeonOutcomeNode[] = [];
  let text: string | undefined;
  let party: PartyResult | undefined;
  if (result === MonsterFour.DragonYounger) {
    children.push({
      type: 'pending-roll',
      table: 'dragonFourYounger',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else if (result === MonsterFour.DragonOlder) {
    children.push({
      type: 'pending-roll',
      table: 'dragonFourOlder',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    const resolved = monsterFourTextForCommand(dungeonLevel, result);
    text = resolved.party ? undefined : resolved.text;
    party = resolved.party;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterFour',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonFourYounger(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 4;
  const usedRoll = options?.roll ?? rollDice(dragonFourYounger.sides);
  const result = getTableEntry(usedRoll, dragonFourYounger);
  const text = dragonFourYoungerTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonFourYounger',
      result,
      dungeonLevel,
      text,
    },
  };
}

export function resolveDragonFourOlder(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 4;
  const usedRoll = options?.roll ?? rollDice(dragonFourOlder.sides);
  const result = getTableEntry(usedRoll, dragonFourOlder);
  const text = dragonFourOlderTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonFourOlder',
      result,
      dungeonLevel,
      text,
    },
  };
}

export function resolveMonsterFive(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterFive.sides);
  const result = getTableEntry(usedRoll, monsterFive);
  const children: DungeonOutcomeNode[] = [];
  let text: string | undefined;
  let party: PartyResult | undefined;
  if (result === MonsterFive.DragonYounger) {
    children.push({
      type: 'pending-roll',
      table: 'dragonFiveYounger',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else if (result === MonsterFive.DragonOlder) {
    children.push({
      type: 'pending-roll',
      table: 'dragonFiveOlder',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    const resolved = monsterFiveTextForCommand(dungeonLevel, result);
    text = resolved.party ? undefined : resolved.text;
    party = resolved.party;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterFive',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonFiveYounger(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 5;
  const usedRoll = options?.roll ?? rollDice(dragonFiveYounger.sides);
  const result = getTableEntry(usedRoll, dragonFiveYounger);
  const text = dragonFiveYoungerTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonFiveYounger',
      result,
      dungeonLevel,
      text,
    },
  };
}

export function resolveDragonFiveOlder(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 5;
  const usedRoll = options?.roll ?? rollDice(dragonFiveOlder.sides);
  const result = getTableEntry(usedRoll, dragonFiveOlder);
  const text = dragonFiveOlderTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonFiveOlder',
      result,
      dungeonLevel,
      text,
    },
  };
}

export function resolveMonsterSix(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterSix.sides);
  const result = getTableEntry(usedRoll, monsterSix);
  const children: DungeonOutcomeNode[] = [];
  let text: string | undefined;
  let party: PartyResult | undefined;
  if (result === MonsterSix.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonSix',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    const resolved = monsterSixTextForCommand(dungeonLevel, result);
    text = resolved.party ? undefined : resolved.text;
    party = resolved.party;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterSix',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveMonsterSeven(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterSeven.sides);
  const result = getTableEntry(usedRoll, monsterSeven);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterSevenTextForCommand(dungeonLevel, result);
  const party: PartyResult | undefined = resolved.party;
  const text: string | undefined = party ? undefined : resolved.text;
  if (result === MonsterSeven.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonSeven',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterSeven',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveMonsterEight(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterEight.sides);
  const result = getTableEntry(usedRoll, monsterEight);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterEightTextForCommand(dungeonLevel, result);
  const party: PartyResult | undefined = resolved.party;
  const text: string | undefined = party ? undefined : resolved.text;
  if (result === MonsterEight.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonEight',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterEight',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveMonsterNine(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterNine.sides);
  const result = getTableEntry(usedRoll, monsterNine);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterNineTextForCommand(dungeonLevel, result);
  const party: PartyResult | undefined = resolved.party;
  const text: string | undefined = party ? undefined : resolved.text;
  if (result === MonsterNine.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonNine',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterNine',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveMonsterTen(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(monsterTen.sides);
  const result = getTableEntry(usedRoll, monsterTen);
  const children: DungeonOutcomeNode[] = [];
  const resolved = monsterTenTextForCommand(dungeonLevel, result);
  const party: PartyResult | undefined = resolved.party;
  const text: string | undefined = party ? undefined : resolved.text;
  if (result === MonsterTen.Dragon) {
    children.push({
      type: 'pending-roll',
      table: 'dragonTen',
      context: { kind: 'wandering', level: dungeonLevel },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'monsterTen',
      result,
      dungeonLevel,
      text,
      party,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveDragonSix(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 6;
  const usedRoll = options?.roll ?? rollDice(dragonSix.sides);
  const result = getTableEntry(usedRoll, dragonSix);
  const text = dragonSixTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonSix',
      result,
      dungeonLevel,
      text,
    },
  };
}

export function resolveDragonSeven(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 7;
  const usedRoll = options?.roll ?? rollDice(dragonSeven.sides);
  const result = getTableEntry(usedRoll, dragonSeven);
  const text = dragonSevenTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonSeven',
      result,
      dungeonLevel,
      text,
    } as OutcomeEvent,
  };
}

export function resolveDragonEight(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 8;
  const usedRoll = options?.roll ?? rollDice(dragonEight.sides);
  const result = getTableEntry(usedRoll, dragonEight);
  const text = dragonEightTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonEight',
      result,
      dungeonLevel,
      text,
    } as OutcomeEvent,
  };
}

export function resolveDragonNine(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 9;
  const usedRoll = options?.roll ?? rollDice(dragonNine.sides);
  const result = getTableEntry(usedRoll, dragonNine);
  const text = dragonNineTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonNine',
      result,
      dungeonLevel,
      text,
    } as OutcomeEvent,
  };
}

export function resolveDragonTen(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 10;
  const usedRoll = options?.roll ?? rollDice(dragonTen.sides);
  const result = getTableEntry(usedRoll, dragonTen);
  const text = dragonTenTextForCommand(dungeonLevel, result);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'dragonTen',
      result,
      dungeonLevel,
      text,
    } as OutcomeEvent,
  };
}

export function resolveHuman(options?: {
  roll?: number;
  dungeonLevel?: number;
}): DungeonOutcomeNode {
  const dungeonLevel = options?.dungeonLevel ?? 1;
  const usedRoll = options?.roll ?? rollDice(human.sides);
  const result = getTableEntry(usedRoll, human);
  const { text, party } = humanTextForCommand(dungeonLevel, result);
  const eventText = party ? undefined : text;
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'human',
      result,
      dungeonLevel,
      text: eventText,
      party,
    },
  };
}
