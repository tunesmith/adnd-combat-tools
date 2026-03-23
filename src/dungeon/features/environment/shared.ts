import type { OutcomeEventNode } from '../../domain/outcome';

export function readEnvironmentDungeonLevelFromId(
  context: unknown,
  id: string,
  fallback: number
): number {
  if (context && typeof context === 'object') {
    const kind = (context as { kind?: unknown }).kind;
    if (
      kind === 'wandering' &&
      typeof (context as { level?: unknown }).level === 'number'
    ) {
      return (context as { level: number }).level;
    }
  }
  const parts = id.split(':');
  if (parts.length >= 2) {
    const parsed = Number(parts[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

export function deriveEnvironmentDungeonLevelFromAncestors(
  ancestors: OutcomeEventNode[]
): number | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (ancestor.event.kind === 'periodicCheck') {
      return ancestor.event.level;
    }
    if (ancestor.event.kind === 'doorBeyond') {
      const doorLevel = ancestor.event.level;
      if (typeof doorLevel === 'number') {
        return doorLevel;
      }
    }
  }
  return undefined;
}
