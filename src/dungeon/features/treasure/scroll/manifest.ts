import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { readTreasureMagicContext } from '../shared';
import {
  buildTreasureScrollPreview,
  buildTreasureScrollProtectionElementalsPreview,
  buildTreasureScrollProtectionLycanthropesPreview,
  renderTreasureScrollCompact,
  renderTreasureScrollDetail,
  renderTreasureScrollProtectionElementalsCompact,
  renderTreasureScrollProtectionElementalsDetail,
  renderTreasureScrollProtectionLycanthropesCompact,
  renderTreasureScrollProtectionLycanthropesDetail,
} from './scrollRender';
import {
  resolveTreasureScroll,
  resolveTreasureScrollProtectionElementals,
  resolveTreasureScrollProtectionLycanthropes,
} from './scrollResolvers';

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

export const scrollTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureScroll',
    heading: 'Scroll',
    resolver: wrapResolver(resolveTreasureScroll),
    renderers: {
      renderDetail: renderTreasureScrollDetail,
      renderCompact: renderTreasureScrollCompact,
    },
    buildPreview: buildTreasureScrollPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasureScroll({ roll, level, treasureRoll, rollIndex });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureScroll(context);
    },
  },
  {
    id: 'treasureScrollProtectionElementals',
    heading: 'Protection from Elementals',
    resolver: wrapResolver(resolveTreasureScrollProtectionElementals),
    renderers: {
      renderDetail: renderTreasureScrollProtectionElementalsDetail,
      renderCompact: renderTreasureScrollProtectionElementalsCompact,
    },
    buildPreview: buildTreasureScrollProtectionElementalsPreview,
    resolvePending: () => resolveTreasureScrollProtectionElementals({}),
  },
  {
    id: 'treasureScrollProtectionLycanthropes',
    heading: 'Protection from Lycanthropes',
    resolver: wrapResolver(resolveTreasureScrollProtectionLycanthropes),
    renderers: {
      renderDetail: renderTreasureScrollProtectionLycanthropesDetail,
      renderCompact: renderTreasureScrollProtectionLycanthropesCompact,
    },
    buildPreview: buildTreasureScrollProtectionLycanthropesPreview,
    resolvePending: () => resolveTreasureScrollProtectionLycanthropes({}),
  },
];
