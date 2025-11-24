import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import type {
  AppendPreviewFn,
  TablePreviewFactory,
} from '../adapters/render/shared';
import type { Table } from '../../tables/dungeon/dungeonTypes';

export type ResolveNestedNode = (
  outcome: DungeonOutcomeNode
) => OutcomeEventNode | undefined;

export type DetailRenderer = (
  node: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
) => DungeonRenderNode[];

export type CompactRenderer = (
  node: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
) => DungeonRenderNode[];

export type RenderAdapter = {
  renderDetail: DetailRenderer;
  renderCompact: CompactRenderer;
};

export type PostProcessChildren = (
  node: OutcomeEventNode,
  children: OutcomeEventNode[],
  resolveNode: ResolveNestedNode
) => OutcomeEventNode[];

export type PendingResolver = (
  pending: PendingRoll,
  ancestors: OutcomeEventNode[]
) => DungeonOutcomeNode | undefined;

export type RegistryOutcomeBuilder = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
  doorChain?: {
    existing: unknown[];
    sequence: number;
  };
}) => DungeonOutcomeNode;

export type DungeonTableDefinition<TOptions = unknown> = {
  id: string;
  heading: string;
  resolver: (options?: TOptions) => DungeonOutcomeNode;
  renderers: RenderAdapter;
  buildPreview?: TablePreviewFactory;
  resolvePending?: PendingResolver;
  registry?: RegistryOutcomeBuilder;
  table?: Table<unknown>;
  postProcessChildren?: PostProcessChildren;
};

export function createRenderAdapterMap<TOptions>(
  defs: ReadonlyArray<DungeonTableDefinition<TOptions>>
): Partial<Record<string, RenderAdapter>> {
  const map: Partial<Record<string, RenderAdapter>> = {};
  for (const def of defs) {
    map[def.id] = def.renderers;
  }
  return map;
}

export function createPreviewFactoryMap<TOptions>(
  defs: ReadonlyArray<DungeonTableDefinition<TOptions>>
): Record<string, TablePreviewFactory> {
  const map: Record<string, TablePreviewFactory> = {};
  for (const def of defs) {
    if (def.buildPreview) {
      map[def.id] = def.buildPreview;
    } else if (def.table) {
      const table = def.table;
      map[def.id] = (tableId, context) =>
        buildPreviewFromTable(tableId, def.heading, table, context);
    }
  }
  return map;
}

export function createRegistryOutcomeMap<TOptions>(
  defs: ReadonlyArray<DungeonTableDefinition<TOptions>>
): Record<string, RegistryOutcomeBuilder> {
  const map: Record<string, RegistryOutcomeBuilder> = {};
  for (const def of defs) {
    map[def.id] =
      def.registry ??
      ((opts) =>
        def.resolver(
          opts.roll === undefined
            ? undefined
            : ({ roll: opts.roll } as unknown as TOptions)
        ));
  }
  return map;
}

export function createPendingResolverMap(
  defs: ReadonlyArray<DungeonTableDefinition>
): Record<string, PendingResolver> {
  const map: Record<string, PendingResolver> = {};
  for (const def of defs) {
    if (def.resolvePending) {
      map[def.id] = def.resolvePending;
    }
  }
  return map;
}

export function createChildPostProcessorMap(
  defs: ReadonlyArray<DungeonTableDefinition>
): Record<string, PostProcessChildren> {
  const map: Record<string, PostProcessChildren> = {};
  for (const def of defs) {
    if (def.postProcessChildren) {
      map[def.id] = def.postProcessChildren;
    }
  }
  return map;
}

export function buildPreviewFromTable(
  tableId: string,
  heading: string,
  table: Table<unknown>,
  context?: TableContext
): DungeonTablePreview {
  return {
    kind: 'table-preview',
    id: tableId,
    title: heading,
    sides: table.sides,
    entries: table.entries.map((entry) => ({
      range: formatRange(entry.range),
      label: String(entry.command),
    })),
    context,
  };
}

function formatRange(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
}
