import type {
  DungeonTableDefinition,
  PendingResolver,
  RegistryOutcomeBuilder,
} from '../types';
import type { DungeonTablePreview, TableContext } from '../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../domain/outcome';
import type { Table } from '../../../tables/dungeon/tableTypes';
import { readTableContextOfKind } from '../../helpers/tableContext';
import {
  buildPreview,
  type TablePreviewFactory,
} from '../../adapters/render/shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from './render';
import { buildEventPreviewFromFactory, wrapResolver } from '../shared';

type MonsterDungeonLevelContext = {
  dungeonLevel?: number;
};

type MonsterDungeonLevelResolverOptions = MonsterDungeonLevelContext & {
  roll?: number;
};

export function createMonsterPreviewFactory<TCommand>(options: {
  title: string;
  table: Table<TCommand>;
  labelFor: (command: TCommand) => string;
}): TablePreviewFactory {
  return (tableId, context) =>
    buildPreview(tableId, {
      title: options.title,
      sides: options.table.sides,
      entries: options.table.entries.map((entry) => ({
        range: entry.range,
        label: options.labelFor(entry.command),
      })),
      context,
    });
}

function createMonsterDungeonLevelContextHandlers(
  resolver: (
    options?: MonsterDungeonLevelResolverOptions
  ) => DungeonOutcomeNode,
  fallbackDungeonLevel: number
): {
  manualResolution: 'contextual';
  resolvePending: PendingResolver;
  registry: RegistryOutcomeBuilder;
} {
  return {
    manualResolution: 'contextual',
    resolvePending: (pending, ancestors) => {
      const dungeonLevel = readDungeonLevelFromPending(
        pending.table,
        pending.context,
        ancestors,
        fallbackDungeonLevel
      );
      return resolver({ dungeonLevel });
    },
    registry: ({ roll, context, id }) => {
      const dungeonLevel = readDungeonLevelFromContextOrId(
        context,
        id,
        fallbackDungeonLevel
      );
      return resolver({ roll, dungeonLevel });
    },
  };
}

export function defineMonsterTable(options: {
  id: string;
  heading: string;
  resolver: (
    options?: MonsterDungeonLevelResolverOptions
  ) => DungeonOutcomeNode;
  fallbackDungeonLevel: number;
  buildPreview: TablePreviewFactory;
  levelScopedEventPreview?: boolean;
}): DungeonTableDefinition {
  const { resolvePending, registry } = createMonsterDungeonLevelContextHandlers(
    options.resolver,
    options.fallbackDungeonLevel
  );

  return {
    id: options.id,
    heading: options.heading,
    resolver: wrapResolver(options.resolver),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: options.buildPreview,
    buildEventPreview: createMonsterEventPreviewBuilder(options.buildPreview, {
      levelScopedTableId: options.levelScopedEventPreview,
    }),
    resolvePending,
    registry,
  };
}

function createMonsterEventPreviewBuilder(
  buildPreview: TablePreviewFactory,
  options?: {
    levelScopedTableId?: boolean;
  }
): (node: OutcomeEventNode) => DungeonTablePreview | undefined {
  return (node) => {
    const dungeonLevel = readMonsterDungeonLevel(node);
    if (dungeonLevel === undefined) return undefined;
    return buildEventPreviewFromFactory(node, buildPreview, {
      tableId: options?.levelScopedTableId
        ? `${node.event.kind}:${dungeonLevel}`
        : undefined,
      context: {
        kind: 'wandering',
        level: dungeonLevel,
      },
    });
  };
}

function readDungeonLevelFromPending(
  pendingId: string,
  context: TableContext | undefined,
  ancestors: OutcomeEventNode[],
  fallback: number
): number {
  const fromContext = readDungeonLevelFromContextOrId(context, pendingId);
  if (fromContext !== undefined) return fromContext;

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    const event = ancestor.event as { dungeonLevel?: unknown; level?: unknown };
    if (
      typeof event.dungeonLevel === 'number' &&
      Number.isFinite(event.dungeonLevel)
    ) {
      return event.dungeonLevel;
    }
    if (ancestor.event.kind === 'periodicCheck') {
      if (typeof event.level === 'number' && Number.isFinite(event.level)) {
        return event.level;
      }
    }
  }

  return fallback;
}

function readDungeonLevelFromContextOrId(
  context: TableContext | undefined,
  id: string,
  fallback?: number
): number | undefined {
  const wanderingContext = readTableContextOfKind(context, 'wandering');
  if (wanderingContext) return wanderingContext.level;

  const parts = id.split(':');
  if (parts.length >= 2) {
    const parsed = Number(parts[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return fallback;
}

function readMonsterDungeonLevel(node: OutcomeEventNode): number | undefined {
  const candidate = node.event as { dungeonLevel?: unknown };
  if (
    typeof candidate.dungeonLevel === 'number' &&
    Number.isFinite(candidate.dungeonLevel)
  ) {
    return candidate.dungeonLevel;
  }
  return undefined;
}
