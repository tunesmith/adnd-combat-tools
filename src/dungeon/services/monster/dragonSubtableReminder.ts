const DEFAULT_TABLE_LABEL = 'dragon subtable';

export function dragonSubtableReminder(
  description: string,
  options?: { tableLabel?: string }
): string {
  const tableLabel = options?.tableLabel ?? DEFAULT_TABLE_LABEL;
  const normalized = description.trim().replace(/\s+/g, ' ');
  const sentence = normalized.endsWith('.')
    ? normalized
    : `${normalized}.`;
  return `${sentence} Roll on the ${tableLabel} for details. `;
}
