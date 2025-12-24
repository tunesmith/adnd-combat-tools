import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { createTreasureMagicContextHandlers } from '../shared';
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

export const miscMagicE2Tables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureMiscMagicE2',
    heading: 'Miscellaneous Magic (Table E.2)',
    resolver: wrapResolver(resolveTreasureMiscMagicE2),
    ...createTreasureMagicContextHandlers(resolveTreasureMiscMagicE2),
    renderers: {
      renderDetail: renderTreasureMiscMagicE2Detail,
      renderCompact: renderTreasureMiscMagicE2Compact,
    },
    buildPreview: buildTreasureMiscMagicE2Preview,
  },
  {
    id: 'treasureCarpetOfFlying',
    heading: 'Carpet of Flying Size',
    resolver: wrapResolver(resolveTreasureCarpetOfFlying),
    resolvePending: () => resolveTreasureCarpetOfFlying({}),
    renderers: {
      renderDetail: renderTreasureCarpetOfFlyingDetail,
      renderCompact: renderTreasureCarpetOfFlyingCompact,
    },
    buildPreview: buildTreasureCarpetOfFlyingPreview,
  },
  {
    id: 'treasureCloakOfProtection',
    heading: 'Cloak of Protection Bonus',
    resolver: wrapResolver(resolveTreasureCloakOfProtection),
    resolvePending: () => resolveTreasureCloakOfProtection({}),
    renderers: {
      renderDetail: renderTreasureCloakOfProtectionDetail,
      renderCompact: renderTreasureCloakOfProtectionCompact,
    },
    buildPreview: buildTreasureCloakOfProtectionPreview,
  },
  {
    id: 'treasureCrystalBall',
    heading: 'Crystal Ball Variant',
    resolver: wrapResolver(resolveTreasureCrystalBall),
    resolvePending: () => resolveTreasureCrystalBall({}),
    renderers: {
      renderDetail: renderTreasureCrystalBallDetail,
      renderCompact: renderTreasureCrystalBallCompact,
    },
    buildPreview: buildTreasureCrystalBallPreview,
  },
  {
    id: 'treasureDeckOfManyThings',
    heading: 'Deck Composition',
    resolver: wrapResolver(resolveTreasureDeckOfManyThings),
    resolvePending: () => resolveTreasureDeckOfManyThings({}),
    renderers: {
      renderDetail: renderTreasureDeckOfManyThingsDetail,
      renderCompact: renderTreasureDeckOfManyThingsCompact,
    },
    buildPreview: buildTreasureDeckOfManyThingsPreview,
  },
  {
    id: 'treasureEyesOfPetrification',
    heading: 'Eyes of Petrification Type',
    resolver: wrapResolver(resolveTreasureEyesOfPetrification),
    resolvePending: () => resolveTreasureEyesOfPetrification({}),
    renderers: {
      renderDetail: renderTreasureEyesOfPetrificationDetail,
      renderCompact: renderTreasureEyesOfPetrificationCompact,
    },
    buildPreview: buildTreasureEyesOfPetrificationPreview,
  },
];
