import type { DungeonTableDefinition } from '../../types';
import {
  renderPassageTurnsDetail,
  renderPassageTurnsCompactNodes,
  buildPassageTurnPreview,
} from './passageTurnRender';
import { resolvePassageTurns } from './passageTurnResolvers';
import {
  buildEventPreviewFromFactory,
  withoutAppend,
  wrapResolver,
} from '../../shared';

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
    buildEventPreview: (node) =>
      node.event.kind === 'passageTurns'
        ? buildEventPreviewFromFactory(node, buildPassageTurnPreview)
        : undefined,
    resolvePending: () => resolvePassageTurns({}),
  },
];
