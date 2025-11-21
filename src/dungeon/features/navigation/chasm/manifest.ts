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
import { NO_COMPACT_RENDER, wrapResolver } from '../shared';

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
    resolvePending: () => resolveJumpingPlaceWidth({}),
  },
];
