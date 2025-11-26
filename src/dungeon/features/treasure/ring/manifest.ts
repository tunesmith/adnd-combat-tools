import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
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

type TreasureRegistryContext = {
  kind?: string;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

function readTreasureContext(context?: TreasureRegistryContext): {
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
} {
  if (context?.kind !== 'treasureMagic') return {};
  return {
    level: context.level,
    treasureRoll: context.treasureRoll,
    rollIndex: context.rollIndex,
  };
}

export const ringTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureRing',
    heading: 'Ring',
    resolver: wrapResolver(resolveTreasureRing),
    renderers: {
      renderDetail: renderTreasureRingDetail,
      renderCompact: renderTreasureRingCompact,
    },
    buildPreview: buildTreasureRingPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasureRing({ roll, level, treasureRoll, rollIndex });
    },
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
  },
];
