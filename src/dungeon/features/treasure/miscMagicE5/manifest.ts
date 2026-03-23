import type { DungeonTableDefinition } from '../../types';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';
import {
  createTreasureMagicContextHandlers,
  createTreasureMagicEventPreviewBuilder,
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

export const miscMagicE5Tables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureMiscMagicE5',
    heading: 'Miscellaneous Magic (Table E.5)',
    resolver: wrapResolver(resolveTreasureMiscMagicE5),
    ...createTreasureMagicContextHandlers(resolveTreasureMiscMagicE5),
    renderers: {
      renderDetail: renderTreasureMiscMagicE5Detail,
      renderCompact: renderTreasureMiscMagicE5Compact,
    },
    buildPreview: buildTreasureMiscMagicE5Preview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureMiscMagicE5',
      buildTreasureMiscMagicE5Preview
    ),
  },
  {
    id: 'treasureRobeOfTheArchmagi',
    heading: 'Robe of the Archmagi Alignment',
    resolver: wrapResolver(resolveTreasureRobeOfTheArchmagi),
    resolvePending: () => resolveTreasureRobeOfTheArchmagi({}),
    renderers: {
      renderDetail: renderTreasureRobeOfTheArchmagiDetail,
      renderCompact: renderTreasureRobeOfTheArchmagiCompact,
    },
    buildPreview: buildTreasureRobeOfTheArchmagiPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureRobeOfTheArchmagi'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureRobeOfTheArchmagiPreview
          )
        : undefined,
  },
  {
    id: 'treasureScarabOfProtectionCurse',
    heading: 'Scarab of Protection (curse check)',
    resolver: wrapResolver(resolveTreasureScarabOfProtectionCurse),
    resolvePending: () => resolveTreasureScarabOfProtectionCurse({}),
    renderers: {
      renderDetail: renderTreasureScarabOfProtectionCurseDetail,
      renderCompact: renderTreasureScarabOfProtectionCurseCompact,
    },
    buildPreview: buildTreasureScarabOfProtectionCursePreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureScarabOfProtectionCurse'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureScarabOfProtectionCursePreview
          )
        : undefined,
  },
  {
    id: 'treasureScarabOfProtectionCurseResolution',
    heading: 'Scarab of Protection (curse resolution)',
    resolver: wrapResolver(resolveTreasureScarabOfProtectionCurseResolution),
    resolvePending: () => resolveTreasureScarabOfProtectionCurseResolution({}),
    renderers: {
      renderDetail: renderTreasureScarabOfProtectionCurseResolutionDetail,
      renderCompact: renderTreasureScarabOfProtectionCurseResolutionCompact,
    },
    buildPreview: buildTreasureScarabOfProtectionCurseResolutionPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureScarabOfProtectionCurseResolution'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureScarabOfProtectionCurseResolutionPreview
          )
        : undefined,
  },
  {
    id: 'treasureRobeOfUsefulItems',
    heading: 'Robe of Useful Items',
    resolver: wrapResolver(resolveTreasureRobeOfUsefulItems),
    registry: () => resolveTreasureRobeOfUsefulItems({}),
    renderers: {
      renderDetail: renderTreasureRobeOfUsefulItemsDetail,
      renderCompact: renderTreasureRobeOfUsefulItemsCompact,
    },
  },
];
