import ReactDOMServer from 'react-dom/server';
import { RobeOfUsefulItemsDetail } from '../../../components/dungeon/RobeOfUsefulItemsDetail';
import { RobeOfUsefulItemsCompact } from '../../../components/dungeon/RobeOfUsefulItemsCompact';
import type { RobeOfUsefulItemsSummary } from '../../../types/dungeon';

const summary: RobeOfUsefulItemsSummary = {
  totalPatches: 15,
  basePatchCount: 12,
  extraPatchCount: 3,
  requestedExtraPatchCount: 3,
  entries: [
    { label: 'Dagger', count: 2, category: 'base' },
    { label: "Pole (10')", count: 2, category: 'base' },
    { label: "Rope (50' coil)", count: 2, category: 'base' },
    { label: 'Sack (large)', count: 2, category: 'base' },
    { label: 'Lantern (filled and lit)', count: 2, category: 'base' },
    { label: 'Mirror (large)', count: 2, category: 'base' },
    { label: 'Bag of 100 gold pieces', count: 1, category: 'extra' },
    { label: 'War dogs, pair', count: 2, category: 'extra' },
  ],
};

describe('RobeOfUsefulItems components', () => {
  it('renders detail markup with grouped lists', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <RobeOfUsefulItemsDetail summary={summary} />
    );
    expect(markup).toContain('Total patches: 15. Additional patches: 3.');
    expect(markup).toContain('Base patches');
    expect(markup).toContain('War dogs, pair ×2');
  });

  it('renders compact markup with bullet list entries', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <RobeOfUsefulItemsCompact summary={summary} />
    );
    expect(markup).toContain('15 patches total; 3 extra patches.');
    expect(markup).toContain('War dogs, pair ×2');
  });
});
