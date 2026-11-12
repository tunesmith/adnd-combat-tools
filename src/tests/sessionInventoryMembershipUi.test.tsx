/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import EncumbranceApp from '../components/encumbrance/EncumbranceApp';
import CampaignBanking from '../components/desktop/CampaignBanking';
import CreateSessionDialog from '../components/desktop/CreateSessionDialog';
import AddInventoryCharacterDialog from '../components/desktop/AddInventoryCharacterDialog';
import {
  membershipCampaign,
  memberIds,
  holderIds,
  membershipAt,
} from './fixtures/inventoryMembershipCampaign';
import { changeWorkingInventory } from '../helpers/campaignWorkingInventory';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import { earlierInventoryCharacters } from '../helpers/campaignInventoryMembership';
import {
  startNextSession,
  sessionFingerprint,
} from '../helpers/campaignContinuity';
import { copyPartyProfile, updatePartyProfile } from '../helpers/campaignParty';
import { bankBalance } from '../helpers/campaignBanking';
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `membership-ui-${++id}` },
  });
});
const required = <T,>(v: T | undefined): T => {
  if (v === undefined) throw Error('Fixture');
  return v;
};

test('shared removal confirms nested gear, cancellation is inert, and campaign Banking hides a removed zero holder', () => {
  let current = membershipCampaign();
  const initial = current;
  function Harness() {
    const [doc, setDoc] = useState(current),
      [bank, setBank] = useState(false);
    const w = required(
      doc.workingInventories.find((w) => w.sessionId === 'day3')
    );
    return (
      <>
        <button onClick={() => setBank(!bank)}>Switch bank view</button>
        {bank ? (
          <CampaignBanking
            document={doc}
            sessionId="day3"
            onChange={() => true}
          />
        ) : (
          <EncumbranceApp
            mode="dm"
            campaign={{
              document: w.document,
              onExport: () => undefined,
              onDocumentChange: (next) => {
                if (next.kind !== 'adnd-encumbrance-dm') return false;
                const changed = changeWorkingInventory(
                  doc,
                  w.id,
                  'day3',
                  next,
                  { id: 'ui-removal-checkpoint', at: membershipAt }
                );
                validateHistoryTransition(doc, changed, '');
                current = parseCampaign(serializeCampaign(changed));
                setDoc(current);
                return true;
              },
            }}
          />
        )}
      </>
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Oren', exact: true }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit Oren', exact: true })
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Remove character', exact: true })
  );
  expect(
    screen.getByText(/all their items, containers, nested contents and money/)
  ).toBeInTheDocument();
  const before = current;
  fireEvent.click(screen.getByRole('button', { name: 'Cancel removal' }));
  expect(current).toBe(before);
  fireEvent.click(
    screen.getByRole('button', { name: 'Remove character', exact: true })
  );
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(
    screen.queryByRole('button', { name: 'Confirm removal' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('dialog', { name: 'Edit Character' })
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Remove character', exact: true })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(
    screen.queryByRole('button', { name: 'Oren', exact: true })
  ).not.toBeInTheDocument();
  expect(current.banking).toEqual(initial.banking);
  expect(current.party).toEqual(initial.party);
  expect(
    current.inventoryCheckpoints.some((c) => c.id === 'ui-removal-checkpoint')
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Switch bank view' }));
  expect(
    within(screen.getByRole('table', { name: 'Ledger balances' })).queryByRole(
      'rowheader',
      { name: 'Oren' }
    )
  ).not.toBeInTheDocument();
});

test('standalone DM removal handles the last character, and player files never offer holder removal', () => {
  const view = render(<EncumbranceApp mode="dm" />);
  fireEvent.click(
    screen.getByRole('button', { name: /Edit Unnamed adventurer/ })
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Remove character', exact: true })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(
    screen.queryByRole('button', { name: /Edit Unnamed adventurer/ })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add Item' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '+ Character' }));
  expect(
    screen.getByRole('dialog', { name: 'Edit Character' })
  ).toBeInTheDocument();
  view.unmount();
  render(<EncumbranceApp mode="player" />);
  fireEvent.click(
    screen.getByRole('button', { name: /Edit Unnamed adventurer/ })
  );
  expect(
    screen.queryByRole('button', { name: 'Remove character' })
  ).not.toBeInTheDocument();
});

test('new-session choices filter possessions with profiles while independently retaining storage', async () => {
  const before = membershipCampaign();
  let result = before;
  render(
    <CreateSessionDialog
      document={before}
      sessionId="day2"
      onCreate={async (change) => {
        result = change(before);
        validateHistoryTransition(before, result, '');
      }}
      onClose={() => undefined}
    />
  );
  fireEvent.change(screen.getByLabelText('Session name'), {
    target: { value: 'Selected party' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Current inventory' }));
  fireEvent.click(screen.getByText('Party profiles'));
  for (const name of ['Mira', 'Nera', 'Bram'])
    fireEvent.click(screen.getByRole('checkbox', { name: new RegExp(name) }));
  expect(
    screen.queryByRole('checkbox', { name: /Oren/ })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Create session' }));
  await waitFor(() => expect(result.sessions).toHaveLength(3));
  const session = required(
    result.sessions.find((s) => s.label === 'Selected party')
  );
  const copied = required(
    result.workingInventories.find((w) => w.sessionId === session.id)
  );
  expect(copied.document.characters.map((c) => c.id)).toEqual([
    holderIds.mira,
    holderIds.nera,
    holderIds.bram,
  ]);
  expect(
    copied.document.version === 10 && copied.document.storageLocations
  ).toHaveLength(1);
});

test('returning inventory creation is optional, empty by default, and copies only after explicit Add', () => {
  let doc = membershipCampaign();
  doc = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'day2',
    sourceFingerprint: sessionFingerprint(doc, 'day2'),
    destinationId: 'day4',
    label: 'Return',
    combats: [],
    inventory: {
      sourceId: 'day2-stock',
      instanceId: 'day4-inventory',
      checkpointId: 'day4-source',
      characterIds: [holderIds.mira],
    },
    partyCharacterIds: [memberIds.mira],
    copyNotes: false,
    capturedAt: membershipAt,
  });
  doc = updatePartyProfile(
    doc,
    copyPartyProfile(
      required(
        doc.party?.profiles.find(
          (p) => p.characterId === memberIds.absent && p.sessionId === 'day2'
        )
      ),
      'day4'
    )
  );
  const before = doc,
    onClose = jest.fn();
  const props = {
    document: doc,
    sessionId: 'day4',
    workingId: 'day4-inventory',
    onChange: (change: (d: typeof doc) => typeof doc) => {
      const next = change(doc);
      validateHistoryTransition(doc, next, '');
      doc = parseCampaign(serializeCampaign(next));
      return true;
    },
    onAdded: () => undefined,
    onClose,
  };
  const view = render(<AddInventoryCharacterDialog {...props} />);
  fireEvent.change(screen.getByLabelText('Party character'), {
    target: { value: memberIds.absent },
  });
  expect(screen.getByLabelText('Starting inventory')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(doc).toBe(before);
  view.unmount();
  render(<AddInventoryCharacterDialog {...props} />);
  fireEvent.change(screen.getByLabelText('Party character'), {
    target: { value: memberIds.absent },
  });
  const source = required(
    earlierInventoryCharacters(doc, 'day4').find(
      (c) => c.sessionId === 'day2' && c.character.id === holderIds.absent
    )
  );
  fireEvent.change(screen.getByLabelText('Starting inventory'), {
    target: { value: source.key },
  });
  expect(doc).toBe(before);
  fireEvent.click(screen.getByRole('button', { name: 'Add character' }));
  expect(
    required(
      doc.workingInventories.find((w) => w.id === 'day4-inventory')
    ).document.characters.find((c) => c.id === holderIds.absent)
  ).toEqual(source.character);
  expect(doc.banking).toEqual(before.banking);
});

test('a removed holder with money remains reviewable and can be settled without a physical holder', () => {
  const before = membershipCampaign(false),
    w = required(before.workingInventories.find((w) => w.sessionId === 'day3'));
  const document = {
    ...w.document,
    characters: w.document.characters.filter((c) => c.id !== holderIds.absent),
  };
  let current = changeWorkingInventory(before, w.id, 'day3', document, {
    id: 'funded-removal',
    at: membershipAt,
  });
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignBanking
        document={doc}
        sessionId="day3"
        onChange={(change) => {
          const next = change(doc);
          validateHistoryTransition(doc, next, '');
          current = parseCampaign(serializeCampaign(next));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  expect(
    within(screen.getByRole('table', { name: 'Ledger balances' })).getByRole(
      'rowheader',
      { name: 'Tal' }
    )
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '+ Transaction' }));
  const modal = within(
    screen.getByRole('dialog', { name: 'Banking transaction' })
  );
  fireEvent.change(modal.getByLabelText('Description'), {
    target: { value: 'Recorded loss of removed money' },
  });
  fireEvent.change(modal.getByLabelText('Money in possessions'), {
    target: { value: 'existing' },
  });
  fireEvent.change(modal.getByLabelText('Change 1 holder'), {
    target: { value: holderIds.absent },
  });
  fireEvent.change(modal.getByLabelText('Change 1 denomination'), {
    target: { value: 'ep' },
  });
  fireEvent.change(modal.getByLabelText('Change 1 quantity'), {
    target: { value: '-50' },
  });
  expect(modal.getByRole('button', { name: 'Save transaction' })).toBeEnabled();
  fireEvent.click(modal.getByRole('button', { name: 'Save transaction' }));
  expect(bankBalance(current, holderIds.absent, 'day3').ep).toBe(0);
  expect(
    screen.getByRole('button', { name: 'Recorded loss of removed money' })
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole('table', { name: 'Ledger balances' })).queryByRole(
      'rowheader',
      { name: 'Tal' }
    )
  ).not.toBeInTheDocument();
});
