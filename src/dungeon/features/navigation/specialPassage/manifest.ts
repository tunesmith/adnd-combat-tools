import type { DungeonTableDefinition } from '../../types';
import {
  buildSpecialPassagePreview,
  renderSpecialPassageCompactNodes,
  renderSpecialPassageDetail,
} from './specialPassageRender';
import {
  buildGalleryStairLocationPreview,
  buildGalleryStairOccurrencePreview,
  buildRiverBoatBankPreview,
  buildRiverConstructionPreview,
  buildStreamConstructionPreview,
} from './specialPassagePreview';
import {
  renderGalleryStairLocationCompact,
  renderGalleryStairLocationDetail,
  renderGalleryStairOccurrenceCompact,
  renderGalleryStairOccurrenceDetail,
  renderRiverConstructionCompact,
  renderRiverConstructionDetail,
  renderStreamConstructionDetail,
} from './specialPassageSubtableRender';
import {
  resolveGalleryStairLocation,
  resolveGalleryStairOccurrence,
  resolveRiverBoatBank,
  resolveRiverConstruction,
  resolveSpecialPassage,
  resolveStreamConstruction,
} from './specialPassageResolvers';
import {
  buildGalleryStairLocationEventPreview,
  buildGalleryStairOccurrenceEventPreview,
  buildRiverBoatBankEventPreview,
  buildRiverConstructionEventPreview,
  buildSpecialPassageEventPreview,
  buildStreamConstructionEventPreview,
  postProcessGalleryStairLocationChildren,
  postProcessRiverConstructionChildren,
} from './specialPassageManifestHelpers';
import { NO_COMPACT_RENDER, withoutAppend } from '../shared';
import { wrapResolver } from '../../shared';

export const specialPassageTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'specialPassage',
    heading: 'Special Passage',
    resolver: wrapResolver(resolveSpecialPassage),
    renderers: {
      renderDetail: renderSpecialPassageDetail,
      renderCompact: withoutAppend(renderSpecialPassageCompactNodes),
    },
    buildPreview: buildSpecialPassagePreview,
    buildEventPreview: buildSpecialPassageEventPreview,
    resolvePending: () => resolveSpecialPassage({}),
  },
  {
    id: 'galleryStairLocation',
    heading: 'Gallery Stair Location',
    resolver: wrapResolver(resolveGalleryStairLocation),
    renderers: {
      renderDetail: renderGalleryStairLocationDetail,
      renderCompact: renderGalleryStairLocationCompact,
    },
    buildPreview: buildGalleryStairLocationPreview,
    buildEventPreview: buildGalleryStairLocationEventPreview,
    resolvePending: () => resolveGalleryStairLocation({}),
    postProcessChildren: postProcessGalleryStairLocationChildren,
  },
  {
    id: 'galleryStairOccurrence',
    heading: 'Gallery Stair Occurrence',
    resolver: wrapResolver(resolveGalleryStairOccurrence),
    renderers: {
      renderDetail: renderGalleryStairOccurrenceDetail,
      renderCompact: withoutAppend(renderGalleryStairOccurrenceCompact),
    },
    buildPreview: buildGalleryStairOccurrencePreview,
    buildEventPreview: buildGalleryStairOccurrenceEventPreview,
    resolvePending: () => resolveGalleryStairOccurrence({}),
  },
  {
    id: 'streamConstruction',
    heading: 'Stream Construction',
    resolver: wrapResolver(resolveStreamConstruction),
    renderers: {
      renderDetail: renderStreamConstructionDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildStreamConstructionPreview,
    buildEventPreview: buildStreamConstructionEventPreview,
    resolvePending: () => resolveStreamConstruction({}),
  },
  {
    id: 'riverConstruction',
    heading: 'River Construction',
    resolver: wrapResolver(resolveRiverConstruction),
    renderers: {
      renderDetail: renderRiverConstructionDetail,
      renderCompact: renderRiverConstructionCompact,
    },
    buildPreview: buildRiverConstructionPreview,
    buildEventPreview: buildRiverConstructionEventPreview,
    resolvePending: () => resolveRiverConstruction({}),
    postProcessChildren: postProcessRiverConstructionChildren,
  },
  {
    id: 'riverBoatBank',
    heading: 'Boat Bank',
    resolver: wrapResolver(resolveRiverBoatBank),
    renderers: {
      renderDetail: (_node, _append) => [],
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildRiverBoatBankPreview,
    buildEventPreview: buildRiverBoatBankEventPreview,
    resolvePending: () => resolveRiverBoatBank({}),
  },
];
