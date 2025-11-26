import type { DungeonTableDefinition } from '../../types';
import {
  renderSidePassagesDetail,
  renderSidePassagesCompactNodes,
  buildSidePassagePreview,
} from './sidePassageRender';
import { resolveSidePassages } from './sidePassageResolvers';
import { withoutAppend } from '../shared';
import { wrapResolver } from '../../shared';

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
    resolvePending: () => resolveSidePassages({}),
  },
];
