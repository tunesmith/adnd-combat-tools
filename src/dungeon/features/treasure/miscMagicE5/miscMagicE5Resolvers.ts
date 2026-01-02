import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  RobeOfUsefulItemsResult,
} from '../../../domain/outcome';
import { treasureMiscMagicE5, TreasureMiscMagicE5 } from './miscMagicE5Table';
import { buildTreasureEvent } from '../shared';
import type {
  TreasureRobeOfTheArchmagi,
  TreasureScarabOfProtectionCurseResolution,
} from './miscMagicE5Subtables';
import {
  RobeOfUsefulItemsExtraPatch,
  ROBE_OF_USEFUL_ITEMS_BASE_PATCHES,
  TreasureScarabOfProtectionCurse,
  treasureRobeOfTheArchmagi,
  treasureRobeOfUsefulItems,
  treasureScarabOfProtectionCurse,
  treasureScarabOfProtectionCursedResolution,
} from './miscMagicE5Subtables';

type TreasureMiscMagicE5ResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function resolveTreasureMiscMagicE5(
  options?: TreasureMiscMagicE5ResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE5.sides);
  const command: TreasureMiscMagicE5 = getTableEntry(
    usedRoll,
    treasureMiscMagicE5
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureMiscMagicE5.RobeOfTheArchmagi) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRobeOfTheArchmagi',
    });
  } else if (command === TreasureMiscMagicE5.RobeOfUsefulItems) {
    children.push(resolveTreasureRobeOfUsefulItems());
  } else if (command === TreasureMiscMagicE5.ScarabOfProtection) {
    children.push({
      type: 'pending-roll',
      table: 'treasureScarabOfProtectionCurse',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: buildTreasureEvent(
      'treasureMiscMagicE5',
      command,
      usedRoll,
      options
    ),
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureRobeOfTheArchmagi(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRobeOfTheArchmagi.sides);
  const command: TreasureRobeOfTheArchmagi = getTableEntry(
    usedRoll,
    treasureRobeOfTheArchmagi
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRobeOfTheArchmagi',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRobeOfUsefulItems(options?: {
  countRolls?: number[];
  patchRolls?: number[];
}): DungeonOutcomeNode {
  const countRolls: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const preset = options?.countRolls?.[i];
    const roll = preset ?? rollDice(4);
    countRolls.push(roll);
  }
  const requestedExtraPatchCount = countRolls.reduce(
    (sum, roll) => sum + roll,
    0
  );
  const extraPatches: RobeOfUsefulItemsResult['extraPatches'] = [];
  const presetPatchRolls = options?.patchRolls ?? [];
  let remaining = requestedExtraPatchCount;
  let index = 0;
  while (remaining > 0) {
    remaining -= 1;
    const preset = presetPatchRolls[index];
    const usedRoll =
      preset !== undefined ? preset : rollDice(treasureRobeOfUsefulItems.sides);
    const patch: RobeOfUsefulItemsExtraPatch = getTableEntry(
      usedRoll,
      treasureRobeOfUsefulItems
    );
    if (patch === RobeOfUsefulItemsExtraPatch.RollTwiceMore) {
      remaining += 2;
    } else {
      extraPatches.push({
        roll: usedRoll,
        item: patch,
      });
    }
    index += 1;
  }

  const basePatches = ROBE_OF_USEFUL_ITEMS_BASE_PATCHES.map((definition) => ({
    type: definition.type,
    count: definition.count,
  }));

  const result: RobeOfUsefulItemsResult = {
    basePatches,
    extraPatchCountRolls: countRolls,
    requestedExtraPatchCount,
    extraPatches,
  };

  return {
    type: 'event',
    roll: requestedExtraPatchCount,
    event: {
      kind: 'treasureRobeOfUsefulItems',
      result,
    } as OutcomeEvent,
  };
}

export function resolveTreasureScarabOfProtectionCurse(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureScarabOfProtectionCurse.sides);
  const command: TreasureScarabOfProtectionCurse = getTableEntry(
    usedRoll,
    treasureScarabOfProtectionCurse
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureScarabOfProtectionCurse.Cursed) {
    children.push({
      type: 'pending-roll',
      table: 'treasureScarabOfProtectionCurseResolution',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureScarabOfProtectionCurse',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureScarabOfProtectionCurseResolution(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureScarabOfProtectionCursedResolution.sides);
  const command: TreasureScarabOfProtectionCurseResolution = getTableEntry(
    usedRoll,
    treasureScarabOfProtectionCursedResolution
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureScarabOfProtectionCurseResolution',
      result: command,
    } as OutcomeEvent,
  };
}
