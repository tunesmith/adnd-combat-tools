import type { DungeonTableDefinition } from '../../types';
import {
  defineTreasureFollowupTable,
  defineTreasureMagicTable,
} from '../shared';
import {
  buildTreasureMiscMagicE1Preview,
  renderTreasureMiscMagicE1Compact,
  renderTreasureMiscMagicE1Detail,
} from './miscMagicE1Render';
import {
  buildTreasureArtifactOrRelicPreview,
  buildTreasureBagOfHoldingPreview,
  buildTreasureBagOfTricksPreview,
  buildTreasureBracersOfDefensePreview,
  buildTreasureBucknardsEverfullPursePreview,
  renderTreasureArtifactOrRelicCompact,
  renderTreasureArtifactOrRelicDetail,
  renderTreasureBagOfHoldingCompact,
  renderTreasureBagOfHoldingDetail,
  renderTreasureBagOfTricksCompact,
  renderTreasureBagOfTricksDetail,
  renderTreasureBracersOfDefenseCompact,
  renderTreasureBracersOfDefenseDetail,
  renderTreasureBucknardsEverfullPurseCompact,
  renderTreasureBucknardsEverfullPurseDetail,
} from './miscMagicE1SubtablesRender';
import {
  resolveTreasureArtifactOrRelic,
  resolveTreasureBagOfHolding,
  resolveTreasureBagOfTricks,
  resolveTreasureBracersOfDefense,
  resolveTreasureBucknardsEverfullPurse,
  resolveTreasureMiscMagicE1,
} from './miscMagicE1Resolvers';
import { miscMagicE1Followups } from './miscMagicE1Table';

export const miscMagicE1Tables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureMiscMagicE1',
    heading: 'Miscellaneous Magic (Table E.1)',
    event: 'treasureMiscMagicE1',
    resolve: resolveTreasureMiscMagicE1,
    render: {
      detail: renderTreasureMiscMagicE1Detail,
      compact: renderTreasureMiscMagicE1Compact,
    },
    preview: buildTreasureMiscMagicE1Preview,
    followups: miscMagicE1Followups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureBagOfHolding',
    heading: 'Bag of Holding Capacity',
    event: 'treasureBagOfHolding',
    resolve: resolveTreasureBagOfHolding,
    render: {
      detail: renderTreasureBagOfHoldingDetail,
      compact: renderTreasureBagOfHoldingCompact,
    },
    preview: buildTreasureBagOfHoldingPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureBagOfTricks',
    heading: 'Bag of Tricks Type',
    event: 'treasureBagOfTricks',
    resolve: resolveTreasureBagOfTricks,
    render: {
      detail: renderTreasureBagOfTricksDetail,
      compact: renderTreasureBagOfTricksCompact,
    },
    preview: buildTreasureBagOfTricksPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureBracersOfDefense',
    heading: 'Bracers of Defense Armor Class',
    event: 'treasureBracersOfDefense',
    resolve: resolveTreasureBracersOfDefense,
    render: {
      detail: renderTreasureBracersOfDefenseDetail,
      compact: renderTreasureBracersOfDefenseCompact,
    },
    preview: buildTreasureBracersOfDefensePreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureBucknardsEverfullPurse',
    heading: "Bucknard's Everfull Purse Contents",
    event: 'treasureBucknardsEverfullPurse',
    resolve: resolveTreasureBucknardsEverfullPurse,
    render: {
      detail: renderTreasureBucknardsEverfullPurseDetail,
      compact: renderTreasureBucknardsEverfullPurseCompact,
    },
    preview: buildTreasureBucknardsEverfullPursePreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureArtifactOrRelic',
    heading: 'Artifact or Relic',
    event: 'treasureArtifactOrRelic',
    resolve: resolveTreasureArtifactOrRelic,
    render: {
      detail: renderTreasureArtifactOrRelicDetail,
      compact: renderTreasureArtifactOrRelicCompact,
    },
    preview: buildTreasureArtifactOrRelicPreview,
  }),
];
