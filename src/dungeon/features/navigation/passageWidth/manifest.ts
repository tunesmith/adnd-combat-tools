import type { DungeonTableDefinition } from '../../types';
import {
  buildPassageWidthPreview,
  renderPassageWidthCompactNodes,
  renderPassageWidthDetail,
} from './passageWidthRender';
import { resolvePassageWidth } from './passageWidthResolvers';
import { defineRollOnlyTable, withoutAppend } from '../../shared';

export const passageWidthTables: ReadonlyArray<DungeonTableDefinition> = [
  defineRollOnlyTable({
    id: 'passageWidth',
    heading: 'Passage Width',
    event: 'passageWidth',
    resolve: resolvePassageWidth,
    render: {
      detail: renderPassageWidthDetail,
      compact: withoutAppend(renderPassageWidthCompactNodes),
    },
    preview: buildPassageWidthPreview,
  }),
];
