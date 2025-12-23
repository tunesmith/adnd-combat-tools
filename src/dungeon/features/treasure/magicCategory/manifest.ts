import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import {
  readTreasureMagicContext,
  readTreasureMagicRegistryContext,
} from '../shared';
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
    renderers: {
      renderDetail: renderTreasureMagicCategoryDetail,
      renderCompact: renderTreasureMagicCategoryCompact,
    },
    buildPreview: buildTreasureMagicCategoryPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } =
        readTreasureMagicRegistryContext(context);
      return resolveTreasureMagicCategory({
        roll,
        level,
        treasureRoll,
        rollIndex,
      });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureMagicCategory(context);
    },
  },
];

