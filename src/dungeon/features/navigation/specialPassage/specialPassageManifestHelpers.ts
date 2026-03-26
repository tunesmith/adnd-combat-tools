import { buildEventPreviewFromFactory } from '../../shared';
import type { DungeonTableDefinition } from '../../types';
import {
  buildGalleryStairLocationPreview,
  buildGalleryStairOccurrencePreview,
  buildRiverBoatBankPreview,
  buildRiverConstructionPreview,
  buildSpecialPassagePreview,
  buildStreamConstructionPreview,
} from './specialPassagePreview';
import {
  resolveGalleryStairOccurrence,
  resolveRiverBoatBank,
} from './specialPassageResolvers';
import { GalleryStairLocation, RiverConstruction } from './specialPassageTable';

type PostProcessChildren = NonNullable<
  DungeonTableDefinition['postProcessChildren']
>;

export const buildSpecialPassageEventPreview = (
  node: Parameters<NonNullable<DungeonTableDefinition['buildEventPreview']>>[0]
) =>
  node.event.kind === 'specialPassage'
    ? buildEventPreviewFromFactory(node, buildSpecialPassagePreview)
    : undefined;

export const buildGalleryStairLocationEventPreview = (
  node: Parameters<NonNullable<DungeonTableDefinition['buildEventPreview']>>[0]
) =>
  node.event.kind === 'galleryStairLocation'
    ? buildEventPreviewFromFactory(node, buildGalleryStairLocationPreview)
    : undefined;

export const buildGalleryStairOccurrenceEventPreview = (
  node: Parameters<NonNullable<DungeonTableDefinition['buildEventPreview']>>[0]
) =>
  node.event.kind === 'galleryStairOccurrence'
    ? buildEventPreviewFromFactory(node, buildGalleryStairOccurrencePreview)
    : undefined;

export const buildStreamConstructionEventPreview = (
  node: Parameters<NonNullable<DungeonTableDefinition['buildEventPreview']>>[0]
) =>
  node.event.kind === 'streamConstruction'
    ? buildEventPreviewFromFactory(node, buildStreamConstructionPreview)
    : undefined;

export const buildRiverConstructionEventPreview = (
  node: Parameters<NonNullable<DungeonTableDefinition['buildEventPreview']>>[0]
) =>
  node.event.kind === 'riverConstruction'
    ? buildEventPreviewFromFactory(node, buildRiverConstructionPreview)
    : undefined;

export const buildRiverBoatBankEventPreview = (
  node: Parameters<NonNullable<DungeonTableDefinition['buildEventPreview']>>[0]
) =>
  node.event.kind === 'riverBoatBank'
    ? buildEventPreviewFromFactory(node, buildRiverBoatBankPreview)
    : undefined;

export const postProcessGalleryStairLocationChildren: PostProcessChildren = (
  node,
  children,
  resolveNode
) => {
  const result = (node.event as { result?: unknown }).result;
  if (
    result === GalleryStairLocation.PassageEnd &&
    !children.some((child) => child.event.kind === 'galleryStairOccurrence')
  ) {
    const occurrence = resolveNode(resolveGalleryStairOccurrence({}));
    if (occurrence) return [...children, occurrence];
  }
  return children;
};

export const postProcessRiverConstructionChildren: PostProcessChildren = (
  node,
  children,
  resolveNode
) => {
  const result = (node.event as { result?: unknown }).result;
  if (
    result === RiverConstruction.Boat &&
    !children.some((child) => child.event.kind === 'riverBoatBank')
  ) {
    const bank = resolveNode(resolveRiverBoatBank({}));
    if (bank) return [...children, bank];
  }
  return children;
};
