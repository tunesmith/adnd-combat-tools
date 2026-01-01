import type { DungeonTableDefinition } from '../../types';
import { createTreasureMagicContextHandlers } from '../shared';
import {
  buildTreasureMiscWeaponsPreview,
  renderTreasureMiscWeaponsCompact,
  renderTreasureMiscWeaponsDetail,
} from './miscWeaponsRender';
import {
  resolveTreasureMiscWeapons,
  type TreasureMiscWeaponsResolverOptions,
} from './miscWeaponsResolvers';

export const miscWeaponsTables: ReadonlyArray<
  DungeonTableDefinition<TreasureMiscWeaponsResolverOptions>
> = [
  {
    id: 'treasureMiscWeapons',
    heading: 'Miscellaneous Weapons (Table H)',
    resolver: resolveTreasureMiscWeapons,
    ...createTreasureMagicContextHandlers(resolveTreasureMiscWeapons),
    renderers: {
      renderDetail: renderTreasureMiscWeaponsDetail,
      renderCompact: renderTreasureMiscWeaponsCompact,
    },
    buildPreview: buildTreasureMiscWeaponsPreview,
  },
];
