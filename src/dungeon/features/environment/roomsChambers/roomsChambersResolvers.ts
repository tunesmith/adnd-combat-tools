import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  chamberDimensions,
  ChamberDimensions,
  chamberRoomContents,
  ChamberRoomContents,
  chamberRoomStairs,
  roomDimensions,
  RoomDimensions,
} from './roomsChambersTable';

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
    case ChamberRoomContents.MonsterAndTreasure:
      children.push({
        type: 'pending-roll',
        table: `monsterLevel:${level}`,
        context: { kind: 'wandering', level },
      });
      break;
    case ChamberRoomContents.Special:
      children.push({ type: 'pending-roll', table: 'chamberRoomStairs' });
      break;
    case ChamberRoomContents.TrickTrap:
      children.push({
        type: 'pending-roll',
        table: 'trickTrap',
        context: { kind: 'wandering', level },
      });
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
