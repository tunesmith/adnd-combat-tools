import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { createTreasureMagicContextHandlers } from '../shared';
import {
  buildTreasureMagicCategoryPreview,
  renderTreasureMagicCategoryCompact,
  renderTreasureMagicCategoryDetail,
} from './magicCategoryRender';
import { resolveTreasureMagicCategory } from './magicCategoryResolvers';

export const magicCategoryTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureMagicCategory',
    heading: 'Magical Treasure',
    resolver: wrapResolver(resolveTreasureMagicCategory),
    ...createTreasureMagicContextHandlers(resolveTreasureMagicCategory),
    renderers: {
      renderDetail: renderTreasureMagicCategoryDetail,
      renderCompact: renderTreasureMagicCategoryCompact,
    },
    buildPreview: buildTreasureMagicCategoryPreview,
  },
];
