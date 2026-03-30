import type { RobeOfUsefulItemsSummary } from '../../types/dungeon';

type RobeOfUsefulItemsDetailProps = {
  summary: RobeOfUsefulItemsSummary;
};

export function RobeOfUsefulItemsDetail({
  summary,
}: RobeOfUsefulItemsDetailProps) {
  const baseEntries = summary.entries.filter(
    (entry) => entry.category === 'base'
  );
  const extraEntries = summary.entries.filter(
    (entry) => entry.category === 'extra'
  );
  const extraNote =
    summary.extraPatchCount === summary.requestedExtraPatchCount
      ? summary.extraPatchCount
      : `${summary.extraPatchCount} (rolled ${summary.requestedExtraPatchCount})`;

  return (
    <div>
      <p>
        Total patches: {summary.totalPatches}. Additional patches: {extraNote}.
      </p>
      <Section title="Base patches" entries={baseEntries} />
      <Section title="Additional patches" entries={extraEntries} />
    </div>
  );
}

type SectionProps = {
  title: string;
  entries: RobeOfUsefulItemsSummary['entries'];
};

function Section({ title, entries }: SectionProps) {
  if (entries.length === 0) return null;
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <strong>{title}</strong>
      <ul style={{ margin: '0.25rem 0 0', marginLeft: '1.25rem' }}>
        {entries.map((entry) => (
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
