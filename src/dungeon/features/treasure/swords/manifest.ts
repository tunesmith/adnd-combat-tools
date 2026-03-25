import type { DungeonTableDefinition } from '../../types';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../../shared';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { TableContext } from '../../../../types/dungeon';
import { readTableContextOfKind } from '../../../helpers/tableContext';
import {
  resolveTreasureSwords,
  resolveTreasureSwordAlignment,
  resolveTreasureSwordDragonSlayerColor,
  resolveTreasureSwordExtraordinaryPower,
  resolveTreasureSwordKind,
  resolveTreasureSwordPrimaryAbility,
  resolveTreasureSwordSpecialPurpose,
  resolveTreasureSwordSpecialPurposePower,
  resolveTreasureSwordUnusual,
} from './swordsResolvers';
import type { TreasureSword } from './swordsTables';
import type { TreasureSwordAlignment } from './swordsAlignmentTable';
import {
  createTreasureMagicContextHandlers,
  createTreasureMagicEventPreviewBuilder,
} from '../shared';
import {
  buildTreasureSwordsPreview,
  renderTreasureSwordsCompact,
  renderTreasureSwordsDetail,
  buildTreasureSwordAlignmentChaoticPreview,
  buildTreasureSwordAlignmentLawfulPreview,
  buildTreasureSwordAlignmentPreview,
  buildTreasureSwordDragonSlayerColorPreview,
  buildTreasureSwordExtraordinaryPowerPreview,
  buildTreasureSwordKindPreview,
  buildTreasureSwordPrimaryAbilityPreview,
  buildTreasureSwordSpecialPurposePowerPreview,
  buildTreasureSwordSpecialPurposePreview,
  buildTreasureSwordUnusualPreview,
  renderTreasureSwordAlignmentCompact,
  renderTreasureSwordAlignmentDetail,
  renderTreasureSwordDragonSlayerColorCompact,
  renderTreasureSwordDragonSlayerColorDetail,
  renderTreasureSwordExtraordinaryPowerCompact,
  renderTreasureSwordExtraordinaryPowerDetail,
  renderTreasureSwordKindCompact,
  renderTreasureSwordKindDetail,
  renderTreasureSwordPrimaryAbilityCompact,
  renderTreasureSwordPrimaryAbilityDetail,
  renderTreasureSwordSpecialPurposeCompact,
  renderTreasureSwordSpecialPurposeDetail,
  renderTreasureSwordSpecialPurposePowerCompact,
  renderTreasureSwordSpecialPurposePowerDetail,
  renderTreasureSwordUnusualCompact,
  renderTreasureSwordUnusualDetail,
} from './swordsRender';
import { postProcessSwordsOutcomeTree } from './swordsOutcomePostProcessor';

type TreasureSwordPrimaryAbilityOptions = Parameters<
  typeof resolveTreasureSwordPrimaryAbility
>[0];

type TreasureSwordExtraordinaryPowerOptions = Parameters<
  typeof resolveTreasureSwordExtraordinaryPower
>[0];

type TreasureSwordAlignmentOptions = Parameters<
  typeof resolveTreasureSwordAlignment
>[0];

const treasureSwordsHandlers = createTreasureMagicContextHandlers(
  resolveTreasureSwords
);

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

function readTreasureSwordContext(
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

function readSwordPrimaryAbilityContext(context: unknown): {
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

function readSwordExtraordinaryPowerContext(context: unknown): {
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

function parseNodeContextFromId(
  id: string | undefined,
  prefix: string
): { slotKey?: string; rollIndex?: number } {
  if (!id || !id.startsWith(prefix)) {
    return {};
  }
  const remainder = id.slice(prefix.length);
  if (!remainder) return {};
  const colonIndex = remainder.indexOf(':');
  if (colonIndex === -1) {
    return { slotKey: remainder };
  }
  const maybeIndex = remainder.slice(0, colonIndex);
  const potentialSlot = remainder.slice(colonIndex + 1);
  const parsedIndex = Number.parseInt(maybeIndex, 10);
  if (Number.isNaN(parsedIndex)) {
    return { slotKey: remainder };
  }
  return {
    slotKey: potentialSlot,
    rollIndex: parsedIndex,
  };
}

function buildSwordPrimaryAbilityPreviewContext(
  node: OutcomeEventNode,
  variant: 'standard' | 'restricted'
): TableContext | undefined {
  const info = parseNodeContextFromId(node.id, 'treasureSwordPrimaryAbility:');
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
  const info = parseNodeContextFromId(
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

function buildTreasureSwordPrimaryAbilityEventPreview(node: OutcomeEventNode) {
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

function buildTreasureSwordExtraordinaryPowerEventPreview(
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

function buildTreasureSwordSpecialPurposeEventPreview(node: OutcomeEventNode) {
  if (node.event.kind !== 'treasureSwordSpecialPurpose') {
    return undefined;
  }
  const info = parseNodeContextFromId(node.id, 'treasureSwordSpecialPurpose:');
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

function buildTreasureSwordSpecialPurposePowerEventPreview(
  node: OutcomeEventNode
) {
  if (node.event.kind !== 'treasureSwordSpecialPurposePower') {
    return undefined;
  }
  const info = parseNodeContextFromId(
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

function buildTreasureSwordAlignmentEventPreview(node: OutcomeEventNode) {
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

function buildTreasureSwordUnusualEventPreview(
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

const resolveTreasureSwordPrimaryAbilityRestricted = (
  options?: TreasureSwordPrimaryAbilityOptions
) =>
  resolveTreasureSwordPrimaryAbility({
    ...(options ?? {}),
    tableVariant: 'restricted',
  });

const resolveTreasureSwordExtraordinaryPowerRestricted = (
  options?: TreasureSwordExtraordinaryPowerOptions
) =>
  resolveTreasureSwordExtraordinaryPower({
    ...(options ?? {}),
    tableVariant: 'restricted',
  });

const resolveTreasureSwordAlignmentChaotic = (
  options?: TreasureSwordAlignmentOptions
) =>
  resolveTreasureSwordAlignment({
    ...(options ?? {}),
    variant: 'chaotic',
  });

const resolveTreasureSwordAlignmentLawful = (
  options?: TreasureSwordAlignmentOptions
) =>
  resolveTreasureSwordAlignment({
    ...(options ?? {}),
    variant: 'lawful',
  });

export const swordsTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureSwords',
    heading: 'Swords (Table G)',
    resolver: wrapResolver(resolveTreasureSwords),
    renderers: {
      renderDetail: renderTreasureSwordsDetail,
      renderCompact: renderTreasureSwordsCompact,
    },
    buildPreview: buildTreasureSwordsPreview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureSwords',
      buildTreasureSwordsPreview
    ),
    postProcessOutcome: postProcessSwordsOutcomeTree,
    ...treasureSwordsHandlers,
  },
  {
    id: 'treasureSwordKind',
    heading: 'Sword Type',
    resolver: wrapResolver(resolveTreasureSwordKind),
    renderers: {
      renderDetail: renderTreasureSwordKindDetail,
      renderCompact: renderTreasureSwordKindCompact,
    },
    buildPreview: buildTreasureSwordKindPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureSwordKind'
        ? buildEventPreviewFromFactory(node, buildTreasureSwordKindPreview)
        : undefined,
    resolvePending: () => resolveTreasureSwordKind({}),
  },
  markContextualResolution({
    id: 'treasureSwordUnusual',
    heading: 'Sword Unusual Traits',
    resolver: wrapResolver(resolveTreasureSwordUnusual),
    renderers: {
      renderDetail: renderTreasureSwordUnusualDetail,
      renderCompact: renderTreasureSwordUnusualCompact,
    },
    buildPreview: buildTreasureSwordUnusualPreview,
    buildEventPreview: buildTreasureSwordUnusualEventPreview,
    registry: ({ roll, context }) => {
      const parsed = readTreasureSwordContext(context, []);
      return resolveTreasureSwordUnusual({
        roll,
        sword: parsed.sword,
        rollIndex: parsed.rollIndex,
        languageRolls: parsed.languageRolls,
        primaryAbilityRolls: parsed.primaryAbilityRolls,
        extraordinaryPowerRolls: parsed.extraordinaryPowerRolls,
        dragonSlayerColorRoll: parsed.dragonSlayerColorRoll,
      });
    },
    resolvePending: (pending, ancestors) => {
      const options = readTreasureSwordContext(pending.context, ancestors);
      return resolveTreasureSwordUnusual(options);
    },
  }),
  markContextualResolution({
    id: 'treasureSwordPrimaryAbility',
    heading: 'Primary Ability',
    resolver: wrapResolver(resolveTreasureSwordPrimaryAbility),
    renderers: {
      renderDetail: renderTreasureSwordPrimaryAbilityDetail,
      renderCompact: renderTreasureSwordPrimaryAbilityCompact,
    },
    buildPreview: buildTreasureSwordPrimaryAbilityPreview,
    buildEventPreview: buildTreasureSwordPrimaryAbilityEventPreview,
    registry: ({ roll, context }) => {
      const parsed = readSwordPrimaryAbilityContext(context);
      return resolveTreasureSwordPrimaryAbility({
        roll,
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: parsed.tableVariant ?? 'standard',
      });
    },
    resolvePending: (pending) => {
      const parsed = readSwordPrimaryAbilityContext(pending.context);
      return resolveTreasureSwordPrimaryAbility({
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: parsed.tableVariant ?? 'standard',
      });
    },
  }),
  markContextualResolution({
    id: 'treasureSwordPrimaryAbilityRestricted',
    heading: 'Primary Ability (01-92)',
    resolver: wrapResolver(resolveTreasureSwordPrimaryAbilityRestricted),
    renderers: {
      renderDetail: renderTreasureSwordPrimaryAbilityDetail,
      renderCompact: renderTreasureSwordPrimaryAbilityCompact,
    },
    buildPreview: buildTreasureSwordPrimaryAbilityPreview,
    registry: ({ roll, context }) => {
      const parsed = readSwordPrimaryAbilityContext(context);
      return resolveTreasureSwordPrimaryAbility({
        roll,
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: 'restricted',
      });
    },
    resolvePending: (pending) => {
      const parsed = readSwordPrimaryAbilityContext(pending.context);
      return resolveTreasureSwordPrimaryAbility({
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: 'restricted',
      });
    },
  }),
  markContextualResolution({
    id: 'treasureSwordExtraordinaryPower',
    heading: 'Extraordinary Power',
    resolver: wrapResolver(resolveTreasureSwordExtraordinaryPower),
    renderers: {
      renderDetail: renderTreasureSwordExtraordinaryPowerDetail,
      renderCompact: renderTreasureSwordExtraordinaryPowerCompact,
    },
    buildPreview: buildTreasureSwordExtraordinaryPowerPreview,
    buildEventPreview: buildTreasureSwordExtraordinaryPowerEventPreview,
    registry: ({ roll, context }) => {
      const parsed = readSwordExtraordinaryPowerContext(context);
      return resolveTreasureSwordExtraordinaryPower({
        roll,
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: parsed.tableVariant ?? 'standard',
        alignment: parsed.alignment,
      });
    },
  }),
  markContextualResolution({
    id: 'treasureSwordExtraordinaryPowerRestricted',
    heading: 'Extraordinary Power (01-97)',
    resolver: wrapResolver(resolveTreasureSwordExtraordinaryPowerRestricted),
    renderers: {
      renderDetail: renderTreasureSwordExtraordinaryPowerDetail,
      renderCompact: renderTreasureSwordExtraordinaryPowerCompact,
    },
    buildPreview: buildTreasureSwordExtraordinaryPowerPreview,
    registry: ({ roll, context }) => {
      const parsed = readSwordExtraordinaryPowerContext(context);
      return resolveTreasureSwordExtraordinaryPower({
        roll,
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: 'restricted',
        alignment: parsed.alignment,
      });
    },
  }),
  markContextualResolution({
    id: 'treasureSwordDragonSlayerColor',
    heading: 'Dragon Slayer Target',
    resolver: wrapResolver(resolveTreasureSwordDragonSlayerColor),
    renderers: {
      renderDetail: renderTreasureSwordDragonSlayerColorDetail,
      renderCompact: renderTreasureSwordDragonSlayerColorCompact,
    },
    buildPreview: buildTreasureSwordDragonSlayerColorPreview,
    registry: ({ roll, context }) => {
      const parsed = readTableContextOfKind(
        context,
        'treasureSwordDragonSlayerColor'
      );
      return resolveTreasureSwordDragonSlayerColor({
        roll,
        slotKey: parsed?.slotKey,
        rollIndex: parsed?.rollIndex,
        alignment: parsed?.alignment,
      });
    },
  }),
  markContextualResolution({
    id: 'treasureSwordSpecialPurpose',
    heading: 'Sword Special Purpose',
    resolver: wrapResolver(resolveTreasureSwordSpecialPurpose),
    renderers: {
      renderDetail: renderTreasureSwordSpecialPurposeDetail,
      renderCompact: renderTreasureSwordSpecialPurposeCompact,
    },
    buildPreview: buildTreasureSwordSpecialPurposePreview,
    buildEventPreview: buildTreasureSwordSpecialPurposeEventPreview,
    registry: ({ roll, context }) => {
      const parsed = readTableContextOfKind(
        context,
        'treasureSwordSpecialPurpose'
      );
      return resolveTreasureSwordSpecialPurpose({
        roll,
        slotKey: parsed?.slotKey,
        rollIndex: parsed?.rollIndex,
        parentSlotKey: parsed?.parentSlotKey,
        alignment: parsed?.alignment,
      });
    },
  }),
  markContextualResolution({
    id: 'treasureSwordSpecialPurposePower',
    heading: 'Sword Special Purpose Power',
    resolver: wrapResolver(resolveTreasureSwordSpecialPurposePower),
    renderers: {
      renderDetail: renderTreasureSwordSpecialPurposePowerDetail,
      renderCompact: renderTreasureSwordSpecialPurposePowerCompact,
    },
    buildPreview: buildTreasureSwordSpecialPurposePowerPreview,
    buildEventPreview: buildTreasureSwordSpecialPurposePowerEventPreview,
    registry: ({ roll, context }) => {
      const parsed = readTableContextOfKind(
        context,
        'treasureSwordSpecialPurposePower'
      );
      return resolveTreasureSwordSpecialPurposePower({
        roll,
        slotKey: parsed?.slotKey,
        rollIndex: parsed?.rollIndex,
        parentSlotKey: parsed?.parentSlotKey,
        alignment: parsed?.alignment,
      });
    },
  }),
  {
    id: 'treasureSwordAlignment',
    heading: 'Sword Alignment',
    resolver: wrapResolver(resolveTreasureSwordAlignment),
    renderers: {
      renderDetail: renderTreasureSwordAlignmentDetail,
      renderCompact: renderTreasureSwordAlignmentCompact,
    },
    buildPreview: buildTreasureSwordAlignmentPreview,
    buildEventPreview: buildTreasureSwordAlignmentEventPreview,
    resolvePending: () =>
      resolveTreasureSwordAlignment({ variant: 'standard' }),
  },
  {
    id: 'treasureSwordAlignmentChaotic',
    heading: 'Sword Alignment (Chaotic)',
    resolver: wrapResolver(resolveTreasureSwordAlignmentChaotic),
    renderers: {
      renderDetail: renderTreasureSwordAlignmentDetail,
      renderCompact: renderTreasureSwordAlignmentCompact,
    },
    buildPreview: buildTreasureSwordAlignmentChaoticPreview,
    resolvePending: () => resolveTreasureSwordAlignment({ variant: 'chaotic' }),
  },
  {
    id: 'treasureSwordAlignmentLawful',
    heading: 'Sword Alignment (Lawful)',
    resolver: wrapResolver(resolveTreasureSwordAlignmentLawful),
    renderers: {
      renderDetail: renderTreasureSwordAlignmentDetail,
      renderCompact: renderTreasureSwordAlignmentCompact,
    },
    buildPreview: buildTreasureSwordAlignmentLawfulPreview,
    resolvePending: () => resolveTreasureSwordAlignment({ variant: 'lawful' }),
  },
];
