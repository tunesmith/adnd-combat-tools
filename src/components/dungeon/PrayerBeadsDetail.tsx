import type { PrayerBeadsSummary } from '../../types/dungeon';

export type PrayerBeadsDetailProps = {
  summary: PrayerBeadsSummary;
};

export function PrayerBeadsDetail({ summary }: PrayerBeadsDetailProps) {
  const { totalBeads, semiPrecious, fancy, specialCount, breakdown } = summary;
  return (
    <div>
      <p>
        The necklace bears {totalBeads} normal beads ({semiPrecious}{' '}
        semiprecious, {fancy} fancy).
      </p>
      {specialCount === 0 ? (
        <p>It has no special beads.</p>
      ) : (
        <>
          <p>Special beads ({specialCount}):</p>
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
