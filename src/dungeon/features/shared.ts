import type { DungeonTablePreview, TableContext } from '../../types/dungeon';
import type { DungeonOutcomeNode, OutcomeEventNode } from '../domain/outcome';
import type { TablePreviewFactory } from '../adapters/render/shared';
import type {
  CompactRenderer,
  ContextualDungeonTableDefinition,
  DetailRenderer,
  DungeonTableDefinition,
  DungeonTableFollowup,
  ManualRollResolver,
  RollResolverOptions,
} from './types';

export const wrapResolver =
  (resolver: ManualRollResolver): ManualRollResolver =>
  (options?: RollResolverOptions) =>
    resolver(options);

export const withDefaultResolverOptions =
  <TDefaults extends object>(
    resolver: (options: TDefaults & RollResolverOptions) => DungeonOutcomeNode,
    defaults: TDefaults
  ): ManualRollResolver =>
  (options?: RollResolverOptions) =>
    resolver({
      ...defaults,
      ...(options ?? {}),
    });

export function markContextualResolution<TOptions>(
  definition: ContextualDungeonTableDefinition<TOptions>
): ContextualDungeonTableDefinition<TOptions> {
  if (!definition.registry || !definition.resolvePending) {
    throw new Error(
      `Dungeon table "${definition.id}" requires both registry and resolvePending handlers.`
    );
  }
  return definition;
}

export function buildEventPreviewFromFactory(
  node: OutcomeEventNode,
  buildPreview: TablePreviewFactory,
  options?: {
    tableId?: string;
    context?: TableContext;
    autoCollapse?: boolean;
  }
): DungeonTablePreview | undefined {
  const preview = buildPreview(
    options?.tableId ?? node.event.kind,
    options?.context
  );
  if (!preview) return undefined;
  return options?.autoCollapse ? { ...preview, autoCollapse: true } : preview;
}

type RollOnlyTableRenderConfig = {
  detail: DetailRenderer;
  compact: CompactRenderer;
};

export function defineRollOnlyTable<TResult = unknown>(options: {
  id: string;
  heading: string;
  event: string;
  resolve: ManualRollResolver;
  render: RollOnlyTableRenderConfig;
  preview: TablePreviewFactory;
  followups?: ReadonlyArray<DungeonTableFollowup<TResult>>;
}): DungeonTableDefinition {
  return {
    id: options.id,
    heading: options.heading,
    resolver: wrapResolver(options.resolve),
    renderers: {
      renderDetail: options.render.detail,
      renderCompact: options.render.compact,
    },
    buildPreview: options.preview,
    buildEventPreview: (node) =>
      node.event.kind === options.event
        ? buildEventPreviewFromFactory(node, options.preview)
        : undefined,
    resolvePending: () => options.resolve({}),
    followups: options.followups,
  };
}

export const NO_COMPACT_RENDER: CompactRenderer = (_node, _append) => [];

export const withoutAppend =
  (
    renderer: (
      node: Parameters<DetailRenderer>[0]
    ) => ReturnType<DetailRenderer>
  ) =>
  (
    node: Parameters<DetailRenderer>[0],
    _append: Parameters<DetailRenderer>[1]
  ) =>
    renderer(node);
