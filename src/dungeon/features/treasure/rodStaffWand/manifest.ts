import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
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
  },
];
