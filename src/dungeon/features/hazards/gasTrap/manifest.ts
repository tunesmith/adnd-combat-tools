import type { DungeonTableDefinition } from '../../types';
import {
  renderGasTrapEffectCompact,
  renderGasTrapEffectDetail,
  buildGasTrapEffectPreview,
} from './gasTrapRender';
import { resolveGasTrapEffect } from './gasTrapResolvers';
import { defineRollOnlyTable } from '../../shared';

export const gasTrapTables: ReadonlyArray<DungeonTableDefinition> = [
  defineRollOnlyTable({
    id: 'gasTrapEffect',
    heading: 'Gas Effect',
    event: 'gasTrapEffect',
    resolve: resolveGasTrapEffect,
    render: {
      detail: renderGasTrapEffectDetail,
      compact: renderGasTrapEffectCompact,
    },
    preview: buildGasTrapEffectPreview,
  }),
];
