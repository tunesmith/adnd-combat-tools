import type { TablePreviewFactory } from '../../../adapters/render/shared';
import { defineRollOnlyTable } from '../../shared';
import type {
  CompactRenderer,
  DetailRenderer,
  DungeonTableDefinition,
  ManualRollResolver,
} from '../../types';
import {
  resolveGalleryStairOccurrence,
  resolveRiverBoatBank,
} from './specialPassageResolvers';
import { GalleryStairLocation, RiverConstruction } from './specialPassageTable';

type PostProcessChildren = NonNullable<
  DungeonTableDefinition['postProcessChildren']
>;

type SpecialPassageRenderConfig = {
  detail: DetailRenderer;
  compact: CompactRenderer;
};

export function defineSpecialPassageTable(options: {
  id: string;
  heading: string;
  event: string;
  resolve: ManualRollResolver;
  render: SpecialPassageRenderConfig;
  preview: TablePreviewFactory;
  postProcessChildren?: PostProcessChildren;
}): DungeonTableDefinition {
  return {
    ...defineRollOnlyTable({
      id: options.id,
      heading: options.heading,
      event: options.event,
      resolve: options.resolve,
      render: options.render,
      preview: options.preview,
    }),
    postProcessChildren: options.postProcessChildren,
  };
}

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
