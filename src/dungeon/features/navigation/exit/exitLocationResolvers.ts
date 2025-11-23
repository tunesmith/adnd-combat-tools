import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  exitAlternative,
  exitDirection,
  exitLocation,
} from './exitLocationsTable';

export function resolvePassageExitLocation(options?: {
  roll?: number;
  context?: {
    index?: number;
    total?: number;
    origin?: 'room' | 'chamber';
    id?: string;
  };
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(exitLocation.sides);
  const command = getTableEntry(usedRoll, exitLocation);
  const index = options?.context?.index ?? 1;
  const total = options?.context?.total ?? 1;
  const origin = options?.context?.origin ?? 'room';
  const baseId =
    options?.context?.id ?? `exit:${options?.context?.index ?? index}`;
  const children: DungeonOutcomeNode[] = [
    {
      type: 'pending-roll',
      table: 'exitDirection',
      id: baseId ? `${baseId}.0.exitDirection` : `exit:direction:${index}`,
      context: { kind: 'exitDirection', index, total, origin },
    },
    {
      type: 'pending-roll',
      table: 'exitAlternative',
      id: baseId
        ? `${baseId}.1.exitAlternative`
        : `exitAlternative:passage:${index}`,
      context: { kind: 'exitAlternative', exitType: 'passage' },
    },
  ];
  return {
    type: 'event',
    id: baseId,
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
    id?: string;
  };
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(exitLocation.sides);
  const command = getTableEntry(usedRoll, exitLocation);
  const index = options?.context?.index ?? 1;
  const total = options?.context?.total ?? 1;
  const origin = options?.context?.origin ?? 'room';
  const baseId =
    options?.context?.id ?? `exit:${options?.context?.index ?? index}`;
  return {
    type: 'event',
    id: baseId,
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
        id: baseId
          ? `${baseId}.1.exitAlternative`
          : `exitAlternative:door:${index}`,
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
