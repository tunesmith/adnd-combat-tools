import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../shared';
import {
  buildTrickTrapPreview,
  renderTrickTrapDetail,
  renderTrickTrapCompactNodes,
} from './trickTrapRender';
import { resolveTrickTrap } from './trickTrapResolvers';

export const trickTrapTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'trickTrap',
    heading: 'Trick / Trap',
    resolver: wrapResolver(resolveTrickTrap),
    renderers: {
      renderDetail: renderTrickTrapDetail,
      renderCompact: renderTrickTrapCompactNodes,
    },
    buildPreview: buildTrickTrapPreview,
    resolvePending: () => resolveTrickTrap({}),
  },
];
