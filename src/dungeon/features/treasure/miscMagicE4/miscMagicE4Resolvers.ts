import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { TreasureNecklaceOfPrayerBeadsResult } from '../../../domain/treasureValueTypes';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  miscMagicE4Followups,
  treasureMiscMagicE4,
  TreasureMiscMagicE4,
} from './miscMagicE4Table';
import { buildTreasureEvent } from '../shared';
import type {
  TreasureManualOfGolems,
  TreasureMedallionRange,
  TreasureNecklaceOfMissiles,
  TreasurePearlOfPowerRecall,
  TreasurePearlOfPowerRecallResult,
  TreasurePearlOfWisdomOutcome,
  TreasurePeriaptPoisonBonus,
  TreasurePhylacteryLongYearsOutcome,
  TreasureQuaalFeatherToken,
} from './miscMagicE4Subtables';
import {
  resolvePearlRecallResult,
  pearlOfPowerEffectFollowups,
  treasureManualOfGolems,
  treasureMedallionRange,
  treasureNecklaceOfMissiles,
  treasureNecklacePrayerBeads,
  treasurePearlOfPowerEffect,
  treasurePearlOfPowerRecall,
  treasurePearlOfWisdom,
  treasurePeriaptPoisonBonus,
  treasurePhylacteryLongYears,
  treasureQuaalFeatherToken,
} from './miscMagicE4Subtables';
import type { TreasurePearlOfPowerEffect } from './miscMagicE4Subtables';

type TreasureMiscMagicE4ResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function resolveTreasureMiscMagicE4(
  options?: TreasureMiscMagicE4ResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE4.sides);
  const command: TreasureMiscMagicE4 = getTableEntry(
    usedRoll,
    treasureMiscMagicE4
  );
  const rollIndex = options?.rollIndex;
  const children: DungeonOutcomeNode[] = [];
  const followup = miscMagicE4Followups.find(
    (candidate) => candidate.result === command
  );
  if (followup) {
    children.push({
      type: 'pending-roll',
      table: followup.table,
      id: rollIndex ? `${followup.table}:${rollIndex}` : undefined,
    });
  } else if (command === TreasureMiscMagicE4.NecklaceOfPrayerBeads) {
    children.push(resolveTreasureNecklaceOfPrayerBeads());
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: buildTreasureEvent(
      'treasureMiscMagicE4',
      command,
      usedRoll,
      options
    ),
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureManualOfGolems(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureManualOfGolems.sides);
  const command: TreasureManualOfGolems = getTableEntry(
    usedRoll,
    treasureManualOfGolems
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureManualOfGolems',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureMedallionRange(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMedallionRange.sides);
  const command: TreasureMedallionRange = getTableEntry(
    usedRoll,
    treasureMedallionRange
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureMedallionRange',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureNecklaceOfMissiles(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureNecklaceOfMissiles.sides);
  const command: TreasureNecklaceOfMissiles = getTableEntry(
    usedRoll,
    treasureNecklaceOfMissiles
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureNecklaceOfMissiles',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePearlOfPowerEffect(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePearlOfPowerEffect.sides);
  const command: TreasurePearlOfPowerEffect = getTableEntry(
    usedRoll,
    treasurePearlOfPowerEffect
  );
  const children: DungeonOutcomeNode[] = [];
  const followup = pearlOfPowerEffectFollowups.find(
    (candidate) => candidate.result === command
  );
  if (followup) {
    children.push({
      type: 'pending-roll',
      table: followup.table,
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePearlOfPowerEffect',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasurePearlOfPowerRecall(options?: {
  roll?: number;
  d6?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePearlOfPowerRecall.sides);
  const command: TreasurePearlOfPowerRecall = getTableEntry(
    usedRoll,
    treasurePearlOfPowerRecall
  );
  const d6Roll = options?.d6 ?? rollDice(6);
  const result: TreasurePearlOfPowerRecallResult = resolvePearlRecallResult(
    command,
    () => d6Roll
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePearlOfPowerRecall',
      result,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePearlOfWisdom(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePearlOfWisdom.sides);
  const command: TreasurePearlOfWisdomOutcome = getTableEntry(
    usedRoll,
    treasurePearlOfWisdom
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePearlOfWisdom',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePeriaptProofAgainstPoison(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePeriaptPoisonBonus.sides);
  const command: TreasurePeriaptPoisonBonus = getTableEntry(
    usedRoll,
    treasurePeriaptPoisonBonus
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePeriaptProofAgainstPoison',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasurePhylacteryLongYears(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasurePhylacteryLongYears.sides);
  const command: TreasurePhylacteryLongYearsOutcome = getTableEntry(
    usedRoll,
    treasurePhylacteryLongYears
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasurePhylacteryLongYears',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureNecklaceOfPrayerBeads(options?: {
  totalRoll?: number;
  specialCountRoll?: number;
  specialRolls?: number[];
}): DungeonOutcomeNode {
  const totalBase = options?.totalRoll ?? rollDice(6);
  const totalBeads = 24 + totalBase;
  const semiPrecious = Math.round(totalBeads * 0.6);
  const fancy = totalBeads - semiPrecious;

  const countBase = options?.specialCountRoll ?? rollDice(4);
  const specialCount = countBase + 2;
  const specialRolls: number[] = options?.specialRolls ?? [];
  const specialBeads: TreasureNecklaceOfPrayerBeadsResult['specialBeads'] =
    Array.from({ length: specialCount }, (_, index) => {
      const roll =
        specialRolls[index] ?? rollDice(treasureNecklacePrayerBeads.sides);
      const type = getTableEntry(roll, treasureNecklacePrayerBeads);
      return { type, roll };
    });

  return {
    type: 'event',
    roll: totalBeads,
    event: {
      kind: 'treasureNecklaceOfPrayerBeads',
      result: {
        totalBeads,
        semiPrecious,
        fancy,
        specialBeads,
      },
    } as OutcomeEvent,
  };
}

export function resolveTreasureQuaalFeatherToken(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureQuaalFeatherToken.sides);
  const command: TreasureQuaalFeatherToken = getTableEntry(
    usedRoll,
    treasureQuaalFeatherToken
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureQuaalFeatherToken',
      result: command,
    } as OutcomeEvent,
  };
}
