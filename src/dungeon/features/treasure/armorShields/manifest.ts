import type { DungeonTableDefinition } from '../../types';
import { createTreasureMagicContextHandlers } from '../shared';
import {
  buildTreasureArmorShieldsPreview,
  renderTreasureArmorShieldsCompact,
  renderTreasureArmorShieldsDetail,
} from './armorShieldsRender';
import {
  resolveTreasureArmorShields,
  type TreasureArmorShieldsResolverOptions,
} from './armorShieldsResolvers';

export const armorShieldsTables: ReadonlyArray<
  DungeonTableDefinition<TreasureArmorShieldsResolverOptions>
> = [
  {
    id: 'treasureArmorShields',
    heading: 'Armor & Shields (Table F)',
    resolver: resolveTreasureArmorShields,
    ...createTreasureMagicContextHandlers(resolveTreasureArmorShields),
    renderers: {
      renderDetail: renderTreasureArmorShieldsDetail,
      renderCompact: renderTreasureArmorShieldsCompact,
    },
    buildPreview: buildTreasureArmorShieldsPreview,
  },
];
