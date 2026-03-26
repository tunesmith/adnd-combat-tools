import { getTableEntry } from '../../../helpers/dungeonLookup';
import { createDungeonRandomId } from '../../../helpers/dungeonRandom';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../../domain/outcome';
import type { TreasureSwordAlignment } from './swordsAlignmentTable';
import { extraordinaryPowerNodeId } from './swordNodeIds';
import { resolveBoundedRoll } from './swordResolverShared';
import {
  buildSwordSpecialPurposePending,
  buildSwordSpecialPurposePowerPending,
} from './swordSpecialPurpose';
import {
  type TreasureSwordExtraordinaryPowerResult,
  TreasureSwordExtraordinaryPower,
  TreasureSwordExtraordinaryPowerCommand,
  describeSwordExtraordinaryPower,
  toTreasureSwordExtraordinaryPower,
  treasureSwordExtraordinaryPower,
  treasureSwordExtraordinaryPowerRestricted,
} from './swordsTables';

export function resolveTreasureSwordExtraordinaryPower(options?: {
  roll?: number;
  rollIndex?: number;
  slotKey?: string;
  tableVariant?: 'standard' | 'restricted';
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const rollIndex = options?.rollIndex;
  const slotKey = options?.slotKey ?? createDungeonRandomId('extra');
  const variant = options?.tableVariant ?? 'standard';
  const table =
    variant === 'restricted'
      ? treasureSwordExtraordinaryPowerRestricted
      : treasureSwordExtraordinaryPower;
  const usedRoll = resolveBoundedRoll(options?.roll, table.sides);
  const command = getTableEntry(usedRoll, table);

  if (
    command === TreasureSwordExtraordinaryPowerCommand.RollTwice &&
    variant === 'standard'
  ) {
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: extraordinaryPowerNodeId(slotKey, rollIndex),
      event: {
        kind: 'treasureSwordExtraordinaryPower',
        result: {
          kind: 'instruction',
          instruction: 'rollTwice',
          roll: usedRoll,
          note: 'Roll twice on this table ignoring scores of 95-97.',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:a`,
          rollIndex,
          tableVariant: 'restricted',
          alignment: options?.alignment,
        }),
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:b`,
          rollIndex,
          tableVariant: 'restricted',
          alignment: options?.alignment,
        }),
      ],
    };
    return node;
  }

  const power = toTreasureSwordExtraordinaryPower(command);
  if (power === undefined) {
    throw new Error(
      `Unsupported sword extraordinary power command: ${command}`
    );
  }
  const result: TreasureSwordExtraordinaryPowerResult = {
    kind: 'power',
    power,
    rolls: [usedRoll],
    multiplier: 1,
    description: describeSwordExtraordinaryPower(power, 1),
    tableVariant: variant,
    alignmentRequired:
      power === TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose &&
      options?.alignment === undefined
        ? true
        : undefined,
  };
  const children: DungeonOutcomeNode[] = [];
  if (power === TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose) {
    const parentSlotKey = slotKey;
    const purposeSlotKey = `${slotKey}:purpose`;
    const powerSlotKey = `${slotKey}:power`;
    children.push(
      buildSwordSpecialPurposePending({
        slotKey: purposeSlotKey,
        parentSlotKey,
        rollIndex,
        alignment: options?.alignment,
      })
    );
    children.push(
      buildSwordSpecialPurposePowerPending({
        slotKey: powerSlotKey,
        rollIndex,
        parentSlotKey,
        alignment: options?.alignment,
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    id: extraordinaryPowerNodeId(slotKey, rollIndex),
    event: {
      kind: 'treasureSwordExtraordinaryPower',
      result,
    } as OutcomeEvent,
    children: children.length > 0 ? children : undefined,
  };
}

export function buildSwordExtraordinaryPowerPending(options: {
  slotKey: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, tableVariant, alignment } = options;
  const variant = tableVariant ?? 'standard';
  const tableName =
    variant === 'restricted'
      ? 'treasureSwordExtraordinaryPowerRestricted'
      : 'treasureSwordExtraordinaryPower';
  return {
    type: 'pending-roll',
    table: tableName,
    id: extraordinaryPowerNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordExtraordinaryPower',
      slotKey,
      rollIndex,
      tableVariant: variant,
      alignment,
    },
  };
}
