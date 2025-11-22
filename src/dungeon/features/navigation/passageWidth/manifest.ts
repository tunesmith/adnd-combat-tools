import type { DungeonTableDefinition } from '../../types';
import {
  buildPassageWidthPreview,
  renderPassageWidthCompactNodes,
  renderPassageWidthDetail,
} from './passageWidthRender';
import { resolvePassageWidth } from './passageWidthResolvers';
import { wrapResolver, withoutAppend } from '../shared';

export const passageWidthTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'passageWidth',
    heading: 'Passage Width',
    resolver: wrapResolver(resolvePassageWidth),
    renderers: {
      renderDetail: renderPassageWidthDetail,
      renderCompact: withoutAppend(renderPassageWidthCompactNodes),
    },
    buildPreview: buildPassageWidthPreview,
    resolvePending: () => resolvePassageWidth({}),
  },
];
