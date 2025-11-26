import type { DungeonOutcomeNode } from '../domain/outcome';

export const wrapResolver =
  <T>(resolver: (options?: T) => DungeonOutcomeNode) =>
  (options?: unknown) =>
    resolver(options as T);
