/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CampaignXp from '../components/desktop/CampaignXp';
import SessionXpReference from '../components/desktop/SessionXpReference';
import {
  capCampaign,
  capMoneyAward,
  capCharacter,
} from './fixtures/xpCapCampaign';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import { updatePartyProfile } from '../helpers/campaignParty';

beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `cap-ui-${++id}` },
  });
});
test('cap preview separates full/add/discard, invalidates on training and persists a frozen cap', () => {
  let current = capMoneyAward(capCampaign(), 'first', '500');
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <>
        <button
          onClick={() => {
            const p = doc.party?.profiles.find(
              (p) =>
                p.characterId === capCharacter && p.sessionId === 'session-1'
            );
            if (!p) throw Error('Fixture');
            current = updatePartyProfile(doc, { ...p, baseLevel: 6 });
            setDoc(current);
          }}
        >
          Synthetic training
        </button>
        <CampaignXp
          document={doc}
          sessionId="session-1"
          onChange={(change) => {
            const next = parseCampaign(serializeCampaign(change(doc)));
            validateHistoryTransition(doc, next, '');
            current = next;
            setDoc(next);
            return true;
          }}
        />
      </>
    );
  }
  render(<Harness />);
  fireEvent.click(
    screen.getByRole('button', { name: /^Synthetic first settlement Draft/ })
  );
  let table = within(screen.getByRole('table', { name: 'XP award' }));
  expect(
    table.getByRole('button', { name: 'Review Mira XP cap' })
  ).toHaveTextContent('35,001');
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
  const value = (label: string) =>
    within(screen.getByRole('table', { name: 'XP award' }))
      .getByRole('row', { name: new RegExp(`^${label}`) })
      .querySelector('td')?.textContent;
  expect(value('Full award')).toBe('550');
  expect(value('XP added')).toBe('201');
  expect(value('Discarded')).toBe('349');
  expect(value('New balance')).toBe('35,001');
  fireEvent.click(screen.getByRole('button', { name: 'Synthetic training' }));
  expect(
    screen.queryByRole('button', { name: 'Confirm award' })
  ).not.toBeInTheDocument();
  table = within(screen.getByRole('table', { name: 'XP award' }));
  expect(
    table.getByRole('button', { name: 'Review Mira XP cap' })
  ).toHaveTextContent('70,001');
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
  expect(value('XP added')).toBe('550');
  expect(value('Discarded')).toBe('0');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm award' }));
  expect(current.xp?.events[0]?.rows[0]).toMatchObject({
    fullAward: 550,
    award: 550,
    discarded: 0,
    cap: { baseLevel: 6, limit: 70001 },
  });
  expect(parseCampaign(serializeCampaign(current)).xp?.events).toEqual(
    current.xp?.events
  );
  fireEvent.click(screen.getByRole('button', { name: 'Inspect Mira XP cap' }));
  expect(
    within(screen.getByRole('dialog', { name: 'XP cap' })).getByText(
      /trained level 6/
    )
  ).toBeInTheDocument();
});
test('unknown caps need an explicit decision; cancellation cannot create an uncapped award', () => {
  let current = capCampaign();
  const p = current.party?.profiles.find(
    (p) => p.characterId === capCharacter && p.sessionId === 'session-1'
  );
  if (!p) throw Error('Fixture');
  current = updatePartyProfile(current, { ...p, characterClass: 'manual' });
  current = capMoneyAward(current, 'custom', '500');
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignXp
        document={doc}
        sessionId="session-1"
        onChange={(change) => {
          current = parseCampaign(serializeCampaign(change(doc)));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(
    screen.getByRole('button', { name: /^Synthetic custom settlement Draft/ })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
  expect(screen.getByRole('alert')).toHaveTextContent('cap is unknown');
  fireEvent.click(screen.getByRole('button', { name: 'Review Mira XP cap' }));
  let cap = within(screen.getByRole('dialog', { name: 'XP cap' }));
  fireEvent.change(cap.getByLabelText('Cap basis'), {
    target: { value: 'uncapped' },
  });
  fireEvent.click(cap.getByRole('button', { name: 'Cancel' }));
  expect(current.xp?.points[0]?.caps).toBeUndefined();
  fireEvent.click(screen.getByRole('button', { name: 'Review Mira XP cap' }));
  cap = within(screen.getByRole('dialog', { name: 'XP cap' }));
  fireEvent.change(cap.getByLabelText('Absolute XP cap'), {
    target: { value: '35001' },
  });
  fireEvent.change(cap.getByLabelText('Reason'), {
    target: { value: 'Synthetic custom cap' },
  });
  fireEvent.click(cap.getByRole('button', { name: 'Apply cap' }));
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
  expect(
    within(screen.getByRole('table', { name: 'XP award' })).getByRole('row', {
      name: /^XP added/,
    })
  ).toHaveTextContent('201');
});
test('Session cap is available without an opening balance and directly follows base level', () => {
  const doc = capCampaign(null);
  const profiles =
    doc.party?.profiles.filter(
      (p) => p.characterId === capCharacter && p.sessionId === 'session-1'
    ) || [];
  render(
    <SessionXpReference
      document={doc}
      sessionId="session-1"
      profiles={profiles}
    />
  );
  const table = within(
    screen.getByRole('table', { name: 'Session XP reference' })
  );
  expect(table.getAllByRole('rowheader').map((r) => r.textContent)).toEqual([
    'Base level',
    'XP cap',
    'XP added this session',
    'XP balance',
  ]);
  expect(table.getByRole('row', { name: /^XP cap/ })).toHaveTextContent(
    '35,001'
  );
  expect(table.getByRole('row', { name: /^XP balance/ })).toHaveTextContent(
    '—'
  );
});
