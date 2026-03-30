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
import { buildPreview } from '../adapters/render/shared';
import type {
  AppendPreviewFn,
  TablePreviewFactory,
} from '../adapters/render/shared';
import type { Table } from '../../tables/dungeon/tableTypes';

type ResolveNestedNode = (
  outcome: DungeonOutcomeNode
) => OutcomeEventNode | undefined;

type OutcomePostProcessor = (outcome: DungeonOutcomeNode) => DungeonOutcomeNode;

export type DetailRenderer = (
  node: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
) => DungeonRenderNode[];

export type CompactRenderer = (
  node: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
) => DungeonRenderNode[];

type RenderAdapter = {
  renderDetail: DetailRenderer;
  renderCompact: CompactRenderer;
};

type PostProcessChildren = (
  node: OutcomeEventNode,
  children: OutcomeEventNode[],
  resolveNode: ResolveNestedNode
) => OutcomeEventNode[];

export type PendingResolver = (
  pending: PendingRoll,
  ancestors: OutcomeEventNode[]
) => DungeonOutcomeNode | undefined;

type EventPreviewBuilder = (
  node: OutcomeEventNode,
  ancestors?: OutcomeEventNode[]
) => DungeonTablePreview | undefined;

export type RollResolverOptions = {
  roll?: number;
};

export type ManualRollResolver = (
  options?: RollResolverOptions
) => DungeonOutcomeNode;

export type RegistryOutcomeBuilder = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
  doorChain?: {
    existing: unknown[];
    sequence: number;
  };
}) => DungeonOutcomeNode;

export type DungeonTableFollowup<TResult = unknown> = {
  result: TResult;
  table: string;
};

type DungeonTableDefinitionBase = {
  id: string;
  heading: string;
  resolver: ManualRollResolver;
  renderers: RenderAdapter;
  registry?: RegistryOutcomeBuilder;
  buildPreview?: TablePreviewFactory;
  buildEventPreview?: EventPreviewBuilder;
  resolvePending?: PendingResolver;
  followups?: ReadonlyArray<DungeonTableFollowup>;
  table?: Table<unknown>;
  postProcessChildren?: PostProcessChildren;
  postProcessOutcome?: OutcomePostProcessor;
};

export type DungeonTableDefinition<TOptions = unknown> =
  DungeonTableDefinitionBase & {
    readonly __optionShape?: TOptions;
  };

export type ContextualDungeonTableDefinition<TOptions = unknown> =
  DungeonTableDefinition<TOptions> & {
    registry: RegistryOutcomeBuilder;
    resolvePending: PendingResolver;
  };

function assertPendingResolutionContract(
  definition: DungeonTableDefinition
): void {
  if (definition.registry && !definition.resolvePending) {
    throw new Error(
      `Dungeon table "${definition.id}" provides a registry handler but no resolvePending handler.`
    );
  }
}

export function createRenderAdapterMap(
  defs: ReadonlyArray<DungeonTableDefinition>
): Partial<Record<string, RenderAdapter>> {
  const map: Partial<Record<string, RenderAdapter>> = {};
  for (const def of defs) {
    map[def.id] = def.renderers;
  }
  return map;
}

export function createPreviewFactoryMap(
  defs: ReadonlyArray<DungeonTableDefinition>
): Record<string, TablePreviewFactory> {
  const map: Record<string, TablePreviewFactory> = {};
  for (const def of defs) {
    if (def.buildPreview) {
      map[def.id] = def.buildPreview;
    } else if (def.table) {
      const table = def.table;
      map[def.id] = (tableId, context) =>
        buildPreview(tableId, {
          title: def.heading,
          sides: table.sides,
          entries: table.entries.map((entry) => ({
            range: entry.range,
            label: String(entry.command),
          })),
          context,
        });
    }
  }
  return map;
}

export function createEventPreviewMap(
  defs: ReadonlyArray<DungeonTableDefinition>
): Partial<Record<string, EventPreviewBuilder>> {
  const map: Partial<Record<string, EventPreviewBuilder>> = {};
  for (const def of defs) {
    if (def.buildEventPreview) {
      map[def.id] = def.buildEventPreview;
    }
  }
  return map;
}

export function createRegistryOutcomeMap(
  defs: ReadonlyArray<DungeonTableDefinition>
): Record<string, RegistryOutcomeBuilder> {
  const map: Record<string, RegistryOutcomeBuilder> = {};
  for (const def of defs) {
    assertPendingResolutionContract(def);
    map[def.id] =
      def.registry ??
      ((opts) =>
        def.resolver(
          opts.roll === undefined ? undefined : { roll: opts.roll }
        ));
  }
  return map;
}

export function createPendingResolverMap(
  defs: ReadonlyArray<DungeonTableDefinition>
): Record<string, PendingResolver> {
  const map: Record<string, PendingResolver> = {};
  for (const def of defs) {
    assertPendingResolutionContract(def);
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

export function createOutcomePostProcessorList(
  defs: ReadonlyArray<DungeonTableDefinition>
): OutcomePostProcessor[] {
  const processors: OutcomePostProcessor[] = [];
  const seen = new Set<OutcomePostProcessor>();
  for (const def of defs) {
    const processor = def.postProcessOutcome;
    if (processor && !seen.has(processor)) {
      processors.push(processor);
      seen.add(processor);
    }
  }
  return processors;
}
