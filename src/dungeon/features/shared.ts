import type { DungeonOutcomeNode } from '../domain/outcome';
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
