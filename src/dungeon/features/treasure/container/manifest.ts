import type { DungeonTableDefinition } from '../../types';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';
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
    buildEventPreview: (node) =>
      node.event.kind === 'treasureContainer'
        ? buildEventPreviewFromFactory(node, buildTreasureContainerPreview, {
            context: { kind: 'treasureContainer' },
          })
        : undefined,
    resolvePending: () => resolveTreasureContainer({}),
  },
];
