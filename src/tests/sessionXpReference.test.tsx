/** @jest-environment jsdom */
import {
  multiclassCampaign,
  multiMoneyAward,
  acceptMulti,
  multiCharacter,
} from './fixtures/multiclassCampaign';
import {
  profilesInSession,
  reorderPartyCharacter,
} from '../helpers/campaignParty';
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
  const cells = (label: string) => {
    const table = view.getByRole('table', { name: 'Session XP reference' });
    const headers = within(table).getAllByRole('columnheader');
    const index = headers.findIndex((h) => h.textContent === label);
    return within(table)
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.children[index] as HTMLElement);
  };
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

test('mixed class rows retain independent caps, awards, balances and selected session order', () => {
  let doc = multiclassCampaign(1990, 1100);
  const profile = doc.party?.profiles.find(
    (p) => p.sessionId === 'session-1' && p.characterId === multiCharacter
  );
  const thief = profile?.classes?.find((c) => c.characterClass === 'thief');
  if (!thief) throw Error('Fixture');
  thief.baseLevel = 2;
  doc = acceptMulti(multiMoneyAward(doc, 'mixed', '100'), 'mixed');
  doc = reorderPartyCharacter(doc, 'session-1', 'xp-tal', multiCharacter);
  const before = serializeCampaign(doc);
  const view = render(
    <SessionXpReference
      document={doc}
      sessionId="session-1"
      profiles={[...profilesInSession(doc, 'session-1')].reverse()}
    />
  );
  const table = within(
    view.getByRole('table', { name: 'Session XP reference' })
  );
  expect(table.getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
    'Character',
    'Class',
    'Base level',
    'XP cap',
    'XP added this session',
    'XP balance',
  ]);
  expect(table.getAllByRole('rowheader')[0]).toHaveTextContent('Tal');
  expect(
    table.getByRole('rowheader', { name: 'Kramrak Smugward' })
  ).toHaveAttribute('rowspan', '2');
  const fighterRow = table.getByRole('row', { name: /^Kramrak/ });
  expect(
    Array.from(fighterRow.querySelectorAll('td')).map((c) => c.textContent)
  ).toEqual(['Fighter', '1', '2,001', '11', '2,001']);
  const thiefRow = table.getByRole('row', { name: /^Thief/ });
  expect(
    Array.from(thiefRow.querySelectorAll('td')).map((c) => c.textContent)
  ).toEqual(['Thief', '2', '2,501', '55', '1,155']);
  expect(serializeCampaign(doc)).toBe(before);
});
