import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  unusualShape,
  UnusualShape,
  unusualSize,
  UnusualSize,
} from './unusualSpaceTable';

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
