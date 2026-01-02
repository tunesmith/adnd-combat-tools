import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { treasureMiscMagicE2, TreasureMiscMagicE2 } from './miscMagicE2Table';
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
  const command: TreasureMiscMagicE2 = getTableEntry(
    usedRoll,
    treasureMiscMagicE2
  );
  const rollIndex = options?.rollIndex;
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMiscMagicE2.CarpetOfFlying) {
    children.push({
      type: 'pending-roll',
      table: 'treasureCarpetOfFlying',
      id: rollIndex ? `treasureCarpetOfFlying:${rollIndex}` : undefined,
    });
  } else if (command === TreasureMiscMagicE2.CrystalBall) {
    children.push({
      type: 'pending-roll',
      table: 'treasureCrystalBall',
      id: rollIndex ? `treasureCrystalBall:${rollIndex}` : undefined,
    });
  } else if (command === TreasureMiscMagicE2.DeckOfManyThings) {
    children.push({
      type: 'pending-roll',
      table: 'treasureDeckOfManyThings',
      id: rollIndex ? `treasureDeckOfManyThings:${rollIndex}` : undefined,
    });
  } else if (command === TreasureMiscMagicE2.EyesOfPetrification) {
    children.push({
      type: 'pending-roll',
      table: 'treasureEyesOfPetrification',
      id: rollIndex ? `treasureEyesOfPetrification:${rollIndex}` : undefined,
    });
  } else if (command === TreasureMiscMagicE2.CloakOfProtection) {
    children.push({
      type: 'pending-roll',
      table: 'treasureCloakOfProtection',
      id: rollIndex ? `treasureCloakOfProtection:${rollIndex}` : undefined,
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
