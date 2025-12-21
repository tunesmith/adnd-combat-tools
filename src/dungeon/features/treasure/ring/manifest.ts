import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { readTreasureMagicContext } from '../shared';
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
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureRing(context);
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
    resolvePending: () => resolveTreasureRingWizardry({}),
  },
];
