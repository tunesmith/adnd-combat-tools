export function formatOrdinal(level: number): string {
  const remainder = level % 10;
  const teen = Math.floor(level / 10) % 10 === 1;
  const suffix = teen
    ? 'th'
    : remainder === 1
    ? 'st'
    : remainder === 2
    ? 'nd'
    : remainder === 3
    ? 'rd'
    : 'th';
  return `${level}${suffix}`;
}
