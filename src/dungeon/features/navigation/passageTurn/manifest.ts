import type { DungeonTableDefinition } from '../../types';
import {
  renderPassageTurnsDetail,
  renderPassageTurnsCompactNodes,
  buildPassageTurnPreview,
} from './passageTurnRender';
import { resolvePassageTurns } from './passageTurnResolvers';
import { defineRollOnlyTable, withoutAppend } from '../../shared';

export const passageTurnTables: ReadonlyArray<DungeonTableDefinition> = [
  defineRollOnlyTable({
    id: 'passageTurns',
    heading: 'Passage Turns',
    event: 'passageTurns',
    resolve: resolvePassageTurns,
    render: {
      detail: renderPassageTurnsDetail,
      compact: withoutAppend(renderPassageTurnsCompactNodes),
    },
    preview: buildPassageTurnPreview,
  }),
];
