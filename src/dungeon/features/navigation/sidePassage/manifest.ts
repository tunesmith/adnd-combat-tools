import type { DungeonTableDefinition } from '../../types';
import {
  renderSidePassagesDetail,
  renderSidePassagesCompactNodes,
  buildSidePassagePreview,
} from './sidePassageRender';
import { resolveSidePassages } from './sidePassageResolvers';
import {
  buildEventPreviewFromFactory,
  withoutAppend,
  wrapResolver,
} from '../../shared';

export const sidePassageTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'sidePassages',
    heading: 'Side Passages',
    resolver: wrapResolver(resolveSidePassages),
    renderers: {
      renderDetail: renderSidePassagesDetail,
      renderCompact: withoutAppend(renderSidePassagesCompactNodes),
    },
    buildPreview: buildSidePassagePreview,
    buildEventPreview: (node) =>
      node.event.kind === 'sidePassages'
        ? buildEventPreviewFromFactory(node, buildSidePassagePreview)
        : undefined,
    resolvePending: () => resolveSidePassages({}),
  },
];
