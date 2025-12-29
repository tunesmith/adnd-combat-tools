import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { createTreasureMagicContextHandlers } from '../shared';
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

export const miscMagicE4Tables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureMiscMagicE4',
    heading: 'Miscellaneous Magic (Table E.4)',
    resolver: wrapResolver(resolveTreasureMiscMagicE4),
    ...createTreasureMagicContextHandlers(resolveTreasureMiscMagicE4),
    renderers: {
      renderDetail: renderTreasureMiscMagicE4Detail,
      renderCompact: renderTreasureMiscMagicE4Compact,
    },
    buildPreview: buildTreasureMiscMagicE4Preview,
  },
  {
    id: 'treasureManualOfGolems',
    heading: 'Manual of Golems',
    resolver: wrapResolver(resolveTreasureManualOfGolems),
    resolvePending: () => resolveTreasureManualOfGolems({}),
    renderers: {
      renderDetail: renderTreasureManualOfGolemsDetail,
      renderCompact: renderTreasureManualOfGolemsCompact,
    },
    buildPreview: buildTreasureManualOfGolemsPreview,
  },
  {
    id: 'treasureMedallionRange',
    heading: 'Medallion Details',
    resolver: wrapResolver(resolveTreasureMedallionRange),
    resolvePending: () => resolveTreasureMedallionRange({}),
    renderers: {
      renderDetail: renderTreasureMedallionRangeDetail,
      renderCompact: renderTreasureMedallionRangeCompact,
    },
    buildPreview: buildTreasureMedallionRangePreview,
  },
  {
    id: 'treasureNecklaceOfMissiles',
    heading: 'Necklace of Missiles',
    resolver: wrapResolver(resolveTreasureNecklaceOfMissiles),
    resolvePending: () => resolveTreasureNecklaceOfMissiles({}),
    renderers: {
      renderDetail: renderTreasureNecklaceOfMissilesDetail,
      renderCompact: renderTreasureNecklaceOfMissilesCompact,
    },
    buildPreview: buildTreasureNecklaceOfMissilesPreview,
  },
  {
    id: 'treasureNecklaceOfPrayerBeads',
    heading: 'Necklace of Prayer Beads',
    resolver: wrapResolver(resolveTreasureNecklaceOfPrayerBeads),
    resolvePending: () => resolveTreasureNecklaceOfPrayerBeads({}),
    registry: ({ roll }) =>
      resolveTreasureNecklaceOfPrayerBeads({ totalRoll: roll }),
    renderers: {
      renderDetail: renderTreasureNecklaceOfPrayerBeadsDetail,
      renderCompact: renderTreasureNecklaceOfPrayerBeadsCompact,
    },
    buildPreview: buildTreasureNecklaceOfPrayerBeadsPreview,
  },
  {
    id: 'treasurePearlOfPowerEffect',
    heading: 'Pearl of Power Effect',
    resolver: wrapResolver(resolveTreasurePearlOfPowerEffect),
    resolvePending: () => resolveTreasurePearlOfPowerEffect({}),
    renderers: {
      renderDetail: renderTreasurePearlOfPowerEffectDetail,
      renderCompact: renderTreasurePearlOfPowerEffectCompact,
    },
    buildPreview: buildTreasurePearlOfPowerEffectPreview,
  },
  {
    id: 'treasurePearlOfPowerRecall',
    heading: 'Pearl of Power Recall',
    resolver: wrapResolver(resolveTreasurePearlOfPowerRecall),
    resolvePending: () => resolveTreasurePearlOfPowerRecall({}),
    renderers: {
      renderDetail: renderTreasurePearlOfPowerRecallDetail,
      renderCompact: renderTreasurePearlOfPowerRecallCompact,
    },
    buildPreview: buildTreasurePearlOfPowerRecallPreview,
  },
  {
    id: 'treasurePearlOfWisdom',
    heading: 'Pearl of Wisdom Outcome',
    resolver: wrapResolver(resolveTreasurePearlOfWisdom),
    resolvePending: () => resolveTreasurePearlOfWisdom({}),
    renderers: {
      renderDetail: renderTreasurePearlOfWisdomDetail,
      renderCompact: renderTreasurePearlOfWisdomCompact,
    },
    buildPreview: buildTreasurePearlOfWisdomPreview,
  },
  {
    id: 'treasurePeriaptProofAgainstPoison',
    heading: 'Periapt of Proof Against Poison',
    resolver: wrapResolver(resolveTreasurePeriaptProofAgainstPoison),
    resolvePending: () => resolveTreasurePeriaptProofAgainstPoison({}),
    renderers: {
      renderDetail: renderTreasurePeriaptProofAgainstPoisonDetail,
      renderCompact: renderTreasurePeriaptProofAgainstPoisonCompact,
    },
    buildPreview: buildTreasurePeriaptProofAgainstPoisonPreview,
  },
  {
    id: 'treasurePhylacteryLongYears',
    heading: 'Phylactery of Long Years',
    resolver: wrapResolver(resolveTreasurePhylacteryLongYears),
    resolvePending: () => resolveTreasurePhylacteryLongYears({}),
    renderers: {
      renderDetail: renderTreasurePhylacteryLongYearsDetail,
      renderCompact: renderTreasurePhylacteryLongYearsCompact,
    },
    buildPreview: buildTreasurePhylacteryLongYearsPreview,
  },
  {
    id: 'treasureQuaalFeatherToken',
    heading: "Quaal's Feather Token",
    resolver: wrapResolver(resolveTreasureQuaalFeatherToken),
    resolvePending: () => resolveTreasureQuaalFeatherToken({}),
    renderers: {
      renderDetail: renderTreasureQuaalFeatherTokenDetail,
      renderCompact: renderTreasureQuaalFeatherTokenCompact,
    },
    buildPreview: buildTreasureQuaalFeatherTokenPreview,
  },
];
