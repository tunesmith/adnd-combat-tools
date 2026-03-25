import type { DungeonTableDefinition } from '../../types';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../../shared';
import {
  buildTrickTrapPreview,
  renderTrickTrapDetail,
  renderTrickTrapCompactNodes,
} from './trickTrapRender';
import { resolveTrickTrap } from './trickTrapResolvers';
import { readHazardDungeonLevel } from '../shared';

export const trickTrapTables: ReadonlyArray<DungeonTableDefinition> = [
  markContextualResolution({
    id: 'trickTrap',
    heading: 'Trick / Trap',
    resolver: wrapResolver(resolveTrickTrap),
    renderers: {
      renderDetail: renderTrickTrapDetail,
      renderCompact: renderTrickTrapCompactNodes,
    },
    buildPreview: buildTrickTrapPreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'trickTrap'
        ? buildEventPreviewFromFactory(node, buildTrickTrapPreview, {
            context: {
              kind: 'wandering',
              level: readHazardDungeonLevel(undefined, ancestors ?? []),
            },
          })
        : undefined,
    registry: ({ roll, context }) =>
      resolveTrickTrap({
        roll,
        level: readHazardDungeonLevel(context, []),
      }),
    resolvePending: (pending, ancestors) =>
      resolveTrickTrap({
        level: readHazardDungeonLevel(pending.context, ancestors),
      }),
  }),
];
