import type { PrayerBeadsSummary } from '../../types/dungeon';

export type PrayerBeadsCompactProps = {
  summary: PrayerBeadsSummary;
};

export function PrayerBeadsCompact({ summary }: PrayerBeadsCompactProps) {
  const { totalBeads, semiPrecious, fancy, specialCount, breakdown } = summary;
  return (
    <div>
      <p>
        It has {totalBeads} normal beads ({semiPrecious} semiprecious, {fancy}{' '}
        fancy).
      </p>
      {specialCount === 0 ? (
        <p>No special beads.</p>
      ) : (
        <>
          <p>
            {specialCount === 1
              ? 'One special bead:'
              : `${specialCount} special beads:`}
          </p>
          <ul
            style={{
              listStyle: 'none',
              margin: '0.25rem 0 0',
              padding: 0,
              marginLeft: '1.25rem',
            }}
          >
            {breakdown.map(({ label, count }) => (
              <li key={label} style={{ marginBottom: '0.25rem' }}>
                {count === 1 ? label : `${count}×${label}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
