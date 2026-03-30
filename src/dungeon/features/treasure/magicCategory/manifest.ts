import type { DungeonTableDefinition } from '../../types';
import { defineTreasureMagicTable } from '../shared';
import {
  buildTreasureMagicCategoryPreview,
  renderTreasureMagicCategoryCompact,
  renderTreasureMagicCategoryDetail,
} from './magicCategoryRender';
import { resolveTreasureMagicCategory } from './magicCategoryResolvers';
import { magicCategoryFollowups } from './magicCategoryTable';

export const magicCategoryTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureMagicCategory',
    heading: 'Magical Treasure',
    event: 'treasureMagicCategory',
    resolve: resolveTreasureMagicCategory,
    render: {
      detail: renderTreasureMagicCategoryDetail,
      compact: renderTreasureMagicCategoryCompact,
    },
    preview: buildTreasureMagicCategoryPreview,
    followups: magicCategoryFollowups,
  }),
];
