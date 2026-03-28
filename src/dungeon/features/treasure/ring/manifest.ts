import type { DungeonTableDefinition } from '../../types';
import {
  defineTreasureFollowupTable,
  defineTreasureMagicTable,
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
import { ringFollowups } from './ringTables';

export const ringTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureRing',
    heading: 'Ring',
    event: 'treasureRing',
    resolve: resolveTreasureRing,
    render: {
      detail: renderTreasureRingDetail,
      compact: renderTreasureRingCompact,
    },
    preview: buildTreasureRingPreview,
    followups: ringFollowups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureRingContrariness',
    heading: 'Contrariness Effect',
    event: 'treasureRingContrariness',
    resolve: resolveTreasureRingContrariness,
    render: {
      detail: renderTreasureRingContrarinessDetail,
      compact: renderTreasureRingContrarinessCompact,
    },
    preview: buildTreasureRingContrarinessPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureRingElementalCommand',
    heading: 'Elemental Focus',
    event: 'treasureRingElementalCommand',
    resolve: resolveTreasureRingElementalCommand,
    render: {
      detail: renderTreasureRingElementalCommandDetail,
      compact: renderTreasureRingElementalCommandCompact,
    },
    preview: buildTreasureRingElementalCommandPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureRingProtection',
    heading: 'Protection Bonus',
    event: 'treasureRingProtection',
    resolve: resolveTreasureRingProtection,
    render: {
      detail: renderTreasureRingProtectionDetail,
      compact: renderTreasureRingProtectionCompact,
    },
    preview: buildTreasureRingProtectionPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureRingRegeneration',
    heading: 'Regeneration Type',
    event: 'treasureRingRegeneration',
    resolve: resolveTreasureRingRegeneration,
    render: {
      detail: renderTreasureRingRegenerationDetail,
      compact: renderTreasureRingRegenerationCompact,
    },
    preview: buildTreasureRingRegenerationPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureRingTelekinesis',
    heading: 'Telekinetic Capacity',
    event: 'treasureRingTelekinesis',
    resolve: resolveTreasureRingTelekinesis,
    render: {
      detail: renderTreasureRingTelekinesisDetail,
      compact: renderTreasureRingTelekinesisCompact,
    },
    preview: buildTreasureRingTelekinesisPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureRingThreeWishes',
    heading: 'Wish Capacity',
    event: 'treasureRingThreeWishes',
    resolve: resolveTreasureRingThreeWishes,
    render: {
      detail: renderTreasureRingThreeWishesDetail,
      compact: renderTreasureRingThreeWishesCompact,
    },
    preview: buildTreasureRingThreeWishesPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureRingWizardry',
    heading: 'Spell Doubling',
    event: 'treasureRingWizardry',
    resolve: resolveTreasureRingWizardry,
    render: {
      detail: renderTreasureRingWizardryDetail,
      compact: renderTreasureRingWizardryCompact,
    },
    preview: buildTreasureRingWizardryPreview,
  }),
];
