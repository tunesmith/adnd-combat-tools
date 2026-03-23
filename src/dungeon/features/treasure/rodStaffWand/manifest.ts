import type { DungeonTableDefinition } from '../../types';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';
import {
  buildTreasureRodStaffWandPreview,
  buildTreasureStaffSerpentPreview,
  renderTreasureRodStaffWandCompact,
  renderTreasureRodStaffWandDetail,
  renderTreasureStaffSerpentCompact,
  renderTreasureStaffSerpentDetail,
} from './rodStaffWandRender';
import {
  resolveTreasureRodStaffWand,
  resolveTreasureStaffSerpent,
} from './rodStaffWandResolvers';

export const rodStaffWandTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureRodStaffWand',
    heading: 'Rod, Staff, or Wand',
    resolver: wrapResolver(resolveTreasureRodStaffWand),
    resolvePending: () => resolveTreasureRodStaffWand({}),
    renderers: {
      renderDetail: renderTreasureRodStaffWandDetail,
      renderCompact: renderTreasureRodStaffWandCompact,
    },
    buildPreview: buildTreasureRodStaffWandPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRodStaffWand'
        ? buildEventPreviewFromFactory(node, buildTreasureRodStaffWandPreview)
        : undefined,
  },
  {
    id: 'treasureStaffSerpent',
    heading: 'Serpent Form',
    resolver: wrapResolver(resolveTreasureStaffSerpent),
    resolvePending: () => resolveTreasureStaffSerpent({}),
    renderers: {
      renderDetail: renderTreasureStaffSerpentDetail,
      renderCompact: renderTreasureStaffSerpentCompact,
    },
    buildPreview: buildTreasureStaffSerpentPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureStaffSerpent'
        ? buildEventPreviewFromFactory(node, buildTreasureStaffSerpentPreview)
        : undefined,
  },
];
