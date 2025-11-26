import type { DungeonTableDefinition } from '../../types';
import {
  renderGasTrapEffectCompact,
  renderGasTrapEffectDetail,
  buildGasTrapEffectPreview,
} from './gasTrapRender';
import { resolveGasTrapEffect } from './gasTrapResolvers';
import { wrapResolver } from '../../shared';

export const gasTrapTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'gasTrapEffect',
    heading: 'Gas Effect',
    resolver: wrapResolver(resolveGasTrapEffect),
    renderers: {
      renderDetail: renderGasTrapEffectDetail,
      renderCompact: renderGasTrapEffectCompact,
    },
    buildPreview: buildGasTrapEffectPreview,
    resolvePending: () => resolveGasTrapEffect({}),
  },
];
