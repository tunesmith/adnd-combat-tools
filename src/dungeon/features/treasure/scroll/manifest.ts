import type { DungeonTableDefinition } from '../../types';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';
import {
  createTreasureMagicContextHandlers,
  createTreasureMagicEventPreviewBuilder,
} from '../shared';
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

export const scrollTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureScroll',
    heading: 'Scroll',
    resolver: wrapResolver(resolveTreasureScroll),
    ...createTreasureMagicContextHandlers(resolveTreasureScroll),
    renderers: {
      renderDetail: renderTreasureScrollDetail,
      renderCompact: renderTreasureScrollCompact,
    },
    buildPreview: buildTreasureScrollPreview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureScroll',
      buildTreasureScrollPreview
    ),
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
    buildEventPreview: (node) =>
      node.event.kind === 'treasureScrollProtectionElementals'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureScrollProtectionElementalsPreview
          )
        : undefined,
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
    buildEventPreview: (node) =>
      node.event.kind === 'treasureScrollProtectionLycanthropes'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureScrollProtectionLycanthropesPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureScrollProtectionLycanthropes({}),
  },
];
