import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../tables/dungeon/periodicCheck';
import { doorBeyond, DoorBeyond } from '../../tables/dungeon/doorBeyond';
import type { DungeonOutcomeNode, OutcomeEvent } from './outcome';
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
      children.push({
        type: 'pending-roll',
        table: 'wanderingWhereFrom',
        context: { kind: 'wandering', level },
      });
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
  level?: number;
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
      children.push({
        type: 'pending-roll',
        table: 'chamberDimensions',
        context: {
          kind: 'chamberDimensions',
          level: options?.level ?? 1,
        },
      });
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
      children.push({
        type: 'pending-roll',
        table: 'unusualShape',
        context: { kind: 'wandering', level: dungeonLevel },
      });
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
      children.push({
        type: 'pending-roll',
        table: 'unusualShape',
        context: { kind: 'wandering', level: dungeonLevel },
      });
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
  level?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(unusualShape.sides);
  const command = getTableEntry(usedRoll, unusualShape);
  const children: DungeonOutcomeNode[] = [];
  if (command === UnusualShape.Circular) {
    children.push({
      type: 'pending-roll',
      table: 'circularContents',
      context:
        options?.level !== undefined
          ? { kind: 'wandering', level: options.level }
          : undefined,
    });
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
  level?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(circularContents.sides);
  const command = getTableEntry(usedRoll, circularContents);
  const children: DungeonOutcomeNode[] = [];
  if (command === CircularContents.Pool) {
    children.push({
      type: 'pending-roll',
      table: 'circularPool',
      context:
        options?.level !== undefined
          ? { kind: 'wandering', level: options.level }
          : undefined,
    });
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
