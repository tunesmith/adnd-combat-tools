import type { RobeOfUsefulItemsSummary } from '../../types/dungeon';

export type RobeOfUsefulItemsCompactProps = {
  summary: RobeOfUsefulItemsSummary;
};

export function RobeOfUsefulItemsCompact({
  summary,
}: RobeOfUsefulItemsCompactProps) {
  const extraDescriptor =
    summary.extraPatchCount === 1
      ? '1 extra patch'
      : `${summary.extraPatchCount} extra patches`;
  const extraSuffix =
    summary.extraPatchCount === summary.requestedExtraPatchCount
      ? ''
      : ` (rolled ${summary.requestedExtraPatchCount})`;

  return (
    <div>
      <p>
        {summary.totalPatches} patches total; {extraDescriptor}
        {extraSuffix}.
      </p>
      <ul
        style={{
          listStyle: 'disc',
          margin: '0.25rem 0 0',
          padding: 0,
          marginLeft: '1.25rem',
        }}
      >
        {summary.entries.map((entry) => (
          <li key={`${entry.category}-${entry.label}`}>
            {formatEntry(entry.label, entry.count)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatEntry(label: string, count: number): string {
  return count === 1 ? label : `${label} ×${count}`;
}
