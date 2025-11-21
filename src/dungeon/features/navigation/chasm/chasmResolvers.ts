import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import {
  chasmConstruction,
  ChasmConstruction,
  chasmDepth,
  jumpingPlaceWidth,
} from './chasmTable';

export function resolveChasmDepth(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chasmDepth.sides);
  const command = getTableEntry(usedRoll, chasmDepth);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'chasmDepth', result: command },
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
    event: { kind: 'chasmConstruction', result: command },
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
    event: { kind: 'jumpingPlaceWidth', result: command },
  };
}
