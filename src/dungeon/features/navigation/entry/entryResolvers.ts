import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  DoorBeyond,
  doorBeyond,
  PeriodicCheck,
  periodicCheck,
} from './entryTable';

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
      children.push({
        type: 'pending-roll',
        table: 'trickTrap',
        context: { kind: 'wandering', level },
      });
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
      children.push({
        type: 'pending-roll',
        table: 'trickTrap',
        context: { kind: 'wandering', level: options?.level ?? 1 },
      });
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
