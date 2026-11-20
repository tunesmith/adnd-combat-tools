/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PartyReference from '../components/desktop/PartyReference';
import CampaignXp from '../components/desktop/CampaignXp';
import XpAwardTable from '../components/desktop/XpAwardTable';
import XpRecipients from '../components/desktop/XpRecipients';
import SessionProfileTable from '../components/desktop/SessionProfileTable';
import {
  inPartyOrder,
  profilesInSession,
  reorderPartyCharacter,
} from '../helpers/campaignParty';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  confirmXpAward,
  previewXpAward,
  sessionXpBalances,
} from '../helpers/campaignXp';
import { xpCastleDraft, xpAt, xpTestIds } from './fixtures/xpCampaign';
const required = <T,>(value: T | undefined): T => {
  if (value === undefined) throw Error('Fixture');
  return value;
};
const names = ['Mira', 'Tal', 'Oren', 'Nera', 'Bram'];
const ids = xpTestIds;
const rowNames = (table: HTMLElement) =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelector('th')?.textContent);
function transfer() {
  const values = new Map<string, string>();
  return {
    effectAllowed: '',
    dropEffect: '',
    setData: (key: string, value: string) => values.set(key, value),
    getData: (key: string) => values.get(key) ?? '',
  };
}
function accepted() {
  const doc = xpCastleDraft();
  return confirmXpAward(
    doc,
    'refuge-point',
    previewXpAward(doc, 'refuge-point').fingerprint,
    'party-order-award',
    xpAt
  );
}

test('party order round trips across sessions without modifying profile values, sources or accepted XP', () => {
  const before = accepted(),
    balances = ids.map((id) => sessionXpBalances(before, id, 'session-2'));
  const next = reorderPartyCharacter(
    before,
    'session-2',
    required(ids[4]),
    required(ids[0])
  );
  expect(
    profilesInSession(next, 'session-2').map(
      (p) => next.party?.roster.find((c) => c.id === p.characterId)?.name
    )
  ).toEqual(['Bram', 'Mira', 'Tal', 'Oren', 'Nera']);
  expect(
    profilesInSession(next, 'session-1').map((p) => p.characterId)
  ).toEqual(ids);
  expect(next.party?.roster).toEqual(before.party?.roster);
  expect(next.party?.profiles).toEqual(before.party?.profiles);
  expect(next.xp).toEqual(before.xp);
  expect(next.records).toEqual(before.records);
  validateHistoryTransition(before, next, '');
  const reopened = parseCampaign(serializeCampaign(next));
  expect(reopened.schemaVersion).toBe(21);
  expect(ids.map((id) => sessionXpBalances(reopened, id, 'session-2'))).toEqual(
    balances
  );
  expect(
    profilesInSession(reopened, 'session-2').map(
      (p) => reopened.party?.roster.find((c) => c.id === p.characterId)?.name
    )
  ).toEqual(['Bram', 'Mira', 'Tal', 'Oren', 'Nera']);
  expect(() =>
    reorderPartyCharacter(before, 'session-2', 'missing', required(ids[0]))
  ).toThrow('changed');
  expect(
    inPartyOrder(
      next,
      [{ id: 'old-extra' }, { id: required(ids[0]) }, { id: required(ids[4]) }],
      (c) => c.id
    ).map((c) => c.id)
  ).toEqual([ids[4], ids[0], 'old-extra']);
});

test('dragging a Session row updates References and both XP views, persists, and keeps names editable', () => {
  let current = accepted();
  function Harness() {
    const [doc, setDoc] = useState(current),
      [view, setView] = useState<'session' | 'saves' | 'xp'>('session');
    return (
      <>
        <button onClick={() => setView('session')}>Show session</button>
        <button onClick={() => setView('saves')}>Show references</button>
        <button onClick={() => setView('xp')}>Show XP</button>
        {view === 'xp' ? (
          <CampaignXp
            document={doc}
            sessionId="session-2"
            onConfirmExtension={async () => undefined}
            onChange={(change) => {
              const next = parseCampaign(serializeCampaign(change(doc)));
              validateHistoryTransition(doc, next, '');
              current = next;
              setDoc(next);
              return true;
            }}
          />
        ) : (
          <PartyReference
            document={doc}
            sessionId="session-2"
            view={view}
            onChange={(change) => {
              const next = parseCampaign(serializeCampaign(change(doc)));
              validateHistoryTransition(doc, next, '');
              current = next;
              setDoc(next);
              return true;
            }}
          />
        )}
      </>
    );
  }
  render(<Harness />);
  const dataTransfer = transfer();
  fireEvent.dragStart(
    screen.getByRole('button', { name: 'Bram', exact: true }),
    { dataTransfer }
  );
  const target = required(
    screen.getByRole('button', { name: 'Mira', exact: true }).closest('tr') ??
      undefined
  );
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
  expect(
    rowNames(screen.getByRole('table', { name: 'Session characters' }))
  ).toEqual(['Bram', 'Mira', 'Tal', 'Oren', 'Nera']);
  // The compact Session XP reference uses the same character order.
  expect(
    within(screen.getByRole('table', { name: 'Session XP reference' }))
      .getAllByRole('rowheader')
      .map((c) => c.textContent)
  ).toEqual(['Bram', 'Mira', 'Tal', 'Oren', 'Nera']);
  fireEvent.click(screen.getByRole('button', { name: 'Show references' }));
  const saves = screen.getByRole('table', { name: 'Saving throws' });
  expect(
    rowNames(saves).map((name) => names.find((n) => name?.startsWith(n)))
  ).toEqual(['Bram', 'Mira', 'Tal', 'Oren', 'Nera']);
  fireEvent.click(screen.getByRole('button', { name: 'Show XP' }));
  fireEvent.click(
    screen.getByRole('button', { name: /At the synthetic refuge Confirmed/ })
  );
  expect(
    within(screen.getByRole('table', { name: 'XP award' }))
      .getAllByRole('columnheader')
      .slice(1)
      .map((c) => c.textContent)
  ).toEqual(['Bram', 'Mira', 'Tal', 'Oren', 'Nera']);
  fireEvent.keyDown(screen.getByRole('dialog', { name: 'XP award' }), {
    key: 'Escape',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Show session' }));
  fireEvent.keyDown(screen.getByRole('button', { name: 'Bram', exact: true }), {
    key: 'ArrowDown',
    altKey: true,
    shiftKey: true,
  });
  expect(
    profilesInSession(current, 'session-2').map(
      (p) => current.party?.roster.find((c) => c.id === p.characterId)?.name
    )
  ).toEqual(['Mira', 'Bram', 'Tal', 'Oren', 'Nera']);
  fireEvent.click(screen.getByRole('button', { name: 'Bram', exact: true }));
  expect(
    screen.getByRole('dialog', { name: 'Character profile' })
  ).toBeInTheDocument();
});

test('XP participant rows and draft award columns follow selected session order without rewriting recorded inputs', () => {
  const original = xpCastleDraft();
  const doc = reorderPartyCharacter(
    original,
    'session-2',
    required(ids[3]),
    required(ids[0])
  );
  const reward = required(doc.xp?.rewards[0]),
    point = required(doc.xp?.points[0]);
  const frozen = serializeCampaign(doc);
  const edit = render(
    <XpRecipients document={doc} reward={reward} onChange={() => undefined} />
  );
  expect(rowNames(screen.getByRole('table')).slice(0, 5)).toEqual([
    'Nera',
    'Mira',
    'Tal',
    'Oren',
    'Bram',
  ]);
  edit.unmount();
  render(
    <XpAwardTable
      document={doc}
      point={point}
      rewards={required(doc.xp).rewards}
      onOpen={() => undefined}
      onInspectAllocation={() => undefined}
    />
  );
  expect(
    within(screen.getByRole('table', { name: 'XP award' }))
      .getAllByRole('columnheader')
      .slice(1)
      .map((c) => c.textContent)
  ).toEqual(['Nera', 'Mira', 'Tal', 'Oren', 'Bram']);
  expect(serializeCampaign(doc)).toBe(frozen);
});

test('foreign drops and drops from a replaced campaign cannot reorder the new document', () => {
  const doc = xpCastleDraft(),
    onReorder = jest.fn();
  const props = {
    document: doc,
    profiles: profilesInSession(doc, 'session-2'),
    onReorder,
    onEdit: () => undefined,
    onToggle: () => undefined,
  };
  const view = render(<SessionProfileTable {...props} />);
  const dataTransfer = transfer();
  const target = required(
    screen.getByRole('button', { name: 'Tal', exact: true }).closest('tr') ??
      undefined
  );
  dataTransfer.setData('application/x-adnd-party-character', required(ids[0]));
  fireEvent.drop(target, { dataTransfer });
  expect(onReorder).not.toHaveBeenCalled();
  fireEvent.dragStart(
    screen.getByRole('button', { name: 'Mira', exact: true }),
    { dataTransfer }
  );
  view.rerender(
    <SessionProfileTable
      {...props}
      document={{ ...doc, id: 'replacement-campaign' }}
    />
  );
  fireEvent.drop(target, { dataTransfer });
  expect(onReorder).not.toHaveBeenCalled();
});
