import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import {
  buildTreasureProtectionGuardedByPreview,
  buildTreasureProtectionHiddenByPreview,
  buildTreasureProtectionTypePreview,
  renderTreasureProtectionGuardedByDetail,
  renderTreasureProtectionHiddenByDetail,
  renderTreasureProtectionTypeCompact,
  renderTreasureProtectionTypeDetail,
} from './protectionRender';
import {
  resolveTreasureProtectionGuardedBy,
  resolveTreasureProtectionHiddenBy,
  resolveTreasureProtectionType,
} from './protectionResolvers';

const NO_COMPACT_RENDER: DungeonTableDefinition['renderers']['renderCompact'] =
  () => [];

export const protectionTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureProtectionType',
    heading: 'Treasure Protection',
    resolver: wrapResolver(resolveTreasureProtectionType),
    renderers: {
      renderDetail: renderTreasureProtectionTypeDetail,
      renderCompact: renderTreasureProtectionTypeCompact,
    },
    buildPreview: buildTreasureProtectionTypePreview,
    resolvePending: () => resolveTreasureProtectionType({}),
  },
  {
    id: 'treasureProtectionGuardedBy',
    heading: 'Treasure Guarded By',
    resolver: wrapResolver(resolveTreasureProtectionGuardedBy),
    renderers: {
      renderDetail: renderTreasureProtectionGuardedByDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildTreasureProtectionGuardedByPreview,
    resolvePending: () => resolveTreasureProtectionGuardedBy({}),
  },
  {
    id: 'treasureProtectionHiddenBy',
    heading: 'Treasure Hidden By',
    resolver: wrapResolver(resolveTreasureProtectionHiddenBy),
    renderers: {
      renderDetail: renderTreasureProtectionHiddenByDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildTreasureProtectionHiddenByPreview,
    resolvePending: () => resolveTreasureProtectionHiddenBy({}),
  },
];

