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
import {
  sessionFingerprint,
  startNextSession,
} from '../helpers/campaignContinuity';

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
  expect(cells('Starting XP').map((c) => c.textContent)).toEqual([
    '0',
    '0',
    '0',
    '0',
    '0',
  ]);
  expect(Array.from(cells('Base level')).map((c) => c.textContent)).toEqual([
    '1',
    '1',
    '1',
    '1',
    '1',
  ]);
  expect(Array.from(cells('Awarded')).map((c) => c.textContent)).toEqual([
    '500',
    '507',
    '507',
    '461',
    '507',
  ]);
  expect(Array.from(cells('Total')).map((c) => c.textContent)).toEqual([
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
  expect(Array.from(cells('Awarded')).map((c) => c.textContent)).toEqual([
    '0',
    '0',
    '0',
    '0',
    '0',
  ]);
  expect(Array.from(cells('Total')).map((c) => c.textContent)).toEqual([
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
  expect(cells('Starting XP').map((c) => c.textContent)).toEqual([
    '—',
    '—',
    '—',
    '—',
    '—',
  ]);
  expect(Array.from(cells('Total')).map((c) => c.textContent)).toEqual([
    '—',
    '—',
    '—',
    '—',
    '—',
  ]);
  expect(Array.from(cells('Awarded')).map((c) => c.textContent)).toEqual([
    '0',
    '0',
    '0',
    '0',
    '0',
  ]);
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
    'Next Level',
    'Starting XP',
    'Awarded',
    'Total',
  ]);
  expect(table.getAllByRole('rowheader')[0]).toHaveTextContent('Tal');
  expect(
    table.getByRole('rowheader', { name: 'Kramrak Smugward' })
  ).toHaveAttribute('rowspan', '2');
  const fighterRow = table.getByRole('row', { name: /^Kramrak/ });
  expect(
    Array.from(fighterRow.querySelectorAll('td')).map((c) => c.textContent)
  ).toEqual(['Fighter', '1', '2,001', '1,990', '11', '2,001']);
  const thiefRow = table.getByRole('row', { name: /^Thief/ });
  expect(
    Array.from(thiefRow.querySelectorAll('td')).map((c) => c.textContent)
  ).toEqual(['Thief', '2', '2,501', '1,100', '55', '1,155']);
  expect(serializeCampaign(doc)).toBe(before);
  doc = acceptMulti(multiMoneyAward(doc, 'next', '100', 'session-2'), 'next');
  view.rerender(
    <SessionXpReference
      document={doc}
      sessionId="session-2"
      profiles={profilesInSession(doc, 'session-2')}
    />
  );
  expect(
    Array.from(
      table.getByRole('row', { name: /^Kramrak/ }).querySelectorAll('td')
    ).map((c) => c.textContent)
  ).toEqual(['Fighter', '1', '2,001', '2,001', '0', '2,001']);
  expect(
    Array.from(
      table.getByRole('row', { name: /^Thief/ }).querySelectorAll('td')
    ).map((c) => c.textContent)
  ).toEqual(['Thief', '1', '1,251', '1,155', '55', '1,210']);
});

test('creating a session carries previous totals into Starting XP without copying or rewriting the XP ledger', () => {
  const doc = acceptMulti(
    multiMoneyAward(multiclassCampaign(1990, 1100), 'carry', '100'),
    'carry'
  );
  const profiles = profilesInSession(doc, 'session-2');
  const view = render(
    <SessionXpReference
      document={doc}
      sessionId="session-2"
      profiles={profiles}
    />
  );
  const rows = () =>
    Array.from(
      view
        .getByRole('table', { name: 'Session XP reference' })
        .querySelectorAll('tbody tr')
    );
  const totals = rows().map(
    (row) => row.querySelectorAll('td')[5]?.textContent
  );
  const before = serializeCampaign(doc);
  const created = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'session-2',
    sourceFingerprint: sessionFingerprint(doc, 'session-2'),
    destinationId: 'next-session',
    label: 'Next session',
    combats: [],
    inventory: null,
    copyNotes: false,
    partyCharacterIds: profiles.map((p) => p.characterId),
    capturedAt: '2026-11-12T12:00:00.000Z',
  });
  expect(created.xp).toBe(doc.xp);
  const reopened = parseCampaign(serializeCampaign(created));
  view.rerender(
    <SessionXpReference
      document={reopened}
      sessionId="next-session"
      profiles={profilesInSession(reopened, 'next-session')}
    />
  );
  expect(
    rows().map((row) => row.querySelectorAll('td')[3]?.textContent)
  ).toEqual(totals);
  expect(
    rows().map((row) => row.querySelectorAll('td')[4]?.textContent)
  ).toEqual(totals.map(() => '0'));
  expect(
    rows().map((row) => row.querySelectorAll('td')[5]?.textContent)
  ).toEqual(totals);
  expect(serializeCampaign(doc)).toBe(before);
});
