import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
  OutcomeEvent,
} from '../../../domain/outcome';
import {
  doorLocation,
  DoorLocation,
  periodicCheckDoorOnly,
  PeriodicCheckDoorOnly,
} from './doorChainTable';

const toLaterality = (
  result: DoorLocation
): DoorChainLaterality | undefined => {
  if (result === DoorLocation.Left) return 'Left';
  if (result === DoorLocation.Right) return 'Right';
  return undefined;
};

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
    } as OutcomeEvent,
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
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}
