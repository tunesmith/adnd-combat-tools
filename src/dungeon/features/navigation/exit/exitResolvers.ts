import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { chute } from '../../../../tables/dungeon/stairs';
import { exitLocation, exitAlternative, exitDirection } from './exitTable';

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

export function resolveChute(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chute.sides);
  const command = getTableEntry(usedRoll, chute);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'chute', result: command } as OutcomeEvent,
  };
}
