import type { DungeonTableDefinition } from '../../types';
import { defineTreasureFollowupTable } from '../shared';
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
import { rodStaffWandFollowups } from './rodStaffWandTables';

export const rodStaffWandTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureFollowupTable({
    id: 'treasureRodStaffWand',
    heading: 'Rod, Staff, or Wand',
    event: 'treasureRodStaffWand',
    resolve: resolveTreasureRodStaffWand,
    render: {
      detail: renderTreasureRodStaffWandDetail,
      compact: renderTreasureRodStaffWandCompact,
    },
    preview: buildTreasureRodStaffWandPreview,
    followups: rodStaffWandFollowups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureStaffSerpent',
    heading: 'Serpent Form',
    event: 'treasureStaffSerpent',
    resolve: resolveTreasureStaffSerpent,
    render: {
      detail: renderTreasureStaffSerpentDetail,
      compact: renderTreasureStaffSerpentCompact,
    },
    preview: buildTreasureStaffSerpentPreview,
  }),
];
