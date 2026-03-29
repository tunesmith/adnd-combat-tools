import type { DungeonTableDefinition } from '../../types';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../../shared';
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
import {
  createTreasureMagicContextHandlers,
  createTreasureMagicEventPreviewBuilder,
} from '../shared';
import { getPendingRollArgs } from '../../../domain/pendingRoll';
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
import {
  buildTreasureSwordAlignmentEventPreview,
  buildTreasureSwordExtraordinaryPowerEventPreview,
  buildTreasureSwordPrimaryAbilityEventPreview,
  buildTreasureSwordSpecialPurposeEventPreview,
  buildTreasureSwordSpecialPurposePowerEventPreview,
  buildTreasureSwordUnusualEventPreview,
  readSwordExtraordinaryPowerContext,
  readSwordPrimaryAbilityContext,
  readTreasureSwordContext,
} from './swordsManifestHelpers';

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
      const options = readTreasureSwordContext(
        getPendingRollArgs(pending),
        ancestors
      );
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
      const parsed = readSwordPrimaryAbilityContext(
        getPendingRollArgs(pending)
      );
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
      const parsed = readSwordPrimaryAbilityContext(
        getPendingRollArgs(pending)
      );
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
    resolvePending: (pending) => {
      const parsed = readSwordExtraordinaryPowerContext(
        getPendingRollArgs(pending)
      );
      return resolveTreasureSwordExtraordinaryPower({
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
    resolvePending: (pending) => {
      const parsed = readSwordExtraordinaryPowerContext(
        getPendingRollArgs(pending)
      );
      return resolveTreasureSwordExtraordinaryPower({
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
    resolvePending: (pending) => {
      const parsed = readTableContextOfKind(
        getPendingRollArgs(pending),
        'treasureSwordDragonSlayerColor'
      );
      return resolveTreasureSwordDragonSlayerColor({
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
    resolvePending: (pending) => {
      const parsed = readTableContextOfKind(
        getPendingRollArgs(pending),
        'treasureSwordSpecialPurpose'
      );
      return resolveTreasureSwordSpecialPurpose({
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
    resolvePending: (pending) => {
      const parsed = readTableContextOfKind(
        getPendingRollArgs(pending),
        'treasureSwordSpecialPurposePower'
      );
      return resolveTreasureSwordSpecialPurposePower({
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
