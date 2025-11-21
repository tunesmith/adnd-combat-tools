import type { DungeonTableDefinition } from '../../types';
import {
  renderSidePassagesDetail,
  renderSidePassagesCompactNodes,
  buildSidePassagePreview,
} from '../../../adapters/render/sidePassage';
import {
  renderPassageTurnsDetail,
  renderPassageTurnsCompactNodes,
  buildPassageTurnPreview,
} from '../../../adapters/render/passageTurns';
import {
  renderPassageWidthDetail,
  renderPassageWidthCompactNodes,
  buildPassageWidthPreview,
} from '../../../adapters/render/passageWidth';
import {
  renderSpecialPassageDetail,
  renderSpecialPassageCompactNodes,
  renderGalleryStairLocationDetail,
  renderGalleryStairLocationCompact,
  renderGalleryStairOccurrenceDetail,
  renderGalleryStairOccurrenceCompact,
  renderRiverConstructionDetail,
  renderRiverConstructionCompact,
  buildSpecialPassagePreview,
  buildGalleryStairLocationPreview,
  buildGalleryStairOccurrencePreview,
  buildStreamConstructionPreview,
  buildRiverConstructionPreview,
  buildRiverBoatBankPreview,
} from '../../../adapters/render/specialPassage';
import {
  resolveGalleryStairLocation,
  resolveGalleryStairOccurrence,
  resolveSpecialPassage,
  resolveStreamConstruction,
  resolveRiverConstruction,
  resolveRiverBoatBank,
  resolvePassageTurns,
  resolvePassageWidth,
  resolveSidePassages,
} from '../../../domain/resolvers';
import {
  NO_COMPACT_RENDER,
  wrapResolver,
  withoutAppend,
} from '../shared';
import { GalleryStairLocation, RiverConstruction } from '../../../../tables/dungeon/specialPassage';

export const passageTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'sidePassages',
    heading: 'Side Passages',
    resolver: wrapResolver(resolveSidePassages),
    renderers: {
      renderDetail: renderSidePassagesDetail,
      renderCompact: withoutAppend(renderSidePassagesCompactNodes),
    },
    buildPreview: buildSidePassagePreview,
    resolvePending: () => resolveSidePassages({}),
  },
  {
    id: 'passageTurns',
    heading: 'Passage Turns',
    resolver: wrapResolver(resolvePassageTurns),
    renderers: {
      renderDetail: renderPassageTurnsDetail,
      renderCompact: withoutAppend(renderPassageTurnsCompactNodes),
    },
    buildPreview: buildPassageTurnPreview,
    resolvePending: () => resolvePassageTurns({}),
  },
  {
    id: 'passageWidth',
    heading: 'Passage Width',
    resolver: wrapResolver(resolvePassageWidth),
    renderers: {
      renderDetail: renderPassageWidthDetail,
      renderCompact: withoutAppend(renderPassageWidthCompactNodes),
    },
    buildPreview: buildPassageWidthPreview,
    resolvePending: () => resolvePassageWidth({}),
  },
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
