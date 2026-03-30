import type { DungeonTableDefinition } from '../../types';
import {
  defineTreasureFollowupTable,
  defineTreasureMagicTable,
} from '../shared';
import {
  buildTreasureMiscMagicE2Preview,
  renderTreasureMiscMagicE2Compact,
  renderTreasureMiscMagicE2Detail,
} from './miscMagicE2Render';
import {
  renderTreasureCarpetOfFlyingCompact,
  renderTreasureCarpetOfFlyingDetail,
  buildTreasureCarpetOfFlyingPreview,
  renderTreasureCloakOfProtectionCompact,
  renderTreasureCloakOfProtectionDetail,
  buildTreasureCloakOfProtectionPreview,
  renderTreasureCrystalBallCompact,
  renderTreasureCrystalBallDetail,
  buildTreasureCrystalBallPreview,
  renderTreasureDeckOfManyThingsCompact,
  renderTreasureDeckOfManyThingsDetail,
  buildTreasureDeckOfManyThingsPreview,
  renderTreasureEyesOfPetrificationCompact,
  renderTreasureEyesOfPetrificationDetail,
  buildTreasureEyesOfPetrificationPreview,
} from './miscMagicE2SubtablesRender';
import {
  resolveTreasureCarpetOfFlying,
  resolveTreasureCloakOfProtection,
  resolveTreasureCrystalBall,
  resolveTreasureDeckOfManyThings,
  resolveTreasureEyesOfPetrification,
  resolveTreasureMiscMagicE2,
} from './miscMagicE2Resolvers';
import { miscMagicE2Followups } from './miscMagicE2Table';

export const miscMagicE2Tables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureMiscMagicE2',
    heading: 'Miscellaneous Magic (Table E.2)',
    event: 'treasureMiscMagicE2',
    resolve: resolveTreasureMiscMagicE2,
    render: {
      detail: renderTreasureMiscMagicE2Detail,
      compact: renderTreasureMiscMagicE2Compact,
    },
    preview: buildTreasureMiscMagicE2Preview,
    followups: miscMagicE2Followups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureCarpetOfFlying',
    heading: 'Carpet of Flying Size',
    event: 'treasureCarpetOfFlying',
    resolve: resolveTreasureCarpetOfFlying,
    render: {
      detail: renderTreasureCarpetOfFlyingDetail,
      compact: renderTreasureCarpetOfFlyingCompact,
    },
    preview: buildTreasureCarpetOfFlyingPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureCloakOfProtection',
    heading: 'Cloak of Protection Bonus',
    event: 'treasureCloakOfProtection',
    resolve: resolveTreasureCloakOfProtection,
    render: {
      detail: renderTreasureCloakOfProtectionDetail,
      compact: renderTreasureCloakOfProtectionCompact,
    },
    preview: buildTreasureCloakOfProtectionPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureCrystalBall',
    heading: 'Crystal Ball Variant',
    event: 'treasureCrystalBall',
    resolve: resolveTreasureCrystalBall,
    render: {
      detail: renderTreasureCrystalBallDetail,
      compact: renderTreasureCrystalBallCompact,
    },
    preview: buildTreasureCrystalBallPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureDeckOfManyThings',
    heading: 'Deck Composition',
    event: 'treasureDeckOfManyThings',
    resolve: resolveTreasureDeckOfManyThings,
    render: {
      detail: renderTreasureDeckOfManyThingsDetail,
      compact: renderTreasureDeckOfManyThingsCompact,
    },
    preview: buildTreasureDeckOfManyThingsPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureEyesOfPetrification',
    heading: 'Eyes of Petrification Type',
    event: 'treasureEyesOfPetrification',
    resolve: resolveTreasureEyesOfPetrification,
    render: {
      detail: renderTreasureEyesOfPetrificationDetail,
      compact: renderTreasureEyesOfPetrificationCompact,
    },
    preview: buildTreasureEyesOfPetrificationPreview,
  }),
];
