import type { DungeonTableDefinition } from '../../types';
import { defineTreasureMagicTable } from '../shared';
import {
  buildTreasureArmorShieldsPreview,
  renderTreasureArmorShieldsCompact,
  renderTreasureArmorShieldsDetail,
} from './armorShieldsRender';
import { resolveTreasureArmorShields } from './armorShieldsResolvers';

export const armorShieldsTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureArmorShields',
    heading: 'Armor & Shields (Table F)',
    event: 'treasureArmorShields',
    resolve: resolveTreasureArmorShields,
    render: {
      detail: renderTreasureArmorShieldsDetail,
      compact: renderTreasureArmorShieldsCompact,
    },
    preview: buildTreasureArmorShieldsPreview,
  }),
];
