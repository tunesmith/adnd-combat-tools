import type { DungeonTableDefinition } from '../../types';
import {
  renderChasmDepthDetail,
  renderChasmConstructionDetail,
  renderJumpingPlaceWidthDetail,
  buildChasmDepthPreview,
  buildChasmConstructionPreview,
  buildJumpingPlaceWidthPreview,
} from './chasmRender';
import {
  resolveChasmConstruction,
  resolveChasmDepth,
  resolveJumpingPlaceWidth,
} from './chasmResolvers';
import { ChasmConstruction } from './chasmTable';
import { NO_COMPACT_RENDER } from '../shared';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';

export const chasmTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'chasmDepth',
    heading: 'Chasm Depth',
    resolver: wrapResolver(resolveChasmDepth),
    renderers: {
      renderDetail: renderChasmDepthDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildChasmDepthPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'chasmDepth'
        ? buildEventPreviewFromFactory(node, buildChasmDepthPreview)
        : undefined,
    resolvePending: () => resolveChasmDepth({}),
  },
  {
    id: 'chasmConstruction',
    heading: 'Chasm Construction',
    resolver: wrapResolver(resolveChasmConstruction),
    renderers: {
      renderDetail: renderChasmConstructionDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildChasmConstructionPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'chasmConstruction'
        ? buildEventPreviewFromFactory(node, buildChasmConstructionPreview)
        : undefined,
    resolvePending: () => resolveChasmConstruction({}),
    postProcessChildren: (node, children, resolveNode) => {
      const result = (node.event as { result?: unknown }).result;
      if (
        result === ChasmConstruction.JumpingPlace &&
        !children.some((c) => c.event.kind === 'jumpingPlaceWidth')
      ) {
        const width = resolveNode(resolveJumpingPlaceWidth({}));
        if (width) return [...children, width];
      }
      return children;
    },
  },
  {
    id: 'jumpingPlaceWidth',
    heading: 'Jumping Place Width',
    resolver: wrapResolver(resolveJumpingPlaceWidth),
    renderers: {
      renderDetail: renderJumpingPlaceWidthDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildJumpingPlaceWidthPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'jumpingPlaceWidth'
        ? buildEventPreviewFromFactory(node, buildJumpingPlaceWidthPreview)
        : undefined,
    resolvePending: () => resolveJumpingPlaceWidth({}),
  },
];
