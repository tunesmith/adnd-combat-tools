import type { DungeonTableDefinition } from '../../types';
import { NO_COMPACT_RENDER } from '../../shared';
import { defineTreasureProtectionTable } from '../shared';
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

export const protectionTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureProtectionTable({
    id: 'treasureProtectionType',
    heading: 'Treasure Protection',
    event: 'treasureProtectionType',
    resolve: resolveTreasureProtectionType,
    render: {
      detail: renderTreasureProtectionTypeDetail,
      compact: renderTreasureProtectionTypeCompact,
    },
    preview: buildTreasureProtectionTypePreview,
  }),
  defineTreasureProtectionTable({
    id: 'treasureProtectionGuardedBy',
    heading: 'Treasure Guarded By',
    event: 'treasureProtectionGuardedBy',
    resolve: resolveTreasureProtectionGuardedBy,
    render: {
      detail: renderTreasureProtectionGuardedByDetail,
      compact: NO_COMPACT_RENDER,
    },
    preview: buildTreasureProtectionGuardedByPreview,
  }),
  defineTreasureProtectionTable({
    id: 'treasureProtectionHiddenBy',
    heading: 'Treasure Hidden By',
    event: 'treasureProtectionHiddenBy',
    resolve: resolveTreasureProtectionHiddenBy,
    render: {
      detail: renderTreasureProtectionHiddenByDetail,
      compact: NO_COMPACT_RENDER,
    },
    preview: buildTreasureProtectionHiddenByPreview,
  }),
];
