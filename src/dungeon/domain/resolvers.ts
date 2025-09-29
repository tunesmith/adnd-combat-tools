import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
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
} from './outcome';
import { sidePassages } from '../../tables/dungeon/sidePassages';
import { passageTurns } from '../../tables/dungeon/passageTurns';
import {
  stairs,
  Stairs,
  egressOne,
  egressTwo,
  egressThree,
  chute,
} from '../../tables/dungeon/stairs';
import {
  numberOfExits,
  NumberOfExits,
} from '../../tables/dungeon/numberOfExits';
import {
  specialPassage,
  SpecialPassage,
  galleryStairLocation,
  GalleryStairLocation,
  galleryStairOccurrence,
  streamConstruction,
  riverConstruction,
  RiverConstruction,
  riverBoatBank,
  chasmDepth,
  chasmConstruction,
  ChasmConstruction,
  jumpingPlaceWidth,
} from '../../tables/dungeon/specialPassage';
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
  exitAlternative,
  exitLocation,
} from '../../tables/dungeon/exitLocation';
import { exitDirection } from '../../tables/dungeon/exitDirection';
import { gasTrapEffect } from '../../tables/dungeon/gasTrapEffect';
import { passageWidth, PassageWidth } from '../../tables/dungeon/passageWidth';
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
import {
  treasureProtectionType,
  TreasureProtectionType,
  treasureProtectionGuardedBy,
  treasureProtectionHiddenBy,
} from '../../tables/dungeon/treasureProtection';
import type { TreasureEntry } from './outcome';
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
import { MonsterLevel } from '../../tables/dungeon/monster/monsterLevel';
import { oneToFour, OneToFour } from '../../tables/dungeon/numberOfExits';
import type { DoorChainLaterality } from './outcome';

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
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(doorBeyond.sides);
  const command = getTableEntry(usedRoll, doorBeyond);
  const children: DungeonOutcomeNode[] = [];
  if (command === DoorBeyond.Room) {
    children.push({ type: 'pending-roll', table: 'roomDimensions' });
  } else if (command === DoorBeyond.Chamber) {
    children.push({ type: 'pending-roll', table: 'chamberDimensions' });
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

export function resolveSidePassages(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  /**
   * We do *not* check passage width for side passages, as the "periodic check"
   * table specifically calls out passage width for "passage turns" but not for
   * side passages.
   */
  const usedRoll = options?.roll ?? rollDice(sidePassages.sides);
  const command = getTableEntry(usedRoll, sidePassages);
  const event: OutcomeEvent = {
    kind: 'sidePassages',
    result: command,
  } as OutcomeEvent;
  return { type: 'event', roll: usedRoll, event };
}

export function resolvePassageTurns(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(passageTurns.sides);
  const command = getTableEntry(usedRoll, passageTurns);
  const event: OutcomeEvent = {
    kind: 'passageTurns',
    result: command,
  } as OutcomeEvent;
  // After a turn the generator always stages passage width so both modes can
  // reuse the same outcome tree and render consistent previews.
  const children: DungeonOutcomeNode[] = [
    { type: 'pending-roll', table: 'passageWidth' },
  ];
  return { type: 'event', roll: usedRoll, event, children };
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

export function resolveSpecialPassage(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(specialPassage.sides);
  const command = getTableEntry(usedRoll, specialPassage);
  const event: OutcomeEvent = {
    kind: 'specialPassage',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === SpecialPassage.FiftyFeetGalleries) {
    children.push({ type: 'pending-roll', table: 'galleryStairLocation' });
  } else if (command === SpecialPassage.TenFootStream) {
    children.push({ type: 'pending-roll', table: 'streamConstruction' });
  } else if (
    command === SpecialPassage.TwentyFootRiver ||
    command === SpecialPassage.FortyFootRiver ||
    command === SpecialPassage.SixtyFootRiver
  ) {
    children.push({ type: 'pending-roll', table: 'riverConstruction' });
  } else if (command === SpecialPassage.TwentyFootChasm) {
    children.push({ type: 'pending-roll', table: 'chasmDepth' });
    children.push({ type: 'pending-roll', table: 'chasmConstruction' });
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

export function resolveChute(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chute.sides);
  const command = getTableEntry(usedRoll, chute);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'chute', result: command } as OutcomeEvent,
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
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(roomDimensions.sides);
  const command = getTableEntry(usedRoll, roomDimensions);
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
  children.push({ type: 'pending-roll', table: 'chamberRoomContents' });
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
      setCountEntry(entry, quantity, 'gem', 'gems');
      break;
    }
    case TreasureWithoutMonster.JewelryPerLevel: {
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
  const usedRoll = options?.roll ?? rollDice(treasurePotionAnimalControl.sides);
  const command = getTableEntry(usedRoll, treasurePotionAnimalControl);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePotionAnimalControl',
      result: command,
      level: options?.level ?? 1,
      treasureRoll: options?.treasureRoll ?? usedRoll,
      rollIndex: options?.rollIndex,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePotionDragonControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePotionDragonControl.sides);
  const command = getTableEntry(usedRoll, treasurePotionDragonControl);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePotionDragonControl',
      result: command,
      level: options?.level ?? 1,
      treasureRoll: options?.treasureRoll ?? usedRoll,
      rollIndex: options?.rollIndex,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePotionGiantControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePotionGiantControl.sides);
  const command = getTableEntry(usedRoll, treasurePotionGiantControl);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePotionGiantControl',
      result: command,
      level: options?.level ?? 1,
      treasureRoll: options?.treasureRoll ?? usedRoll,
      rollIndex: options?.rollIndex,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePotionGiantStrength(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePotionGiantStrength.sides);
  const command = getTableEntry(usedRoll, treasurePotionGiantStrength);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePotionGiantStrength',
      result: command,
      level: options?.level ?? 1,
      treasureRoll: options?.treasureRoll ?? usedRoll,
      rollIndex: options?.rollIndex,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePotionHumanControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePotionHumanControl.sides);
  const command = getTableEntry(usedRoll, treasurePotionHumanControl);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePotionHumanControl',
      result: command,
      level: options?.level ?? 1,
      treasureRoll: options?.treasureRoll ?? usedRoll,
      rollIndex: options?.rollIndex,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePotionUndeadControl(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePotionUndeadControl.sides);
  const command = getTableEntry(usedRoll, treasurePotionUndeadControl);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePotionUndeadControl',
      result: command,
      level: options?.level ?? 1,
      treasureRoll: options?.treasureRoll ?? usedRoll,
      rollIndex: options?.rollIndex,
    } as OutcomeEvent,
  };
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
  if (command === TreasureRing.Contrariness) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingContrariness',
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

export function resolvePassageExitLocation(options?: {
  roll?: number;
  context?: {
    index?: number;
    total?: number;
    origin?: 'room' | 'chamber';
  };
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(exitLocation.sides);
  const command = getTableEntry(usedRoll, exitLocation);
  const index = options?.context?.index ?? 1;
  const total = options?.context?.total ?? 1;
  const origin = options?.context?.origin ?? 'room';
  const children: DungeonOutcomeNode[] = [
    {
      type: 'pending-roll',
      table: 'exitDirection',
      id: `exit:direction:${index}`,
      context: { kind: 'exitDirection', index, total, origin },
    },
    {
      type: 'pending-roll',
      table: 'exitAlternative',
      id: `exitAlternative:passage:${index}`,
      context: { kind: 'exitAlternative', exitType: 'passage' },
    },
  ];
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'passageExitLocation',
      result: command,
      index,
      total,
      origin,
    } as OutcomeEvent,
    children,
  };
}

export function resolveDoorExitLocation(options?: {
  roll?: number;
  context?: {
    index?: number;
    total?: number;
    origin?: 'room' | 'chamber';
  };
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(exitLocation.sides);
  const command = getTableEntry(usedRoll, exitLocation);
  const index = options?.context?.index ?? 1;
  const total = options?.context?.total ?? 1;
  const origin = options?.context?.origin ?? 'room';
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'doorExitLocation',
      result: command,
      index,
      total,
      origin,
    } as OutcomeEvent,
    children: [
      {
        type: 'pending-roll',
        table: 'exitAlternative',
        id: `exitAlternative:door:${index}`,
        context: { kind: 'exitAlternative', exitType: 'door' },
      },
    ],
  };
}

export function resolveExitDirection(options?: {
  roll?: number;
  context?: {
    index?: number;
    total?: number;
    origin?: 'room' | 'chamber';
  };
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(exitDirection.sides);
  const command = getTableEntry(usedRoll, exitDirection);
  const index = options?.context?.index ?? 1;
  const total = options?.context?.total ?? 1;
  const origin = options?.context?.origin ?? 'room';
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'exitDirection',
      result: command,
      index,
      total,
      origin,
    } as OutcomeEvent,
  };
}

export function resolveExitAlternative(options?: {
  roll?: number;
  context?: {
    exitType?: 'door' | 'passage';
  };
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(exitAlternative.sides);
  const command = getTableEntry(usedRoll, exitAlternative);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'exitAlternative',
      result: command,
      exitType: options?.context?.exitType,
    } as OutcomeEvent,
  };
}

export function resolveGasTrapEffect(options?: {
  roll?: number;
  takeOverride?: (tableId: string) => number | undefined;
}): DungeonOutcomeNode {
  const overridden = options?.takeOverride?.('gasTrapEffect');
  const usedRoll = overridden ?? options?.roll ?? rollDice(gasTrapEffect.sides);
  const command = getTableEntry(usedRoll, gasTrapEffect);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'gasTrapEffect', result: command } as OutcomeEvent,
  };
}

export function resolveGalleryStairLocation(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(galleryStairLocation.sides);
  const command = getTableEntry(usedRoll, galleryStairLocation);
  const children: DungeonOutcomeNode[] = [];
  if (command === GalleryStairLocation.PassageEnd) {
    children.push({ type: 'pending-roll', table: 'galleryStairOccurrence' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'galleryStairLocation', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveGalleryStairOccurrence(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(galleryStairOccurrence.sides);
  const command = getTableEntry(usedRoll, galleryStairOccurrence);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'galleryStairOccurrence', result: command } as OutcomeEvent,
  };
}

export function resolveStreamConstruction(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(streamConstruction.sides);
  const command = getTableEntry(usedRoll, streamConstruction);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'streamConstruction', result: command } as OutcomeEvent,
  };
}

export function resolveRiverConstruction(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(riverConstruction.sides);
  const command = getTableEntry(usedRoll, riverConstruction);
  const children: DungeonOutcomeNode[] = [];
  if (command === RiverConstruction.Boat) {
    children.push({ type: 'pending-roll', table: 'riverBoatBank' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'riverConstruction', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveRiverBoatBank(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(riverBoatBank.sides);
  const command = getTableEntry(usedRoll, riverBoatBank);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'riverBoatBank', result: command } as OutcomeEvent,
  };
}

export function resolveChasmDepth(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chasmDepth.sides);
  const command = getTableEntry(usedRoll, chasmDepth);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'chasmDepth', result: command } as OutcomeEvent,
  };
}

export function resolveChasmConstruction(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chasmConstruction.sides);
  const command = getTableEntry(usedRoll, chasmConstruction);
  const children: DungeonOutcomeNode[] = [];
  if (command === ChasmConstruction.JumpingPlace) {
    children.push({ type: 'pending-roll', table: 'jumpingPlaceWidth' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'chasmConstruction', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveJumpingPlaceWidth(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(jumpingPlaceWidth.sides);
  const command = getTableEntry(usedRoll, jumpingPlaceWidth);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'jumpingPlaceWidth', result: command } as OutcomeEvent,
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
