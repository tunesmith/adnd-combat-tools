import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
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
      children.push(
        createPendingRoll({ kind: 'doorLocation', tableId: 'doorLocation:0' })
      );
      break;
    case PeriodicCheck.SidePassage:
      children.push(createPendingRoll({ kind: 'sidePassages' }));
      break;
    case PeriodicCheck.PassageTurn:
      children.push(createPendingRoll({ kind: 'passageTurns' }));
      break;
    case PeriodicCheck.Chamber:
      children.push(
        createPendingRoll({
          kind: 'chamberDimensions',
          args: { kind: 'chamberDimensions', level },
        })
      );
      break;
    case PeriodicCheck.Stairs:
      children.push(createPendingRoll({ kind: 'stairs' }));
      break;
    case PeriodicCheck.TrickTrap:
      children.push(
        createPendingRoll({
          kind: 'trickTrap',
          args: { kind: 'wandering', level },
        })
      );
      break;
    case PeriodicCheck.WanderingMonster:
      children.push(
        createPendingRoll({
          kind: 'wanderingWhereFrom',
          args: { kind: 'wandering', level },
        })
      );
      children.push(
        createPendingRoll({
          kind: 'monsterLevel',
          tableId: `monsterLevel:${level}`,
          args: { kind: 'wandering', level },
        })
      );
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
    children.push(
      createPendingRoll({
        kind: 'roomDimensions',
        args: { kind: 'chamberDimensions', level },
      })
    );
  } else if (command === DoorBeyond.Chamber) {
    children.push(
      createPendingRoll({
        kind: 'chamberDimensions',
        args: { kind: 'chamberDimensions', level },
      })
    );
  } else if (
    command === DoorBeyond.PassageStraightAhead ||
    command === DoorBeyond.Passage45AheadBehind ||
    command === DoorBeyond.Passage45BehindAhead ||
    (command === DoorBeyond.ParallelPassageOrCloset && !options?.doorAhead)
  ) {
    children.push(createPendingRoll({ kind: 'passageWidth' }));
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
      children.push(
        createPendingRoll({ kind: 'doorLocation', tableId: 'doorLocation:0' })
      );
      break;
    case PeriodicCheck.SidePassage:
      children.push(createPendingRoll({ kind: 'sidePassages' }));
      break;
    case PeriodicCheck.PassageTurn:
      children.push(createPendingRoll({ kind: 'passageTurns' }));
      break;
    case PeriodicCheck.Chamber:
      children.push(
        createPendingRoll({
          kind: 'chamberDimensions',
          args: {
            kind: 'chamberDimensions',
            level: options?.level ?? 1,
          },
        })
      );
      break;
    case PeriodicCheck.Stairs:
      children.push(createPendingRoll({ kind: 'stairs' }));
      break;
    case PeriodicCheck.TrickTrap:
      children.push(
        createPendingRoll({
          kind: 'trickTrap',
          args: { kind: 'wandering', level: options?.level ?? 1 },
        })
      );
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
