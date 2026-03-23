import type { DungeonTableDefinition } from '../../types';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';
import {
  createTreasureMagicContextHandlers,
  createTreasureMagicEventPreviewBuilder,
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

export const miscMagicE1Tables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureMiscMagicE1',
    heading: 'Miscellaneous Magic (Table E.1)',
    resolver: wrapResolver(resolveTreasureMiscMagicE1),
    ...createTreasureMagicContextHandlers(resolveTreasureMiscMagicE1),
    renderers: {
      renderDetail: renderTreasureMiscMagicE1Detail,
      renderCompact: renderTreasureMiscMagicE1Compact,
    },
    buildPreview: buildTreasureMiscMagicE1Preview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureMiscMagicE1',
      buildTreasureMiscMagicE1Preview
    ),
  },
  {
    id: 'treasureBagOfHolding',
    heading: 'Bag of Holding Capacity',
    resolver: wrapResolver(resolveTreasureBagOfHolding),
    resolvePending: () => resolveTreasureBagOfHolding({}),
    renderers: {
      renderDetail: renderTreasureBagOfHoldingDetail,
      renderCompact: renderTreasureBagOfHoldingCompact,
    },
    buildPreview: buildTreasureBagOfHoldingPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureBagOfHolding'
        ? buildEventPreviewFromFactory(node, buildTreasureBagOfHoldingPreview)
        : undefined,
  },
  {
    id: 'treasureBagOfTricks',
    heading: 'Bag of Tricks Type',
    resolver: wrapResolver(resolveTreasureBagOfTricks),
    resolvePending: () => resolveTreasureBagOfTricks({}),
    renderers: {
      renderDetail: renderTreasureBagOfTricksDetail,
      renderCompact: renderTreasureBagOfTricksCompact,
    },
    buildPreview: buildTreasureBagOfTricksPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureBagOfTricks'
        ? buildEventPreviewFromFactory(node, buildTreasureBagOfTricksPreview)
        : undefined,
  },
  {
    id: 'treasureBracersOfDefense',
    heading: 'Bracers of Defense Armor Class',
    resolver: wrapResolver(resolveTreasureBracersOfDefense),
    resolvePending: () => resolveTreasureBracersOfDefense({}),
    renderers: {
      renderDetail: renderTreasureBracersOfDefenseDetail,
      renderCompact: renderTreasureBracersOfDefenseCompact,
    },
    buildPreview: buildTreasureBracersOfDefensePreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureBracersOfDefense'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureBracersOfDefensePreview
          )
        : undefined,
  },
  {
    id: 'treasureBucknardsEverfullPurse',
    heading: "Bucknard's Everfull Purse Contents",
    resolver: wrapResolver(resolveTreasureBucknardsEverfullPurse),
    resolvePending: () => resolveTreasureBucknardsEverfullPurse({}),
    renderers: {
      renderDetail: renderTreasureBucknardsEverfullPurseDetail,
      renderCompact: renderTreasureBucknardsEverfullPurseCompact,
    },
    buildPreview: buildTreasureBucknardsEverfullPursePreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureBucknardsEverfullPurse'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureBucknardsEverfullPursePreview
          )
        : undefined,
  },
  {
    id: 'treasureArtifactOrRelic',
    heading: 'Artifact or Relic',
    resolver: wrapResolver(resolveTreasureArtifactOrRelic),
    resolvePending: () => resolveTreasureArtifactOrRelic({}),
    renderers: {
      renderDetail: renderTreasureArtifactOrRelicDetail,
      renderCompact: renderTreasureArtifactOrRelicCompact,
    },
    buildPreview: buildTreasureArtifactOrRelicPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureArtifactOrRelic'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureArtifactOrRelicPreview
          )
        : undefined,
  },
];
