import type { PendingResolver, RegistryOutcomeBuilder } from '../types';
import type { DungeonTablePreview } from '../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../domain/outcome';
import { readTableContextOfKind } from '../../helpers/tableContext';
import type { TablePreviewFactory } from '../../adapters/render/shared';
import { buildEventPreviewFromFactory } from '../shared';

type MonsterDungeonLevelContext = {
  dungeonLevel?: number;
};

type MonsterDungeonLevelResolverOptions = MonsterDungeonLevelContext & {
  roll?: number;
};

export function createMonsterDungeonLevelContextHandlers(
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

export function createMonsterEventPreviewBuilder(
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
  context: unknown,
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
  context: unknown,
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
