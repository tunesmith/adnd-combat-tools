import type { DungeonTablePreview, TableContext } from '../../types/dungeon';
import type { DungeonOutcomeNode, OutcomeEventNode } from '../domain/outcome';
import type { TablePreviewFactory } from '../adapters/render/shared';
import type { DungeonTableDefinition } from './types';

export const wrapResolver =
  <T>(resolver: (options?: T) => DungeonOutcomeNode) =>
  (options?: unknown) =>
    resolver(options as T);

export function markContextualResolution<TOptions>(
  definition: DungeonTableDefinition<TOptions> & {
    registry: NonNullable<DungeonTableDefinition<TOptions>['registry']>;
  }
): DungeonTableDefinition<TOptions> {
  return {
    ...definition,
    manualResolution: 'contextual',
  };
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
