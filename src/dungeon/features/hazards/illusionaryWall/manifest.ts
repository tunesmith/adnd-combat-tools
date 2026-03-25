import type { DungeonTableDefinition } from '../../types';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../../shared';
import {
  renderIllusionaryWallNatureDetail,
  renderIllusionaryWallNatureCompact,
  buildIllusionaryWallNaturePreview,
} from './illusionaryWallRender';
import { resolveIllusionaryWallNature } from './illusionaryWallResolvers';
import { readHazardDungeonLevel } from '../shared';

export const illusionaryWallTables: ReadonlyArray<DungeonTableDefinition> = [
  markContextualResolution({
    id: 'illusionaryWallNature',
    heading: 'Illusionary Wall Nature',
    resolver: wrapResolver(resolveIllusionaryWallNature),
    renderers: {
      renderDetail: renderIllusionaryWallNatureDetail,
      renderCompact: renderIllusionaryWallNatureCompact,
    },
    buildPreview: buildIllusionaryWallNaturePreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'illusionaryWallNature'
        ? buildEventPreviewFromFactory(
            node,
            buildIllusionaryWallNaturePreview,
            {
              context: {
                kind: 'wandering',
                level: readHazardDungeonLevel(undefined, ancestors ?? []),
              },
            }
          )
        : undefined,
    registry: ({ roll, context }) =>
      resolveIllusionaryWallNature({
        roll,
        level: readHazardDungeonLevel(context, []),
      }),
    resolvePending: (pending, ancestors) =>
      resolveIllusionaryWallNature({
        level: readHazardDungeonLevel(pending.context, ancestors),
      }),
  }),
];
