import type { DungeonTableDefinition } from '../../types';
import { defineHazardLevelTable } from '../shared';
import {
  renderIllusionaryWallNatureDetail,
  renderIllusionaryWallNatureCompact,
  buildIllusionaryWallNaturePreview,
} from './illusionaryWallRender';
import { resolveIllusionaryWallNature } from './illusionaryWallResolvers';

export const illusionaryWallTables: ReadonlyArray<DungeonTableDefinition> = [
  defineHazardLevelTable({
    id: 'illusionaryWallNature',
    heading: 'Illusionary Wall Nature',
    event: 'illusionaryWallNature',
    resolve: resolveIllusionaryWallNature,
    render: {
      detail: renderIllusionaryWallNatureDetail,
      compact: renderIllusionaryWallNatureCompact,
    },
    preview: buildIllusionaryWallNaturePreview,
  }),
];
