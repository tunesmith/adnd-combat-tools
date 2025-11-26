import type { DungeonTableDefinition } from '../../types';
import {
  buildGalleryStairLocationPreview,
  buildGalleryStairOccurrencePreview,
  buildRiverBoatBankPreview,
  buildRiverConstructionPreview,
  buildSpecialPassagePreview,
  buildStreamConstructionPreview,
  renderGalleryStairLocationCompact,
  renderGalleryStairLocationDetail,
  renderGalleryStairOccurrenceCompact,
  renderGalleryStairOccurrenceDetail,
  renderRiverConstructionCompact,
  renderRiverConstructionDetail,
  renderSpecialPassageCompactNodes,
  renderSpecialPassageDetail,
} from './specialPassageRender';
import {
  resolveGalleryStairLocation,
  resolveGalleryStairOccurrence,
  resolveRiverBoatBank,
  resolveRiverConstruction,
  resolveSpecialPassage,
  resolveStreamConstruction,
} from './specialPassageResolvers';
import { GalleryStairLocation, RiverConstruction } from './specialPassageTable';
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
    resolvePending: () => resolveGalleryStairLocation({}),
    postProcessChildren: (node, children, resolveNode) => {
      const result = (node.event as { result?: unknown }).result;
      if (
        result === GalleryStairLocation.PassageEnd &&
        !children.some((c) => c.event.kind === 'galleryStairOccurrence')
      ) {
        const occurrence = resolveNode(resolveGalleryStairOccurrence({}));
        if (occurrence) return [...children, occurrence];
      }
      return children;
    },
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
    resolvePending: () => resolveGalleryStairOccurrence({}),
  },
  {
    id: 'streamConstruction',
    heading: 'Stream Construction',
    resolver: wrapResolver(resolveStreamConstruction),
    renderers: {
      renderDetail: (_node, _append) => [],
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildStreamConstructionPreview,
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
    resolvePending: () => resolveRiverConstruction({}),
    postProcessChildren: (node, children, resolveNode) => {
      const result = (node.event as { result?: unknown }).result;
      if (
        result === RiverConstruction.Boat &&
        !children.some((c) => c.event.kind === 'riverBoatBank')
      ) {
        const bank = resolveNode(resolveRiverBoatBank({}));
        if (bank) return [...children, bank];
      }
      return children;
    },
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
    resolvePending: () => resolveRiverBoatBank({}),
  },
];
