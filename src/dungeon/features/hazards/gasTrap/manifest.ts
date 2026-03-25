import type { DungeonTableDefinition } from '../../types';
import {
  renderGasTrapEffectCompact,
  renderGasTrapEffectDetail,
  buildGasTrapEffectPreview,
} from './gasTrapRender';
import { resolveGasTrapEffect } from './gasTrapResolvers';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';

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
    buildEventPreview: (node) =>
      buildEventPreviewFromFactory(node, buildGasTrapEffectPreview),
    resolvePending: () => resolveGasTrapEffect({}),
  },
];
