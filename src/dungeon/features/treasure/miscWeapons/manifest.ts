import type { DungeonTableDefinition } from '../../types';
import { defineTreasureMagicTable } from '../shared';
import {
  buildTreasureMiscWeaponsPreview,
  renderTreasureMiscWeaponsCompact,
  renderTreasureMiscWeaponsDetail,
} from './miscWeaponsRender';
import { resolveTreasureMiscWeapons } from './miscWeaponsResolvers';

export const miscWeaponsTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureMiscWeapons',
    heading: 'Miscellaneous Weapons (Table H)',
    event: 'treasureMiscWeapons',
    resolve: resolveTreasureMiscWeapons,
    render: {
      detail: renderTreasureMiscWeaponsDetail,
      compact: renderTreasureMiscWeaponsCompact,
    },
    preview: buildTreasureMiscWeaponsPreview,
  }),
];
