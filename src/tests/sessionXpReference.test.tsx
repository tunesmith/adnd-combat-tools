/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, within } from '@testing-library/react';
import SessionXpReference from '../components/desktop/SessionXpReference';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import replay from './fixtures/xpSyntheticReplay.json';
import { xpCampaign } from './fixtures/xpCampaign';

test('compact Session XP is historical, uses base levels and counts only accepted correction versions', () => {
  const doc = parseCampaign(JSON.stringify(replay.corrected));
  const profiles =
    doc.party?.profiles.filter((p) => p.sessionId === 'session-2') || [];
  const first = profiles[0];
  if (!first) throw Error('Fixture');
  first.adjustment = { name: 'Synthetic temporary level', enabled: true };
  const before = serializeCampaign(doc);
  const view = render(
    <SessionXpReference
      document={doc}
      sessionId="session-2"
      profiles={profiles}
    />
  );
  const cells = (label: string) =>
    within(view.getByRole('table', { name: 'Session XP reference' }))
      .getByRole('row', { name: new RegExp(`^${label}`) })
      .querySelectorAll('td');
  expect(Array.from(cells('Base level')).map((c) => c.textContent)).toEqual([
    '1',
    '1',
    '1',
    '1',
    '1',
  ]);
  expect(
    Array.from(cells('XP added this session')).map((c) => c.textContent)
  ).toEqual(['500', '507', '507', '461', '507']);
  expect(Array.from(cells('XP balance')).map((c) => c.textContent)).toEqual([
    '500',
    '507',
    '507',
    '461',
    '507',
  ]);
  view.rerender(
    <SessionXpReference
      document={doc}
      sessionId="session-1"
      profiles={
        doc.party?.profiles.filter((p) => p.sessionId === 'session-1') || []
      }
    />
  );
  expect(
    Array.from(cells('XP added this session')).map((c) => c.textContent)
  ).toEqual(['0', '0', '0', '0', '0']);
  expect(Array.from(cells('XP balance')).map((c) => c.textContent)).toEqual([
    '0',
    '0',
    '0',
    '0',
    '0',
  ]);
  expect(serializeCampaign(doc)).toBe(before);
  const unknown = xpCampaign(false);
  view.rerender(
    <SessionXpReference
      document={unknown}
      sessionId="session-1"
      profiles={
        unknown.party?.profiles.filter((p) => p.sessionId === 'session-1') || []
      }
    />
  );
  expect(Array.from(cells('XP balance')).map((c) => c.textContent)).toEqual([
    '—',
    '—',
    '—',
    '—',
    '—',
  ]);
  expect(
    Array.from(cells('XP added this session')).map((c) => c.textContent)
  ).toEqual(['0', '0', '0', '0', '0']);
});
