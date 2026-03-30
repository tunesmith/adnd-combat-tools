import type { DungeonTableDefinition } from '../../types';
import { defineTreasureContainerTable } from '../shared';
import {
  buildTreasureContainerPreview,
  renderTreasureContainerCompact,
  renderTreasureContainerDetail,
} from './containerRender';
import { resolveTreasureContainer } from './containerResolvers';

export const containerTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureContainerTable({
    id: 'treasureContainer',
    heading: 'Treasure Container',
    event: 'treasureContainer',
    resolve: resolveTreasureContainer,
    render: {
      detail: renderTreasureContainerDetail,
      compact: renderTreasureContainerCompact,
    },
    preview: buildTreasureContainerPreview,
  }),
];
