import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { miscMagicE2Followups, treasureMiscMagicE2 } from './miscMagicE2Table';
import { buildTreasureEvent } from '../shared';
import {
  treasureCarpetOfFlying,
  treasureCloakOfProtection,
  treasureCrystalBall,
  treasureDeckOfManyThings,
  treasureEyesOfPetrification,
} from './miscMagicE2Subtables';
import type {
  TreasureCarpetOfFlying,
  TreasureCloakOfProtection,
  TreasureCrystalBall,
  TreasureDeckOfManyThings,
  TreasureEyesOfPetrification,
} from './miscMagicE2Subtables';

type TreasureMiscMagicE2ResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function resolveTreasureMiscMagicE2(
  options?: TreasureMiscMagicE2ResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE2.sides);
  const command = getTableEntry(usedRoll, treasureMiscMagicE2);
  const rollIndex = options?.rollIndex;
  const children: DungeonOutcomeNode[] = [];
  const followup = miscMagicE2Followups.find(
    (candidate) => candidate.result === command
  );
  if (followup) {
    children.push({
      type: 'pending-roll',
      table: followup.table,
      id: rollIndex ? `${followup.table}:${rollIndex}` : undefined,
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: buildTreasureEvent(
      'treasureMiscMagicE2',
      command,
      usedRoll,
      options
    ),
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureCarpetOfFlying(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureCarpetOfFlying.sides);
  const command: TreasureCarpetOfFlying = getTableEntry(
    usedRoll,
    treasureCarpetOfFlying
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureCarpetOfFlying',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureCloakOfProtection(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureCloakOfProtection.sides);
  const command: TreasureCloakOfProtection = getTableEntry(
    usedRoll,
    treasureCloakOfProtection
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureCloakOfProtection',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureCrystalBall(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureCrystalBall.sides);
  const command: TreasureCrystalBall = getTableEntry(
    usedRoll,
    treasureCrystalBall
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureCrystalBall',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureDeckOfManyThings(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureDeckOfManyThings.sides);
  const command: TreasureDeckOfManyThings = getTableEntry(
    usedRoll,
    treasureDeckOfManyThings
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureDeckOfManyThings',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureEyesOfPetrification(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureEyesOfPetrification.sides);
  const command: TreasureEyesOfPetrification = getTableEntry(
    usedRoll,
    treasureEyesOfPetrification
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureEyesOfPetrification',
      result: command,
    } as OutcomeEvent,
  };
}
