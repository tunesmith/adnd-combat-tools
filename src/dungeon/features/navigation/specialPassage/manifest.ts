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
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';

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
    buildEventPreview: (node) =>
      node.event.kind === 'specialPassage'
        ? buildEventPreviewFromFactory(node, buildSpecialPassagePreview)
        : undefined,
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
    buildEventPreview: (node) =>
      node.event.kind === 'galleryStairLocation'
        ? buildEventPreviewFromFactory(node, buildGalleryStairLocationPreview)
        : undefined,
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
    buildEventPreview: (node) =>
      node.event.kind === 'galleryStairOccurrence'
        ? buildEventPreviewFromFactory(node, buildGalleryStairOccurrencePreview)
        : undefined,
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
    buildEventPreview: (node) =>
      node.event.kind === 'streamConstruction'
        ? buildEventPreviewFromFactory(node, buildStreamConstructionPreview)
        : undefined,
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
    buildEventPreview: (node) =>
      node.event.kind === 'riverConstruction'
        ? buildEventPreviewFromFactory(node, buildRiverConstructionPreview)
        : undefined,
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
    buildEventPreview: (node) =>
      node.event.kind === 'riverBoatBank'
        ? buildEventPreviewFromFactory(node, buildRiverBoatBankPreview)
        : undefined,
    resolvePending: () => resolveRiverBoatBank({}),
  },
];
