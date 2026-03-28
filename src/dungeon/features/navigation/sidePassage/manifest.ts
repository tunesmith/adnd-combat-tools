import type { DungeonTableDefinition } from '../../types';
import {
  renderSidePassagesDetail,
  renderSidePassagesCompactNodes,
  buildSidePassagePreview,
} from './sidePassageRender';
import { resolveSidePassages } from './sidePassageResolvers';
import { defineRollOnlyTable, withoutAppend } from '../../shared';

export const sidePassageTables: ReadonlyArray<DungeonTableDefinition> = [
  defineRollOnlyTable({
    id: 'sidePassages',
    heading: 'Side Passages',
    event: 'sidePassages',
    resolve: resolveSidePassages,
    render: {
      detail: renderSidePassagesDetail,
      compact: withoutAppend(renderSidePassagesCompactNodes),
    },
    preview: buildSidePassagePreview,
  }),
];
