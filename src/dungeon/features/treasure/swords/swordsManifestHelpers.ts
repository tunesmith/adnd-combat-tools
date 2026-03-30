import { buildEventPreviewFromFactory } from '../../shared';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { readTableContextOfKind } from '../../../helpers/tableContext';
import type { TableContext } from '../../../../types/dungeon';
import type { TreasureSword } from './swordsTables';
import type { TreasureSwordAlignment } from './swordsAlignmentTable';
import { parseSwordNodeContextFromId } from './swordNodeIds';
import {
  buildTreasureSwordAlignmentChaoticPreview,
  buildTreasureSwordAlignmentLawfulPreview,
  buildTreasureSwordAlignmentPreview,
  buildTreasureSwordExtraordinaryPowerPreview,
  buildTreasureSwordPrimaryAbilityPreview,
  buildTreasureSwordSpecialPurposePowerPreview,
  buildTreasureSwordSpecialPurposePreview,
  buildTreasureSwordUnusualPreview,
} from './swordsRender';

function findSwordFromAncestors(
  ancestors: OutcomeEventNode[]
): TreasureSword | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor || ancestor.type !== 'event') continue;
    if (ancestor.event.kind === 'treasureSwords') {
      return ancestor.event.result;
    }
  }
  return undefined;
}

function buildTreasureSwordPreviewContext(
  ancestors: OutcomeEventNode[]
): Extract<TableContext, { kind: 'treasureSword' }> | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor || ancestor.type !== 'event') continue;
    if (ancestor.event.kind !== 'treasureSwords') continue;
    return {
      kind: 'treasureSword',
      sword: ancestor.event.result,
      rollIndex: ancestor.event.rollIndex,
    };
  }
  return undefined;
}

export function readTreasureSwordContext(
  context: unknown,
  ancestors: OutcomeEventNode[]
): {
  sword?: TreasureSword;
  rollIndex?: number;
  alignmentRoll?: number;
  languageRolls?: number[];
  primaryAbilityRolls?: number[];
  extraordinaryPowerRolls?: number[];
  dragonSlayerColorRoll?: number;
} {
  const swordContext = readTableContextOfKind(context, 'treasureSword');
  if (swordContext) {
    return {
      sword: swordContext.sword ?? findSwordFromAncestors(ancestors),
      rollIndex: swordContext.rollIndex,
      alignmentRoll: swordContext.alignmentRoll,
      languageRolls: swordContext.languageRolls
        ? [...swordContext.languageRolls]
        : undefined,
      primaryAbilityRolls: swordContext.primaryAbilityRolls
        ? [...swordContext.primaryAbilityRolls]
        : undefined,
      extraordinaryPowerRolls: swordContext.extraordinaryPowerRolls
        ? [...swordContext.extraordinaryPowerRolls]
        : undefined,
      dragonSlayerColorRoll: swordContext.dragonSlayerColorRoll,
    };
  }
  return { sword: findSwordFromAncestors(ancestors) };
}

export function readSwordPrimaryAbilityContext(context: unknown): {
  slotKey?: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
} {
  const candidate = readTableContextOfKind(
    context,
    'treasureSwordPrimaryAbility'
  );
  if (!candidate) return {};
  let tableVariant: 'standard' | 'restricted' | undefined;
  if (
    candidate.tableVariant === 'restricted' ||
    candidate.ignoreHigh === true
  ) {
    tableVariant = 'restricted';
  } else if (candidate.tableVariant === 'standard') {
    tableVariant = 'standard';
  }
  return {
    slotKey: candidate.slotKey,
    rollIndex: candidate.rollIndex,
    tableVariant,
  };
}

export function readSwordExtraordinaryPowerContext(context: unknown): {
  slotKey?: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
  alignment?: TreasureSwordAlignment;
} {
  const candidate = readTableContextOfKind(
    context,
    'treasureSwordExtraordinaryPower'
  );
  if (!candidate) return {};
  let tableVariant: 'standard' | 'restricted' | undefined;
  if (
    candidate.tableVariant === 'restricted' ||
    candidate.ignoreHigh === true
  ) {
    tableVariant = 'restricted';
  } else if (candidate.tableVariant === 'standard') {
    tableVariant = 'standard';
  }
  return {
    slotKey: candidate.slotKey,
    rollIndex: candidate.rollIndex,
    tableVariant,
    alignment: candidate.alignment,
  };
}

function buildSwordPrimaryAbilityPreviewContext(
  node: OutcomeEventNode,
  variant: 'standard' | 'restricted'
): TableContext | undefined {
  const info = parseSwordNodeContextFromId(
    node.id,
    'treasureSwordPrimaryAbility:'
  );
  if (!info.slotKey && info.rollIndex === undefined) {
    return undefined;
  }
  return {
    kind: 'treasureSwordPrimaryAbility',
    slotKey: info.slotKey,
    rollIndex: info.rollIndex,
    tableVariant: variant,
  };
}

function buildSwordExtraordinaryPowerPreviewContext(
  node: OutcomeEventNode,
  variant: 'standard' | 'restricted'
): TableContext | undefined {
  const info = parseSwordNodeContextFromId(
    node.id,
    'treasureSwordExtraordinaryPower:'
  );
  if (!info.slotKey && info.rollIndex === undefined) {
    return undefined;
  }
  return {
    kind: 'treasureSwordExtraordinaryPower',
    slotKey: info.slotKey,
    rollIndex: info.rollIndex,
    tableVariant: variant,
  };
}

export function buildTreasureSwordPrimaryAbilityEventPreview(
  node: OutcomeEventNode
) {
  if (node.event.kind !== 'treasureSwordPrimaryAbility') {
    return undefined;
  }
  const result = node.event.result;
  const variant =
    result.kind === 'ability'
      ? result.tableVariant
      : result.tableVariant ?? 'standard';
  const tableId =
    variant === 'restricted'
      ? 'treasureSwordPrimaryAbilityRestricted'
      : 'treasureSwordPrimaryAbility';
  return buildEventPreviewFromFactory(
    node,
    buildTreasureSwordPrimaryAbilityPreview,
    {
      tableId,
      context: buildSwordPrimaryAbilityPreviewContext(node, variant),
      autoCollapse: result.kind === 'ability' || result.kind === 'instruction',
    }
  );
}

export function buildTreasureSwordExtraordinaryPowerEventPreview(
  node: OutcomeEventNode
) {
  if (node.event.kind !== 'treasureSwordExtraordinaryPower') {
    return undefined;
  }
  const result = node.event.result;
  const variant =
    result.kind === 'power'
      ? result.tableVariant
      : result.tableVariant ?? 'standard';
  const tableId =
    variant === 'restricted'
      ? 'treasureSwordExtraordinaryPowerRestricted'
      : 'treasureSwordExtraordinaryPower';
  return buildEventPreviewFromFactory(
    node,
    buildTreasureSwordExtraordinaryPowerPreview,
    {
      tableId,
      context: buildSwordExtraordinaryPowerPreviewContext(node, variant),
      autoCollapse: result.kind === 'power' || result.kind === 'instruction',
    }
  );
}

export function buildTreasureSwordSpecialPurposeEventPreview(
  node: OutcomeEventNode
) {
  if (node.event.kind !== 'treasureSwordSpecialPurpose') {
    return undefined;
  }
  const info = parseSwordNodeContextFromId(
    node.id,
    'treasureSwordSpecialPurpose:'
  );
  return buildEventPreviewFromFactory(
    node,
    buildTreasureSwordSpecialPurposePreview,
    {
      context: {
        kind: 'treasureSwordSpecialPurpose',
        slotKey: info.slotKey,
        rollIndex: info.rollIndex,
        alignment: node.event.result.alignment,
      },
      autoCollapse: true,
    }
  );
}

export function buildTreasureSwordSpecialPurposePowerEventPreview(
  node: OutcomeEventNode
) {
  if (node.event.kind !== 'treasureSwordSpecialPurposePower') {
    return undefined;
  }
  const info = parseSwordNodeContextFromId(
    node.id,
    'treasureSwordSpecialPurposePower:'
  );
  return buildEventPreviewFromFactory(
    node,
    buildTreasureSwordSpecialPurposePowerPreview,
    {
      context: {
        kind: 'treasureSwordSpecialPurposePower',
        slotKey: info.slotKey,
        rollIndex: info.rollIndex,
      },
      autoCollapse: true,
    }
  );
}

export function buildTreasureSwordAlignmentEventPreview(
  node: OutcomeEventNode
) {
  if (node.event.kind !== 'treasureSwordAlignment') {
    return undefined;
  }
  if (node.event.result.source === 'fixed') {
    return undefined;
  }
  if (node.event.result.source === 'chaotic') {
    return buildEventPreviewFromFactory(
      node,
      buildTreasureSwordAlignmentChaoticPreview,
      {
        tableId: 'treasureSwordAlignmentChaotic',
      }
    );
  }
  if (node.event.result.source === 'lawful') {
    return buildEventPreviewFromFactory(
      node,
      buildTreasureSwordAlignmentLawfulPreview,
      {
        tableId: 'treasureSwordAlignmentLawful',
      }
    );
  }
  return buildEventPreviewFromFactory(node, buildTreasureSwordAlignmentPreview);
}

export function buildTreasureSwordUnusualEventPreview(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
) {
  if (node.event.kind !== 'treasureSwordUnusual') {
    return undefined;
  }
  return buildEventPreviewFromFactory(node, buildTreasureSwordUnusualPreview, {
    context: buildTreasureSwordPreviewContext(ancestors),
  });
}
