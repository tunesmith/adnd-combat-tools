import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  PendingRoll,
} from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { TreasureSword, type TreasureSwordUnusualResult } from './swordsTables';
import {
  SWORD_ALIGNMENT_DETAILS as SWORD_ALIGNMENT,
  TreasureSwordAlignment,
  type TreasureSwordAlignmentResult,
  treasureSwordAlignment,
  treasureSwordAlignmentChaotic,
  treasureSwordAlignmentLawful,
} from './swordsAlignmentTable';

type SwordAlignmentVariant = 'standard' | 'chaotic' | 'lawful';

type SwordAlignmentInstruction =
  | { kind: 'none' }
  | {
      kind: 'fixed';
      alignment: TreasureSwordAlignment;
      source: 'holyAvenger' | 'cursedUnusual';
    }
  | { kind: 'pending'; variant: SwordAlignmentVariant };

export function resolveTreasureSwordAlignment(options?: {
  roll?: number;
  variant?: SwordAlignmentVariant;
}): DungeonOutcomeNode {
  const variant = options?.variant ?? 'standard';
  const table =
    variant === 'chaotic'
      ? treasureSwordAlignmentChaotic
      : variant === 'lawful'
      ? treasureSwordAlignmentLawful
      : treasureSwordAlignment;
  const usedRoll = options?.roll ?? rollDice(table.sides);
  const alignment: TreasureSwordAlignment = getTableEntry(usedRoll, table);
  const result = buildSwordAlignmentResult(alignment, variant);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureSwordAlignment',
      result,
    } as OutcomeEvent,
  };
}

export function appendSwordAlignmentForUnusual(
  collector: DungeonOutcomeNode[],
  options: {
    sword: TreasureSword;
    unusual: TreasureSwordUnusualResult;
    rollIndex?: number;
    alignmentRoll?: number;
  }
): void {
  const instruction = determineSwordAlignmentInstruction(
    options.sword,
    options.unusual
  );
  switch (instruction.kind) {
    case 'none':
      return;
    case 'fixed':
      collector.push(
        createFixedSwordAlignmentNode(instruction.alignment, instruction.source)
      );
      return;
    case 'pending':
      if (
        instruction.variant === 'standard' &&
        options.alignmentRoll !== undefined
      ) {
        collector.push(
          resolveTreasureSwordAlignment({
            roll: options.alignmentRoll,
            variant: instruction.variant,
          })
        );
        return;
      }
      collector.push(
        buildPendingSwordAlignmentNode(
          instruction.variant,
          options.sword,
          options.rollIndex
        )
      );
      return;
    default:
      return;
  }
}

export function createFixedSwordAlignmentNode(
  alignment: TreasureSwordAlignment,
  source: 'holyAvenger' | 'cursedUnusual'
): DungeonOutcomeNode {
  const result = buildSwordAlignmentResult(alignment, 'fixed');
  const rollValue = source === 'holyAvenger' ? 0 : 0;
  return {
    type: 'event',
    roll: rollValue,
    event: {
      kind: 'treasureSwordAlignment',
      result,
    } as OutcomeEvent,
  };
}

export function buildPendingSwordAlignmentNode(
  variant: SwordAlignmentVariant,
  sword: TreasureSword,
  rollIndex?: number
): PendingRoll {
  const tableId =
    variant === 'chaotic'
      ? 'treasureSwordAlignmentChaotic'
      : variant === 'lawful'
      ? 'treasureSwordAlignmentLawful'
      : 'treasureSwordAlignment';
  return createPendingRoll({
    kind: tableId,
    id: rollIndex ? `${tableId}:${rollIndex}` : undefined,
    args: {
      kind: 'treasureSwordAlignment',
      variant,
      sword,
    },
  });
}

function determineSwordAlignmentInstruction(
  sword: TreasureSword,
  unusual: TreasureSwordUnusualResult
): SwordAlignmentInstruction {
  if (isFixedAlignmentSword(sword)) {
    return { kind: 'none' };
  }
  if (!unusual || unusual.category !== 'intelligent') {
    return { kind: 'none' };
  }
  if (
    sword === TreasureSword.SwordPlus1Cursed ||
    sword === TreasureSword.SwordMinus2Cursed ||
    sword === TreasureSword.SwordCursedBerserking
  ) {
    return {
      kind: 'fixed',
      alignment: TreasureSwordAlignment.NeutralAbsolute,
      source: 'cursedUnusual',
    };
  }
  return { kind: 'pending', variant: 'standard' };
}

function isFixedAlignmentSword(sword: TreasureSword): boolean {
  return (
    sword === TreasureSword.SwordPlus5HolyAvenger ||
    sword === TreasureSword.SwordOfSharpness ||
    sword === TreasureSword.SwordVorpalWeapon
  );
}

function buildSwordAlignmentResult(
  alignment: TreasureSwordAlignment,
  variant: SwordAlignmentVariant | 'fixed'
): TreasureSwordAlignmentResult {
  const detail = SWORD_ALIGNMENT[alignment];
  return {
    alignment,
    label: detail.label,
    source: variant,
    requiresLanguageTable: detail.requiresLanguageTable,
  };
}
