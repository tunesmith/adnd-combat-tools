import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
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

type TreasureRegistryContext = {
  kind?: string;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

function readTreasureContext(context?: TreasureRegistryContext): {
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
} {
  if (context?.kind !== 'treasureMagic') return {};
  return {
    level: context.level,
    treasureRoll: context.treasureRoll,
    rollIndex: context.rollIndex,
  };
}

export const miscMagicE1Tables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureMiscMagicE1',
    heading: 'Miscellaneous Magic (Table E.1)',
    resolver: wrapResolver(resolveTreasureMiscMagicE1),
    renderers: {
      renderDetail: renderTreasureMiscMagicE1Detail,
      renderCompact: renderTreasureMiscMagicE1Compact,
    },
    buildPreview: buildTreasureMiscMagicE1Preview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasureMiscMagicE1({
        roll,
        level,
        treasureRoll,
        rollIndex,
      });
    },
  },
  {
    id: 'treasureBagOfHolding',
    heading: 'Bag of Holding Capacity',
    resolver: wrapResolver(resolveTreasureBagOfHolding),
    renderers: {
      renderDetail: renderTreasureBagOfHoldingDetail,
      renderCompact: renderTreasureBagOfHoldingCompact,
    },
    buildPreview: buildTreasureBagOfHoldingPreview,
  },
  {
    id: 'treasureBagOfTricks',
    heading: 'Bag of Tricks Type',
    resolver: wrapResolver(resolveTreasureBagOfTricks),
    renderers: {
      renderDetail: renderTreasureBagOfTricksDetail,
      renderCompact: renderTreasureBagOfTricksCompact,
    },
    buildPreview: buildTreasureBagOfTricksPreview,
  },
  {
    id: 'treasureBracersOfDefense',
    heading: 'Bracers of Defense Armor Class',
    resolver: wrapResolver(resolveTreasureBracersOfDefense),
    renderers: {
      renderDetail: renderTreasureBracersOfDefenseDetail,
      renderCompact: renderTreasureBracersOfDefenseCompact,
    },
    buildPreview: buildTreasureBracersOfDefensePreview,
  },
  {
    id: 'treasureBucknardsEverfullPurse',
    heading: "Bucknard's Everfull Purse Contents",
    resolver: wrapResolver(resolveTreasureBucknardsEverfullPurse),
    renderers: {
      renderDetail: renderTreasureBucknardsEverfullPurseDetail,
      renderCompact: renderTreasureBucknardsEverfullPurseCompact,
    },
    buildPreview: buildTreasureBucknardsEverfullPursePreview,
  },
  {
    id: 'treasureArtifactOrRelic',
    heading: 'Artifact or Relic',
    resolver: wrapResolver(resolveTreasureArtifactOrRelic),
    renderers: {
      renderDetail: renderTreasureArtifactOrRelicDetail,
      renderCompact: renderTreasureArtifactOrRelicCompact,
    },
    buildPreview: buildTreasureArtifactOrRelicPreview,
  },
];
