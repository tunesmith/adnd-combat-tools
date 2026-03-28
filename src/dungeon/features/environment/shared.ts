import type { TableContext } from '../../../types/dungeon';
import type {
  CompactRenderer,
  DetailRenderer,
  DungeonTableDefinition,
  PendingResolver,
  RegistryOutcomeBuilder,
} from '../types';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../domain/outcome';
import type { TablePreviewFactory } from '../../adapters/render/shared';
import { readTableContext } from '../../helpers/tableContext';
import { buildEventPreviewFromFactory, wrapResolver } from '../shared';

type EnvironmentDungeonLevelResolverOptions = {
  roll?: number;
  level?: number;
};

type EnvironmentRenderConfig = {
  detail: DetailRenderer;
  compact: CompactRenderer;
};

function readEnvironmentDungeonLevel(
  context: TableContext | undefined
): number | undefined {
  const parsed = readTableContext(context);
  if (!parsed) return undefined;

  switch (parsed.kind) {
    case 'wandering':
    case 'chamberContents':
    case 'treasure':
      return parsed.level;
    case 'chamberDimensions':
      return parsed.level;
    default:
      return undefined;
  }
}

function readEnvironmentDungeonLevelFromId(
  context: TableContext | undefined,
  id: string,
  fallback: number
): number {
  const contextLevel = readEnvironmentDungeonLevel(context);
  if (contextLevel !== undefined) return contextLevel;
  const parts = id.split(':');
  if (parts.length >= 2) {
    const parsed = Number(parts[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

function readEnvironmentDungeonLevelFromNode(
  node: OutcomeEventNode
): number | undefined {
  const eventLevel = (node.event as { level?: unknown }).level;
  if (typeof eventLevel === 'number' && Number.isFinite(eventLevel)) {
    return eventLevel;
  }
  const dungeonLevel = (node.event as { dungeonLevel?: unknown }).dungeonLevel;
  if (typeof dungeonLevel === 'number' && Number.isFinite(dungeonLevel)) {
    return dungeonLevel;
  }
  for (const child of node.children ?? []) {
    if (child.type === 'pending-roll') {
      const pendingLevel = readEnvironmentDungeonLevel(child.context);
      if (pendingLevel !== undefined) return pendingLevel;
      continue;
    }
    const childLevel = readEnvironmentDungeonLevelFromNode(child);
    if (childLevel !== undefined) return childLevel;
  }
  return undefined;
}

export function deriveEnvironmentDungeonLevelFromAncestors(
  ancestors: OutcomeEventNode[]
): number | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    const level = readEnvironmentDungeonLevelFromNode(ancestor);
    if (level !== undefined) return level;
  }
  return undefined;
}

export function deriveEnvironmentDungeonLevel(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): number | undefined {
  return (
    readEnvironmentDungeonLevelFromNode(node) ??
    deriveEnvironmentDungeonLevelFromAncestors(ancestors)
  );
}

export function buildEnvironmentWanderingLevelContext(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): Extract<TableContext, { kind: 'wandering' }> | undefined {
  const level = deriveEnvironmentDungeonLevel(node, ancestors);
  return level === undefined ? undefined : { kind: 'wandering', level };
}

function createEnvironmentDungeonLevelContextHandlers(
  resolver: (
    options?: EnvironmentDungeonLevelResolverOptions
  ) => DungeonOutcomeNode,
  fallbackLevel: number
): {
  manualResolution: 'contextual';
  resolvePending: PendingResolver;
  registry: RegistryOutcomeBuilder;
} {
  return {
    manualResolution: 'contextual',
    resolvePending: (pending, ancestors) => {
      const level = readEnvironmentDungeonLevelFromId(
        pending.context,
        pending.id ?? pending.table,
        deriveEnvironmentDungeonLevelFromAncestors(ancestors) ?? fallbackLevel
      );
      return resolver({ level });
    },
    registry: ({ roll, context, id }) => {
      const level = readEnvironmentDungeonLevelFromId(
        context,
        id,
        fallbackLevel
      );
      return resolver({ roll, level });
    },
  };
}

export function defineEnvironmentLevelTable(options: {
  id: string;
  heading: string;
  event: string;
  resolve: (
    options?: EnvironmentDungeonLevelResolverOptions
  ) => DungeonOutcomeNode;
  render: EnvironmentRenderConfig;
  preview: TablePreviewFactory;
  fallbackLevel: number;
  buildEventContext: (
    node: OutcomeEventNode,
    ancestors?: OutcomeEventNode[]
  ) => TableContext | undefined;
  shouldBuildEventPreview?: (node: OutcomeEventNode) => boolean;
}): DungeonTableDefinition<EnvironmentDungeonLevelResolverOptions> {
  const contextHandlers = createEnvironmentDungeonLevelContextHandlers(
    options.resolve,
    options.fallbackLevel
  );

  return {
    ...contextHandlers,
    id: options.id,
    heading: options.heading,
    resolver: wrapResolver(options.resolve),
    renderers: {
      renderDetail: options.render.detail,
      renderCompact: options.render.compact,
    },
    buildPreview: options.preview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === options.event &&
      (options.shouldBuildEventPreview?.(node) ?? true)
        ? buildEventPreviewFromFactory(node, options.preview, {
            context: options.buildEventContext(node, ancestors),
          })
        : undefined,
  };
}
