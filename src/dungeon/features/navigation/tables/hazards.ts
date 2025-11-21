import type { DungeonTableDefinition } from '../../types';
import {
  renderGasTrapEffectDetail,
  renderGasTrapEffectCompact,
  buildGasTrapEffectPreview,
} from '../../../adapters/render/gasTrapEffect';
import { resolveGasTrapEffect } from '../../../domain/resolvers';
import { wrapResolver } from '../shared';

export const hazardTables: ReadonlyArray<DungeonTableDefinition> = [
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
