import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../shared';
import {
  renderIllusionaryWallNatureDetail,
  renderIllusionaryWallNatureCompact,
  buildIllusionaryWallNaturePreview,
} from './illusionaryWallRender';
import { resolveIllusionaryWallNature } from './illusionaryWallResolvers';

export const illusionaryWallTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'illusionaryWallNature',
    heading: 'Illusionary Wall Nature',
    resolver: wrapResolver(resolveIllusionaryWallNature),
    renderers: {
      renderDetail: renderIllusionaryWallNatureDetail,
      renderCompact: renderIllusionaryWallNatureCompact,
    },
    buildPreview: buildIllusionaryWallNaturePreview,
    resolvePending: () => resolveIllusionaryWallNature({}),
  },
];
