import type { DungeonTableDefinition } from '../../types';
import {
  defineTreasureFollowupTable,
  defineTreasureMagicTable,
} from '../shared';
import {
  buildTreasureScrollPreview,
  buildTreasureScrollProtectionElementalsPreview,
  buildTreasureScrollProtectionLycanthropesPreview,
  renderTreasureScrollCompact,
  renderTreasureScrollDetail,
  renderTreasureScrollProtectionElementalsCompact,
  renderTreasureScrollProtectionElementalsDetail,
  renderTreasureScrollProtectionLycanthropesCompact,
  renderTreasureScrollProtectionLycanthropesDetail,
} from './scrollRender';
import {
  resolveTreasureScroll,
  resolveTreasureScrollProtectionElementals,
  resolveTreasureScrollProtectionLycanthropes,
} from './scrollResolvers';
import { scrollFollowups } from './scrollTables';

export const scrollTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureScroll',
    heading: 'Scroll',
    event: 'treasureScroll',
    resolve: resolveTreasureScroll,
    render: {
      detail: renderTreasureScrollDetail,
      compact: renderTreasureScrollCompact,
    },
    preview: buildTreasureScrollPreview,
    followups: scrollFollowups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureScrollProtectionElementals',
    heading: 'Protection from Elementals',
    event: 'treasureScrollProtectionElementals',
    resolve: resolveTreasureScrollProtectionElementals,
    render: {
      detail: renderTreasureScrollProtectionElementalsDetail,
      compact: renderTreasureScrollProtectionElementalsCompact,
    },
    preview: buildTreasureScrollProtectionElementalsPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureScrollProtectionLycanthropes',
    heading: 'Protection from Lycanthropes',
    event: 'treasureScrollProtectionLycanthropes',
    resolve: resolveTreasureScrollProtectionLycanthropes,
    render: {
      detail: renderTreasureScrollProtectionLycanthropesDetail,
      compact: renderTreasureScrollProtectionLycanthropesCompact,
    },
    preview: buildTreasureScrollProtectionLycanthropesPreview,
  }),
];
