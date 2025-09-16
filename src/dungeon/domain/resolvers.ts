import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../tables/dungeon/periodicCheck';
import { doorBeyond, DoorBeyond } from '../../tables/dungeon/doorBeyond';
import { doorLocation, DoorLocation } from '../../tables/dungeon/doorLocation';
import type { DungeonOutcomeNode, OutcomeEvent } from './outcome';
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
import { numberOfExits } from '../../tables/dungeon/numberOfExits';
import {
  specialPassage,
  SpecialPassage,
  galleryStairLocation,
  galleryStairOccurrence,
  streamConstruction,
  riverConstruction,
  riverBoatBank,
  chasmDepth,
  chasmConstruction,
  jumpingPlaceWidth,
} from '../../tables/dungeon/specialPassage';
import { passageWidth, PassageWidth } from '../../tables/dungeon/passageWidth';
import {
  roomDimensions,
  RoomDimensions,
  chamberDimensions,
  ChamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import { unusualShape } from '../../tables/dungeon/unusualShape';
import { unusualSize } from '../../tables/dungeon/unusualSize';
import {
  periodicCheckDoorOnly,
  PeriodicCheckDoorOnly,
} from '../../tables/dungeon/periodicCheckDoorOnly';
import type { DoorChainLaterality } from './outcome';

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
        context: { kind: 'doorChain', existing: [] },
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
        context: { kind: 'doorChain', existing: [] },
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

export function resolveDoorLocation(options?: {
  roll?: number;
  existing?: DoorChainLaterality[];
  sequence?: number;
}): DungeonOutcomeNode {
  const existingBefore = options?.existing ? [...options.existing] : [];
  const usedRoll = options?.roll ?? rollDice(doorLocation.sides);
  const command = getTableEntry(usedRoll, doorLocation);
  const lateral = toLaterality(command);
  const existingAfter = lateral
    ? existingBefore.includes(lateral)
      ? existingBefore
      : [...existingBefore, lateral]
    : existingBefore;
  const sequence =
    options?.sequence !== undefined ? options.sequence : existingBefore.length;
  const children: DungeonOutcomeNode[] = [];
  if (lateral && existingAfter.length > existingBefore.length) {
    children.push({
      type: 'pending-roll',
      table: `periodicCheckDoorOnly:${sequence}`,
      context: { kind: 'doorChain', existing: existingAfter },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'doorLocation',
      result: command,
      existingBefore,
      existingAfter,
      sequence,
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
      table: `doorLocation:${sequence}`,
      context: { kind: 'doorChain', existing },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'periodicDoorOnly',
      result: command,
      existing,
      sequence,
    },
    children: children.length ? children : undefined,
  };
}

export function resolveSidePassages(options?: {
  roll?: number;
}): DungeonOutcomeNode {
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
  // After a turn, determine passage width as a staged child in detail mode
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
    } as OutcomeEvent,
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
      children.push({ type: 'pending-roll', table: 'unusualSize' });
      break;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveChamberDimensions(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chamberDimensions.sides);
  const command = getTableEntry(usedRoll, chamberDimensions);
  const event: OutcomeEvent = {
    kind: 'chamberDimensions',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
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
      children.push({ type: 'pending-roll', table: 'unusualSize' });
      break;
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
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'unusualShape', result: command } as OutcomeEvent,
  };
}

export function resolveUnusualSize(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(unusualSize.sides);
  const command = getTableEntry(usedRoll, unusualSize);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'unusualSize', result: command } as OutcomeEvent,
  };
}

export function resolveGalleryStairLocation(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(galleryStairLocation.sides);
  const command = getTableEntry(usedRoll, galleryStairLocation);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'galleryStairLocation', result: command } as OutcomeEvent,
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
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'riverConstruction', result: command } as OutcomeEvent,
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
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'chasmConstruction', result: command } as OutcomeEvent,
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
