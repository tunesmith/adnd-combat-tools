import type { DungeonTableDefinition } from '../../types';
import {
  defineTreasureFollowupTable,
  defineTreasureMagicTable,
} from '../shared';
import {
  buildTreasureMiscMagicE5Preview,
  renderTreasureMiscMagicE5Compact,
  renderTreasureMiscMagicE5Detail,
} from './miscMagicE5Render';
import {
  buildTreasureRobeOfTheArchmagiPreview,
  buildTreasureScarabOfProtectionCursePreview,
  buildTreasureScarabOfProtectionCurseResolutionPreview,
  renderTreasureRobeOfTheArchmagiCompact,
  renderTreasureRobeOfTheArchmagiDetail,
  renderTreasureRobeOfUsefulItemsCompact,
  renderTreasureRobeOfUsefulItemsDetail,
  renderTreasureScarabOfProtectionCurseCompact,
  renderTreasureScarabOfProtectionCurseDetail,
  renderTreasureScarabOfProtectionCurseResolutionCompact,
  renderTreasureScarabOfProtectionCurseResolutionDetail,
} from './miscMagicE5SubtablesRender';
import {
  resolveTreasureMiscMagicE5,
  resolveTreasureRobeOfTheArchmagi,
  resolveTreasureRobeOfUsefulItems,
  resolveTreasureScarabOfProtectionCurse,
  resolveTreasureScarabOfProtectionCurseResolution,
} from './miscMagicE5Resolvers';
import { scarabOfProtectionCurseFollowups } from './miscMagicE5Subtables';
import { miscMagicE5Followups } from './miscMagicE5Table';

export const miscMagicE5Tables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureMiscMagicE5',
    heading: 'Miscellaneous Magic (Table E.5)',
    event: 'treasureMiscMagicE5',
    resolve: resolveTreasureMiscMagicE5,
    render: {
      detail: renderTreasureMiscMagicE5Detail,
      compact: renderTreasureMiscMagicE5Compact,
    },
    preview: buildTreasureMiscMagicE5Preview,
    followups: miscMagicE5Followups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureRobeOfTheArchmagi',
    heading: 'Robe of the Archmagi Alignment',
    event: 'treasureRobeOfTheArchmagi',
    resolve: resolveTreasureRobeOfTheArchmagi,
    render: {
      detail: renderTreasureRobeOfTheArchmagiDetail,
      compact: renderTreasureRobeOfTheArchmagiCompact,
    },
    preview: buildTreasureRobeOfTheArchmagiPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureScarabOfProtectionCurse',
    heading: 'Scarab of Protection (curse check)',
    event: 'treasureScarabOfProtectionCurse',
    resolve: resolveTreasureScarabOfProtectionCurse,
    render: {
      detail: renderTreasureScarabOfProtectionCurseDetail,
      compact: renderTreasureScarabOfProtectionCurseCompact,
    },
    preview: buildTreasureScarabOfProtectionCursePreview,
    followups: scarabOfProtectionCurseFollowups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureScarabOfProtectionCurseResolution',
    heading: 'Scarab of Protection (curse resolution)',
    event: 'treasureScarabOfProtectionCurseResolution',
    resolve: resolveTreasureScarabOfProtectionCurseResolution,
    render: {
      detail: renderTreasureScarabOfProtectionCurseResolutionDetail,
      compact: renderTreasureScarabOfProtectionCurseResolutionCompact,
    },
    preview: buildTreasureScarabOfProtectionCurseResolutionPreview,
  }),
  {
    id: 'treasureRobeOfUsefulItems',
    heading: 'Robe of Useful Items',
    resolver: () => resolveTreasureRobeOfUsefulItems({}),
    registry: () => resolveTreasureRobeOfUsefulItems({}),
    resolvePending: () => resolveTreasureRobeOfUsefulItems({}),
    renderers: {
      renderDetail: renderTreasureRobeOfUsefulItemsDetail,
      renderCompact: renderTreasureRobeOfUsefulItemsCompact,
    },
  },
];
