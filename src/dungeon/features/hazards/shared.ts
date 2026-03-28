import type { TableContext } from '../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../domain/outcome';
import type { TablePreviewFactory } from '../../adapters/render/shared';
import type {
  CompactRenderer,
  DetailRenderer,
  DungeonTableDefinition,
} from '../types';
import { readTableContextOfKind } from '../../helpers/tableContext';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../shared';

function readHazardDungeonLevel(
  context: TableContext | undefined,
  ancestors: OutcomeEventNode[]
): number {
  const wanderingContext = readTableContextOfKind(context, 'wandering');
  if (wanderingContext) return wanderingContext.level;
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (ancestor.event.kind === 'periodicCheck') {
      return ancestor.event.level;
    }
    if (
      ancestor.event.kind === 'doorBeyond' &&
      typeof ancestor.event.level === 'number'
    ) {
      return ancestor.event.level;
    }
  }
  return 1;
}

type HazardRenderConfig = {
  detail: DetailRenderer;
  compact: CompactRenderer;
};

export function defineHazardLevelTable(options: {
  id: string;
  heading: string;
  event: string;
  resolve: (options?: { roll?: number; level?: number }) => DungeonOutcomeNode;
  render: HazardRenderConfig;
  preview: TablePreviewFactory;
}): DungeonTableDefinition {
  return markContextualResolution({
    id: options.id,
    heading: options.heading,
    resolver: wrapResolver(options.resolve),
    renderers: {
      renderDetail: options.render.detail,
      renderCompact: options.render.compact,
    },
    buildPreview: options.preview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === options.event
        ? buildEventPreviewFromFactory(node, options.preview, {
            context: {
              kind: 'wandering',
              level: readHazardDungeonLevel(undefined, ancestors ?? []),
            },
          })
        : undefined,
    registry: ({ roll, context }) =>
      options.resolve({
        roll,
        level: readHazardDungeonLevel(context, []),
      }),
    resolvePending: (pending, ancestors) =>
      options.resolve({
        level: readHazardDungeonLevel(pending.context, ancestors),
      }),
  });
}
