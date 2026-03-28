import type { DungeonTableDefinition } from '../../types';
import {
  defineTreasureFollowupTable,
  defineTreasureMagicTable,
} from '../shared';
import {
  buildTreasureMiscMagicE4Preview,
  renderTreasureMiscMagicE4Compact,
  renderTreasureMiscMagicE4Detail,
} from './miscMagicE4Render';
import {
  buildTreasureManualOfGolemsPreview,
  buildTreasureMedallionRangePreview,
  buildTreasureNecklaceOfMissilesPreview,
  buildTreasureNecklaceOfPrayerBeadsPreview,
  buildTreasurePearlOfPowerEffectPreview,
  buildTreasurePearlOfPowerRecallPreview,
  buildTreasurePearlOfWisdomPreview,
  buildTreasurePeriaptProofAgainstPoisonPreview,
  buildTreasurePhylacteryLongYearsPreview,
  buildTreasureQuaalFeatherTokenPreview,
  renderTreasureManualOfGolemsCompact,
  renderTreasureManualOfGolemsDetail,
  renderTreasureMedallionRangeCompact,
  renderTreasureMedallionRangeDetail,
  renderTreasureNecklaceOfMissilesCompact,
  renderTreasureNecklaceOfMissilesDetail,
  renderTreasureNecklaceOfPrayerBeadsCompact,
  renderTreasureNecklaceOfPrayerBeadsDetail,
  renderTreasurePearlOfPowerEffectCompact,
  renderTreasurePearlOfPowerEffectDetail,
  renderTreasurePearlOfPowerRecallCompact,
  renderTreasurePearlOfPowerRecallDetail,
  renderTreasurePearlOfWisdomCompact,
  renderTreasurePearlOfWisdomDetail,
  renderTreasurePeriaptProofAgainstPoisonCompact,
  renderTreasurePeriaptProofAgainstPoisonDetail,
  renderTreasurePhylacteryLongYearsCompact,
  renderTreasurePhylacteryLongYearsDetail,
  renderTreasureQuaalFeatherTokenCompact,
  renderTreasureQuaalFeatherTokenDetail,
} from './miscMagicE4SubtablesRender';
import {
  resolveTreasureManualOfGolems,
  resolveTreasureMedallionRange,
  resolveTreasureMiscMagicE4,
  resolveTreasureNecklaceOfMissiles,
  resolveTreasureNecklaceOfPrayerBeads,
  resolveTreasurePearlOfPowerEffect,
  resolveTreasurePearlOfPowerRecall,
  resolveTreasurePearlOfWisdom,
  resolveTreasurePeriaptProofAgainstPoison,
  resolveTreasurePhylacteryLongYears,
  resolveTreasureQuaalFeatherToken,
} from './miscMagicE4Resolvers';
import { miscMagicE4Followups } from './miscMagicE4Table';
import { pearlOfPowerEffectFollowups } from './miscMagicE4Subtables';

export const miscMagicE4Tables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureMiscMagicE4',
    heading: 'Miscellaneous Magic (Table E.4)',
    event: 'treasureMiscMagicE4',
    resolve: resolveTreasureMiscMagicE4,
    render: {
      detail: renderTreasureMiscMagicE4Detail,
      compact: renderTreasureMiscMagicE4Compact,
    },
    preview: buildTreasureMiscMagicE4Preview,
    followups: miscMagicE4Followups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureManualOfGolems',
    heading: 'Manual of Golems',
    event: 'treasureManualOfGolems',
    resolve: resolveTreasureManualOfGolems,
    render: {
      detail: renderTreasureManualOfGolemsDetail,
      compact: renderTreasureManualOfGolemsCompact,
    },
    preview: buildTreasureManualOfGolemsPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureMedallionRange',
    heading: 'Medallion Details',
    event: 'treasureMedallionRange',
    resolve: resolveTreasureMedallionRange,
    render: {
      detail: renderTreasureMedallionRangeDetail,
      compact: renderTreasureMedallionRangeCompact,
    },
    preview: buildTreasureMedallionRangePreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureNecklaceOfMissiles',
    heading: 'Necklace of Missiles',
    event: 'treasureNecklaceOfMissiles',
    resolve: resolveTreasureNecklaceOfMissiles,
    render: {
      detail: renderTreasureNecklaceOfMissilesDetail,
      compact: renderTreasureNecklaceOfMissilesCompact,
    },
    preview: buildTreasureNecklaceOfMissilesPreview,
  }),
  {
    id: 'treasureNecklaceOfPrayerBeads',
    heading: 'Necklace of Prayer Beads',
    resolver: () => resolveTreasureNecklaceOfPrayerBeads({}),
    resolvePending: () => resolveTreasureNecklaceOfPrayerBeads({}),
    registry: ({ roll }) =>
      resolveTreasureNecklaceOfPrayerBeads({ totalRoll: roll }),
    renderers: {
      renderDetail: renderTreasureNecklaceOfPrayerBeadsDetail,
      renderCompact: renderTreasureNecklaceOfPrayerBeadsCompact,
    },
    buildPreview: buildTreasureNecklaceOfPrayerBeadsPreview,
  },
  defineTreasureFollowupTable({
    id: 'treasurePearlOfPowerEffect',
    heading: 'Pearl of Power Effect',
    event: 'treasurePearlOfPowerEffect',
    resolve: resolveTreasurePearlOfPowerEffect,
    render: {
      detail: renderTreasurePearlOfPowerEffectDetail,
      compact: renderTreasurePearlOfPowerEffectCompact,
    },
    preview: buildTreasurePearlOfPowerEffectPreview,
    followups: pearlOfPowerEffectFollowups,
  }),
  defineTreasureFollowupTable({
    id: 'treasurePearlOfPowerRecall',
    heading: 'Pearl of Power Recall',
    event: 'treasurePearlOfPowerRecall',
    resolve: resolveTreasurePearlOfPowerRecall,
    render: {
      detail: renderTreasurePearlOfPowerRecallDetail,
      compact: renderTreasurePearlOfPowerRecallCompact,
    },
    preview: buildTreasurePearlOfPowerRecallPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasurePearlOfWisdom',
    heading: 'Pearl of Wisdom Outcome',
    event: 'treasurePearlOfWisdom',
    resolve: resolveTreasurePearlOfWisdom,
    render: {
      detail: renderTreasurePearlOfWisdomDetail,
      compact: renderTreasurePearlOfWisdomCompact,
    },
    preview: buildTreasurePearlOfWisdomPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasurePeriaptProofAgainstPoison',
    heading: 'Periapt of Proof Against Poison',
    event: 'treasurePeriaptProofAgainstPoison',
    resolve: resolveTreasurePeriaptProofAgainstPoison,
    render: {
      detail: renderTreasurePeriaptProofAgainstPoisonDetail,
      compact: renderTreasurePeriaptProofAgainstPoisonCompact,
    },
    preview: buildTreasurePeriaptProofAgainstPoisonPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasurePhylacteryLongYears',
    heading: 'Phylactery of Long Years',
    event: 'treasurePhylacteryLongYears',
    resolve: resolveTreasurePhylacteryLongYears,
    render: {
      detail: renderTreasurePhylacteryLongYearsDetail,
      compact: renderTreasurePhylacteryLongYearsCompact,
    },
    preview: buildTreasurePhylacteryLongYearsPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureQuaalFeatherToken',
    heading: "Quaal's Feather Token",
    event: 'treasureQuaalFeatherToken',
    resolve: resolveTreasureQuaalFeatherToken,
    render: {
      detail: renderTreasureQuaalFeatherTokenDetail,
      compact: renderTreasureQuaalFeatherTokenCompact,
    },
    preview: buildTreasureQuaalFeatherTokenPreview,
  }),
];
