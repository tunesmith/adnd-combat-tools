import ReactDOMServer from 'react-dom/server';
import { PrayerBeadsDetail } from '../../../components/dungeon/PrayerBeadsDetail';
import { PrayerBeadsCompact } from '../../../components/dungeon/PrayerBeadsCompact';
import type { PrayerBeadsSummary } from '../../../types/dungeon';

describe('PrayerBeads components', () => {
  const summary: PrayerBeadsSummary = {
    totalBeads: 27,
    semiPrecious: 16,
    fancy: 11,
    specialCount: 4,
    breakdown: [
      { label: 'Bead of Blessing', count: 2 },
      { label: 'Bead of Curing', count: 1 },
      { label: 'Bead of Wind Walking', count: 1 },
    ],
  };

  it('renders detail markup with bead breakdown', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <PrayerBeadsDetail summary={summary} />
    );
    expect(markup).toContain('The necklace bears 27 normal beads');
    expect(markup).toContain('Bead of Blessing');
    expect(markup).toContain('Bead of Wind Walking');
  });

  it('renders compact markup with bead breakdown', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <PrayerBeadsCompact summary={summary} />
    );
    expect(markup).toContain('It has 27 normal beads');
    expect(markup).toContain('4 special beads:');
    expect(markup).toContain('2×Bead of Blessing');
  });

  it('handles a summary with no special beads', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <PrayerBeadsCompact
        summary={{
          totalBeads: 25,
          semiPrecious: 15,
          fancy: 10,
          specialCount: 0,
          breakdown: [],
        }}
      />
    );
    expect(markup).toContain('No special beads.');
  });
});
