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
  defineSpecialPassageTable,
  postProcessGalleryStairLocationChildren,
  postProcessRiverConstructionChildren,
} from './specialPassageManifestHelpers';
import { NO_COMPACT_RENDER, withoutAppend } from '../../shared';

export const specialPassageTables: ReadonlyArray<DungeonTableDefinition> = [
  defineSpecialPassageTable({
    id: 'specialPassage',
    heading: 'Special Passage',
    event: 'specialPassage',
    resolve: resolveSpecialPassage,
    render: {
      detail: renderSpecialPassageDetail,
      compact: withoutAppend(renderSpecialPassageCompactNodes),
    },
    preview: buildSpecialPassagePreview,
  }),
  defineSpecialPassageTable({
    id: 'galleryStairLocation',
    heading: 'Gallery Stair Location',
    event: 'galleryStairLocation',
    resolve: resolveGalleryStairLocation,
    render: {
      detail: renderGalleryStairLocationDetail,
      compact: renderGalleryStairLocationCompact,
    },
    preview: buildGalleryStairLocationPreview,
    postProcessChildren: postProcessGalleryStairLocationChildren,
  }),
  defineSpecialPassageTable({
    id: 'galleryStairOccurrence',
    heading: 'Gallery Stair Occurrence',
    event: 'galleryStairOccurrence',
    resolve: resolveGalleryStairOccurrence,
    render: {
      detail: renderGalleryStairOccurrenceDetail,
      compact: withoutAppend(renderGalleryStairOccurrenceCompact),
    },
    preview: buildGalleryStairOccurrencePreview,
  }),
  defineSpecialPassageTable({
    id: 'streamConstruction',
    heading: 'Stream Construction',
    event: 'streamConstruction',
    resolve: resolveStreamConstruction,
    render: {
      detail: renderStreamConstructionDetail,
      compact: NO_COMPACT_RENDER,
    },
    preview: buildStreamConstructionPreview,
  }),
  defineSpecialPassageTable({
    id: 'riverConstruction',
    heading: 'River Construction',
    event: 'riverConstruction',
    resolve: resolveRiverConstruction,
    render: {
      detail: renderRiverConstructionDetail,
      compact: renderRiverConstructionCompact,
    },
    preview: buildRiverConstructionPreview,
    postProcessChildren: postProcessRiverConstructionChildren,
  }),
  defineSpecialPassageTable({
    id: 'riverBoatBank',
    heading: 'Boat Bank',
    event: 'riverBoatBank',
    resolve: resolveRiverBoatBank,
    render: {
      detail: (_node, _append) => [],
      compact: NO_COMPACT_RENDER,
    },
    preview: buildRiverBoatBankPreview,
  }),
];
