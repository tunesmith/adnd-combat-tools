import type { DungeonTableDefinition } from '../../types';
import {
  renderPassageTurnsDetail,
  renderPassageTurnsCompactNodes,
  buildPassageTurnPreview,
} from './passageTurnRender';
import { resolvePassageTurns } from './passageTurnResolvers';
import { wrapResolver, withoutAppend } from '../shared';

export const passageTurnTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'passageTurns',
    heading: 'Passage Turns',
    resolver: wrapResolver(resolvePassageTurns),
    renderers: {
      renderDetail: renderPassageTurnsDetail,
      renderCompact: withoutAppend(renderPassageTurnsCompactNodes),
    },
    buildPreview: buildPassageTurnPreview,
    resolvePending: () => resolvePassageTurns({}),
  },
];
