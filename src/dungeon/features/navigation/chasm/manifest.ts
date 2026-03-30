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
import { defineRollOnlyTable, NO_COMPACT_RENDER } from '../../shared';

export const chasmTables: ReadonlyArray<DungeonTableDefinition> = [
  defineRollOnlyTable({
    id: 'chasmDepth',
    heading: 'Chasm Depth',
    event: 'chasmDepth',
    resolve: resolveChasmDepth,
    render: {
      detail: renderChasmDepthDetail,
      compact: NO_COMPACT_RENDER,
    },
    preview: buildChasmDepthPreview,
  }),
  {
    ...defineRollOnlyTable({
      id: 'chasmConstruction',
      heading: 'Chasm Construction',
      event: 'chasmConstruction',
      resolve: resolveChasmConstruction,
      render: {
        detail: renderChasmConstructionDetail,
        compact: NO_COMPACT_RENDER,
      },
      preview: buildChasmConstructionPreview,
    }),
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
  defineRollOnlyTable({
    id: 'jumpingPlaceWidth',
    heading: 'Jumping Place Width',
    event: 'jumpingPlaceWidth',
    resolve: resolveJumpingPlaceWidth,
    render: {
      detail: renderJumpingPlaceWidthDetail,
      compact: NO_COMPACT_RENDER,
    },
    preview: buildJumpingPlaceWidthPreview,
  }),
];
