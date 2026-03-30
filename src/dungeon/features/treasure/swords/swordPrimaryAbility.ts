import { getTableEntry } from '../../../helpers/dungeonLookup';
import { createDungeonRandomId } from '../../../helpers/dungeonRandom';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { primaryAbilityNodeId } from './swordNodeIds';
import { resolveBoundedRoll } from './swordResolverShared';
import { buildSwordExtraordinaryPowerPending } from './swordExtraordinaryPower';
import {
  type TreasureSwordPrimaryAbilityResult,
  TreasureSwordPrimaryAbilityCommand,
  describeSwordPrimaryAbility,
  toTreasureSwordPrimaryAbility,
  treasureSwordPrimaryAbility,
  treasureSwordPrimaryAbilityRestricted,
} from './swordsTables';

export function resolveTreasureSwordPrimaryAbility(options?: {
  roll?: number;
  rollIndex?: number;
  slotKey?: string;
  tableVariant?: 'standard' | 'restricted';
}): DungeonOutcomeNode {
  const rollIndex = options?.rollIndex;
  const slotKey = options?.slotKey ?? createDungeonRandomId('auto');
  const variant = options?.tableVariant ?? 'standard';
  const table =
    variant === 'restricted'
      ? treasureSwordPrimaryAbilityRestricted
      : treasureSwordPrimaryAbility;
  const usedRoll = resolveBoundedRoll(options?.roll, table.sides);
  const command = getTableEntry(usedRoll, table);

  if (
    command === TreasureSwordPrimaryAbilityCommand.RollTwice &&
    variant === 'standard'
  ) {
    const nodeId = primaryAbilityNodeId(slotKey, rollIndex);
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: nodeId,
      event: {
        kind: 'treasureSwordPrimaryAbility',
        result: {
          kind: 'instruction',
          instruction: 'rollTwice',
          roll: usedRoll,
          note: 'Roll twice on this table (ignore 93-00).',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordPrimaryAbilityPending({
          slotKey: `${slotKey}:a`,
          rollIndex,
          tableVariant: 'restricted',
        }),
        buildSwordPrimaryAbilityPending({
          slotKey: `${slotKey}:b`,
          rollIndex,
          tableVariant: 'restricted',
        }),
      ],
    };
    return node;
  }

  if (command === TreasureSwordPrimaryAbilityCommand.ExtraordinaryPower) {
    const nodeId = primaryAbilityNodeId(slotKey, rollIndex);
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: nodeId,
      event: {
        kind: 'treasureSwordPrimaryAbility',
        result: {
          kind: 'instruction',
          instruction: 'extraordinaryPower',
          roll: usedRoll,
          note: 'Roll on the Extraordinary Power table.',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:extra`,
          rollIndex,
          tableVariant: 'standard',
        }),
      ],
    };
    return node;
  }

  const ability = toTreasureSwordPrimaryAbility(command);
  if (ability === undefined) {
    throw new Error(`Unsupported sword primary ability command: ${command}`);
  }
  const result: TreasureSwordPrimaryAbilityResult = {
    kind: 'ability',
    ability,
    rolls: [usedRoll],
    multiplier: 1,
    description: describeSwordPrimaryAbility(ability, 1),
    tableVariant: variant,
  };
  return {
    type: 'event',
    roll: usedRoll,
    id: primaryAbilityNodeId(slotKey, rollIndex),
    event: {
      kind: 'treasureSwordPrimaryAbility',
      result,
    } as OutcomeEvent,
  };
}

export function buildSwordPrimaryAbilityPending(options: {
  slotKey: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
}): PendingRoll {
  const { slotKey, rollIndex, tableVariant } = options;
  const variant = tableVariant ?? 'standard';
  const tableName =
    variant === 'restricted'
      ? 'treasureSwordPrimaryAbilityRestricted'
      : 'treasureSwordPrimaryAbility';
  return createPendingRoll({
    kind: tableName,
    id: primaryAbilityNodeId(slotKey, rollIndex),
    args: {
      kind: 'treasureSwordPrimaryAbility',
      slotKey,
      rollIndex,
      tableVariant: variant,
    },
  });
}
