import type { DungeonTableDefinition } from '../../types';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';
import {
  createTreasureMagicContextHandlers,
  createTreasureMagicEventPreviewBuilder,
} from '../shared';
import {
  buildTreasureRingContrarinessPreview,
  buildTreasureRingElementalCommandPreview,
  buildTreasureRingPreview,
  buildTreasureRingProtectionPreview,
  buildTreasureRingRegenerationPreview,
  buildTreasureRingTelekinesisPreview,
  buildTreasureRingThreeWishesPreview,
  buildTreasureRingWizardryPreview,
  renderTreasureRingCompact,
  renderTreasureRingContrarinessCompact,
  renderTreasureRingContrarinessDetail,
  renderTreasureRingDetail,
  renderTreasureRingElementalCommandCompact,
  renderTreasureRingElementalCommandDetail,
  renderTreasureRingProtectionCompact,
  renderTreasureRingProtectionDetail,
  renderTreasureRingRegenerationCompact,
  renderTreasureRingRegenerationDetail,
  renderTreasureRingTelekinesisCompact,
  renderTreasureRingTelekinesisDetail,
  renderTreasureRingThreeWishesCompact,
  renderTreasureRingThreeWishesDetail,
  renderTreasureRingWizardryCompact,
  renderTreasureRingWizardryDetail,
} from './ringRender';
import {
  resolveTreasureRing,
  resolveTreasureRingContrariness,
  resolveTreasureRingElementalCommand,
  resolveTreasureRingProtection,
  resolveTreasureRingRegeneration,
  resolveTreasureRingTelekinesis,
  resolveTreasureRingThreeWishes,
  resolveTreasureRingWizardry,
} from './ringResolvers';

export const ringTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureRing',
    heading: 'Ring',
    resolver: wrapResolver(resolveTreasureRing),
    ...createTreasureMagicContextHandlers(resolveTreasureRing),
    renderers: {
      renderDetail: renderTreasureRingDetail,
      renderCompact: renderTreasureRingCompact,
    },
    buildPreview: buildTreasureRingPreview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureRing',
      buildTreasureRingPreview
    ),
  },
  {
    id: 'treasureRingContrariness',
    heading: 'Contrariness Effect',
    resolver: wrapResolver(resolveTreasureRingContrariness),
    renderers: {
      renderDetail: renderTreasureRingContrarinessDetail,
      renderCompact: renderTreasureRingContrarinessCompact,
    },
    buildPreview: buildTreasureRingContrarinessPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRingContrariness'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureRingContrarinessPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureRingContrariness({}),
  },
  {
    id: 'treasureRingElementalCommand',
    heading: 'Elemental Focus',
    resolver: wrapResolver(resolveTreasureRingElementalCommand),
    renderers: {
      renderDetail: renderTreasureRingElementalCommandDetail,
      renderCompact: renderTreasureRingElementalCommandCompact,
    },
    buildPreview: buildTreasureRingElementalCommandPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRingElementalCommand'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureRingElementalCommandPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureRingElementalCommand({}),
  },
  {
    id: 'treasureRingProtection',
    heading: 'Protection Bonus',
    resolver: wrapResolver(resolveTreasureRingProtection),
    renderers: {
      renderDetail: renderTreasureRingProtectionDetail,
      renderCompact: renderTreasureRingProtectionCompact,
    },
    buildPreview: buildTreasureRingProtectionPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRingProtection'
        ? buildEventPreviewFromFactory(node, buildTreasureRingProtectionPreview)
        : undefined,
    resolvePending: () => resolveTreasureRingProtection({}),
  },
  {
    id: 'treasureRingRegeneration',
    heading: 'Regeneration Type',
    resolver: wrapResolver(resolveTreasureRingRegeneration),
    renderers: {
      renderDetail: renderTreasureRingRegenerationDetail,
      renderCompact: renderTreasureRingRegenerationCompact,
    },
    buildPreview: buildTreasureRingRegenerationPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRingRegeneration'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureRingRegenerationPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureRingRegeneration({}),
  },
  {
    id: 'treasureRingTelekinesis',
    heading: 'Telekinetic Capacity',
    resolver: wrapResolver(resolveTreasureRingTelekinesis),
    renderers: {
      renderDetail: renderTreasureRingTelekinesisDetail,
      renderCompact: renderTreasureRingTelekinesisCompact,
    },
    buildPreview: buildTreasureRingTelekinesisPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRingTelekinesis'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureRingTelekinesisPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureRingTelekinesis({}),
  },
  {
    id: 'treasureRingThreeWishes',
    heading: 'Wish Capacity',
    resolver: wrapResolver(resolveTreasureRingThreeWishes),
    renderers: {
      renderDetail: renderTreasureRingThreeWishesDetail,
      renderCompact: renderTreasureRingThreeWishesCompact,
    },
    buildPreview: buildTreasureRingThreeWishesPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRingThreeWishes'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureRingThreeWishesPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureRingThreeWishes({}),
  },
  {
    id: 'treasureRingWizardry',
    heading: 'Spell Doubling',
    resolver: wrapResolver(resolveTreasureRingWizardry),
    renderers: {
      renderDetail: renderTreasureRingWizardryDetail,
      renderCompact: renderTreasureRingWizardryCompact,
    },
    buildPreview: buildTreasureRingWizardryPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRingWizardry'
        ? buildEventPreviewFromFactory(node, buildTreasureRingWizardryPreview)
        : undefined,
    resolvePending: () => resolveTreasureRingWizardry({}),
  },
];
