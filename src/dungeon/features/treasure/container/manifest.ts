import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import {
  buildTreasureContainerPreview,
  renderTreasureContainerCompact,
  renderTreasureContainerDetail,
} from './containerRender';
import { resolveTreasureContainer } from './containerResolvers';

export const containerTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureContainer',
    heading: 'Treasure Container',
    resolver: wrapResolver(resolveTreasureContainer),
    renderers: {
      renderDetail: renderTreasureContainerDetail,
      renderCompact: renderTreasureContainerCompact,
    },
    buildPreview: buildTreasureContainerPreview,
    resolvePending: () => resolveTreasureContainer({}),
  },
];

