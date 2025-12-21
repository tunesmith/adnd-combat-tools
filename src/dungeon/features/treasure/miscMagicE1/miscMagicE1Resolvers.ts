import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  treasureMiscMagicE1,
  TreasureMiscMagicE1,
} from './miscMagicE1Table';
import type {
  TreasureArtifactOrRelic,
  TreasureBagOfHolding,
  TreasureBagOfTricks,
  TreasureBracersOfDefense,
  TreasureBucknardsEverfullPurse,
} from './miscMagicE1Subtables';
import {
  treasureArtifactOrRelic,
  treasureBagOfHolding,
  treasureBagOfTricks,
  treasureBracersOfDefense,
  treasureBucknardsEverfullPurse,
} from './miscMagicE1Subtables';

export function resolveTreasureMiscMagicE1(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE1.sides);
  const command: TreasureMiscMagicE1 = getTableEntry(
    usedRoll,
    treasureMiscMagicE1
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMiscMagicE1.BagOfHolding) {
    children.push({
      type: 'pending-roll',
      table: 'treasureBagOfHolding',
      id: options?.rollIndex
        ? `treasureBagOfHolding:${options.rollIndex}`
        : undefined,
    });
  } else if (command === TreasureMiscMagicE1.BagOfTricks) {
    children.push({
      type: 'pending-roll',
      table: 'treasureBagOfTricks',
      id: options?.rollIndex
        ? `treasureBagOfTricks:${options.rollIndex}`
        : undefined,
    });
  } else if (command === TreasureMiscMagicE1.BracersOfDefense) {
    children.push({
      type: 'pending-roll',
      table: 'treasureBracersOfDefense',
      id: options?.rollIndex
        ? `treasureBracersOfDefense:${options.rollIndex}`
        : undefined,
    });
  } else if (command === TreasureMiscMagicE1.BucknardsEverfullPurse) {
    children.push({
      type: 'pending-roll',
      table: 'treasureBucknardsEverfullPurse',
      id: options?.rollIndex
        ? `treasureBucknardsEverfullPurse:${options.rollIndex}`
        : undefined,
    });
  } else if (command === TreasureMiscMagicE1.ArtifactOrRelic) {
    children.push({
      type: 'pending-roll',
      table: 'treasureArtifactOrRelic',
      id: options?.rollIndex
        ? `treasureArtifactOrRelic:${options.rollIndex}`
        : undefined,
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureMiscMagicE1',
      result: command,
      level: options?.level,
      treasureRoll: options?.treasureRoll,
      rollIndex: options?.rollIndex,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureBagOfHolding(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureBagOfHolding.sides);
  const command: TreasureBagOfHolding = getTableEntry(
    usedRoll,
    treasureBagOfHolding
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureBagOfHolding',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureBagOfTricks(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureBagOfTricks.sides);
  const command: TreasureBagOfTricks = getTableEntry(
    usedRoll,
    treasureBagOfTricks
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureBagOfTricks',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureBracersOfDefense(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureBracersOfDefense.sides);
  const command: TreasureBracersOfDefense = getTableEntry(
    usedRoll,
    treasureBracersOfDefense
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureBracersOfDefense',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureBucknardsEverfullPurse(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureBucknardsEverfullPurse.sides);
  const command: TreasureBucknardsEverfullPurse = getTableEntry(
    usedRoll,
    treasureBucknardsEverfullPurse
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureBucknardsEverfullPurse',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureArtifactOrRelic(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureArtifactOrRelic.sides);
  const command: TreasureArtifactOrRelic = getTableEntry(
    usedRoll,
    treasureArtifactOrRelic
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureArtifactOrRelic',
      result: command,
    } as OutcomeEvent,
  };
}
