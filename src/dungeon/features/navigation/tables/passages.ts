import type { DungeonTableDefinition } from '../../types';
import {
  renderPassageWidthDetail,
  renderPassageWidthCompactNodes,
  buildPassageWidthPreview,
} from '../../../adapters/render/passageWidth';
import { resolvePassageWidth } from '../../../domain/resolvers';
import { wrapResolver, withoutAppend } from '../shared';

export const passageTables: ReadonlyArray<DungeonTableDefinition> = [
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
