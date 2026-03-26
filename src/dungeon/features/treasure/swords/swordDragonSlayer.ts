import { getTableEntry } from '../../../helpers/dungeonLookup';
import { createDungeonRandomId } from '../../../helpers/dungeonRandom';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  PendingRoll,
} from '../../../domain/outcome';
import type { TreasureSwordAlignment } from './swordsAlignmentTable';
import { dragonSlayerColorNodeId } from './swordNodeIds';
import { resolveBoundedRoll } from './swordResolverShared';
import {
  DRAGON_SLAYER_COLOR_DETAILS,
  type TreasureSwordDragonSlayerColor,
  type TreasureSwordDragonSlayerColorResult,
  dragonSlayerColorTableForAlignment,
} from './swordsTables';

export function resolveTreasureSwordDragonSlayerColor(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey = options?.slotKey ?? createDungeonRandomId('dragon-slayer');
  const table = dragonSlayerColorTableForAlignment(options?.alignment);
  const usedRoll = resolveBoundedRoll(options?.roll, table.sides);
  const command: TreasureSwordDragonSlayerColor = getTableEntry(
    usedRoll,
    table
  );
  const detail = DRAGON_SLAYER_COLOR_DETAILS[command];
  const result: TreasureSwordDragonSlayerColorResult = {
    kind: 'dragonSlayerColor',
    color: command,
    rolls: [usedRoll],
    label: detail.label,
    alignment: detail.alignment,
  };
  return {
    type: 'event',
    roll: usedRoll,
    id: dragonSlayerColorNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordDragonSlayerColor',
      result,
    } as OutcomeEvent,
  };
}

export function buildSwordDragonSlayerColorPending(options: {
  slotKey: string;
  rollIndex?: number;
  alignment?: TreasureSwordAlignment;
  alignmentReady?: boolean;
}): PendingRoll {
  const { slotKey, rollIndex, alignment, alignmentReady } = options;
  return {
    type: 'pending-roll',
    table: 'treasureSwordDragonSlayerColor',
    id: dragonSlayerColorNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordDragonSlayerColor',
      slotKey,
      rollIndex,
      alignment,
      alignmentReady: alignmentReady ?? alignment !== undefined,
    },
  };
}
