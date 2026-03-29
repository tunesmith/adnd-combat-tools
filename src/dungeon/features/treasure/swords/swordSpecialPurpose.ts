import { getTableEntry } from '../../../helpers/dungeonLookup';
import { createDungeonRandomId } from '../../../helpers/dungeonRandom';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import type { TreasureSwordAlignment } from './swordsAlignmentTable';
import {
  type TreasureSwordSpecialPurposePowerResult,
  type TreasureSwordSpecialPurposeResult,
  describeSwordSpecialPurpose,
  describeSwordSpecialPurposePower,
  toTreasureSwordSpecialPurpose,
  toTreasureSwordSpecialPurposePower,
  treasureSwordSpecialPurpose,
  treasureSwordSpecialPurposePower,
} from './swordsTables';
import {
  specialPurposeNodeId,
  specialPurposePowerNodeId,
} from './swordNodeIds';
import { resolveBoundedRoll } from './swordResolverShared';

export function resolveTreasureSwordSpecialPurpose(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey = options?.slotKey ?? createDungeonRandomId('purpose');
  const parentSlotKey = options?.parentSlotKey;
  const alignment = options?.alignment;
  const usedRoll = resolveBoundedRoll(
    options?.roll,
    treasureSwordSpecialPurpose.sides
  );
  const command = getTableEntry(usedRoll, treasureSwordSpecialPurpose);
  const purpose = toTreasureSwordSpecialPurpose(command);
  const result: TreasureSwordSpecialPurposeResult = {
    kind: 'purpose',
    purpose,
    rolls: [usedRoll],
    description: describeSwordSpecialPurpose(purpose, {
      alignment,
    }),
    alignment,
    slotKey,
    parentSlotKey,
  };
  const node: OutcomeEventNode = {
    type: 'event',
    roll: usedRoll,
    id: specialPurposeNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordSpecialPurpose',
      result,
    } as OutcomeEvent,
  };
  if (!parentSlotKey) {
    node.children = [
      buildSwordSpecialPurposePowerPending({
        slotKey: `${slotKey}:power`,
        rollIndex: options?.rollIndex,
        parentSlotKey: slotKey,
        alignment,
      }),
    ];
  }
  return node;
}

export function resolveTreasureSwordSpecialPurposePower(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey = options?.slotKey ?? createDungeonRandomId('purpose-power');
  const usedRoll = resolveBoundedRoll(
    options?.roll,
    treasureSwordSpecialPurposePower.sides
  );
  const command = getTableEntry(usedRoll, treasureSwordSpecialPurposePower);
  const power = toTreasureSwordSpecialPurposePower(command);
  const result: TreasureSwordSpecialPurposePowerResult = {
    kind: 'specialPurposePower',
    power,
    rolls: [usedRoll],
    description: describeSwordSpecialPurposePower(power),
    slotKey,
    parentSlotKey: options?.parentSlotKey,
  };
  return {
    type: 'event',
    roll: usedRoll,
    id: specialPurposePowerNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordSpecialPurposePower',
      result,
    } as OutcomeEvent,
  };
}

export function buildSwordSpecialPurposePending(options: {
  slotKey: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, parentSlotKey, alignment } = options;
  const alignmentReady = alignment !== undefined;
  return createPendingRoll({
    kind: 'treasureSwordSpecialPurpose',
    id: specialPurposeNodeId(slotKey, rollIndex),
    args: {
      kind: 'treasureSwordSpecialPurpose',
      slotKey,
      rollIndex,
      parentSlotKey,
      alignment,
      alignmentReady,
    },
  });
}

export function buildSwordSpecialPurposePowerPending(options: {
  slotKey: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, parentSlotKey, alignment } = options;
  return createPendingRoll({
    kind: 'treasureSwordSpecialPurposePower',
    id: specialPurposePowerNodeId(slotKey, rollIndex),
    args: {
      kind: 'treasureSwordSpecialPurposePower',
      slotKey,
      rollIndex,
      parentSlotKey,
      alignment,
    },
  });
}
