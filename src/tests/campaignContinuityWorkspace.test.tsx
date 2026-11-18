/** @jest-environment jsdom */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import DesktopWorkspace from '../components/desktop/DesktopWorkspace';
import { parseCampaign } from '../helpers/campaignDocument';
import {
  captureCombatCheckpoint,
  changeWorkingCombat,
  createWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import { startWorkingInventory } from '../helpers/campaignWorkingInventory';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
import type { CampaignDocument } from '../helpers/campaignDocument';
import type { CampaignStorage, DocumentState } from '../types/campaignStorage';
afterEach(() => {
  delete window.campaignStorage;
  jest.restoreAllMocks();
});
test('workspace starts the selected continuation atomically, edits notes independently, and keeps empty creation available', async () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `continuity-ui-${++id}` },
  });
  let doc: CampaignDocument = {
    ...parseCampaign(
      JSON.stringify({
        workingCombats: [],
        combatCheckpoints: [],
        workingInventories: [],
        inventoryCheckpoints: [],
        sessions: [],
        records: [],
        workspace: {
          sessionId: null,
          view: 'possessions',
          combatSelections: {},
        },
        kind: 'adnd-campaign',
        schemaVersion: 21,
        id: 'synthetic',
        title: 'Synthetic workspace',
        notes: 'Campaign notes',
      })
    ),
    sessions: [{ id: 'one', label: 'Session One', notes: 'Source\nnotes' }],
  };
  doc = createWorkingCombat(
    doc,
    'one',
    'Ongoing',
    syntheticCombat(),
    { kind: 'empty' },
    'ongoing'
  );
  doc.workingCombats = doc.workingCombats.map((c) => ({
    ...c,
    status: 'in-progress',
  }));
  doc = startWorkingInventory(
    doc,
    'one',
    syntheticInventory(),
    { kind: 'empty' },
    'inventory',
    'unused',
    '2026-11-04T12:00:00.000Z'
  );
  doc = captureCombatCheckpoint(
    doc,
    'ongoing',
    'Before gate',
    'source-history',
    '2026-11-04T12:00:00.000Z'
  );
  const current = syntheticCombat();
  current.title = 'Ongoing';
  const round = current.rounds[1];
  if (!round?.partyStates[0]) throw new Error('Missing fixture');
  round.partyStates[0].hp = '14';
  doc = changeWorkingCombat(doc, 'ongoing', 'one', 0, current);
  let native: DocumentState = {
    document: doc,
    path: 'synthetic.adnd',
    recentPath: null,
    dirty: false,
    busy: false,
    token: 1,
    epoch: 1,
    status: '',
    error: null,
  };
  const listeners = new Set<(state: DocumentState) => void>();
  const storage: CampaignStorage = {
    getState: async () => native,
    discardRejectedEdits: async () => native,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    mutate: async (id, epoch, change) => {
      if (native.document?.id !== id || native.epoch !== epoch) return null;
      native = {
        ...native,
        document: change(native.document),
        token: native.token + 1,
        dirty: true,
      };
      listeners.forEach((l) => l(native));
      return native;
    },
    replace: jest.fn(),
    command: jest.fn(),
    pickSource: jest.fn(),
    exportWorking: jest.fn(),
    exportSource: jest.fn(),
  };
  window.campaignStorage = storage;
  render(<DesktopWorkspace />);
  await screen.findByRole('button', { name: '+ Session' });
  expect(
    within(screen.getByRole('navigation', { name: 'Session views' }))
      .getAllByRole('button')
      .map((button) => button.textContent)
  ).toEqual(['Overview', 'Reference', 'Ledger', 'Gear', 'Combat', 'XP']);
  fireEvent.change(screen.getByRole('combobox', { name: 'Version' }), {
    target: { value: 'source-history' },
  });
  fireEvent.click(screen.getByRole('button', { name: '+ Session' }));
  fireEvent.change(screen.getByLabelText('Session name'), {
    target: { value: 'Session Two' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Ongoing' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Current inventory' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create session' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'New session' })
    ).not.toBeInTheDocument()
  );
  expect(screen.getByLabelText('Session notes')).toHaveValue('');
  expect(
    screen.getByRole('table', { name: 'Session characters' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '+ Character' })
  ).toBeInTheDocument();
  const copied = native.document?.workingCombats.find(
    (c) => c.sessionId !== 'one'
  );
  expect(copied?.encounterId).toBe('ongoing');
  expect(copied?.state.rounds).toHaveLength(2);
  expect(copied?.state.rounds[1]?.partyStates[0]?.hp).toBe('14');
  expect(native.document?.workingInventories).toHaveLength(2);
  fireEvent.change(screen.getByLabelText('Session notes'), {
    target: { value: 'New session\nnotes' },
  });
  await waitFor(() =>
    expect(native.document?.sessions[1]?.notes).toBe('New session\nnotes')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Session One' }));
  expect(screen.getByLabelText('Session notes')).toHaveValue('Source\nnotes');
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Session views' })).getByRole(
      'button',
      { name: 'Combat', exact: true }
    )
  );
  expect(screen.getByRole('combobox', { name: 'Version' })).toHaveValue(
    'source-history'
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '+ Session' })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole('button', { name: '+ Session' }));
  fireEvent.change(screen.getByLabelText('Session name'), {
    target: { value: 'Historical empty' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create session' }));
  await waitFor(() => expect(native.document?.sessions).toHaveLength(3));
  const empty = native.document?.sessions[2];
  expect(empty?.notes).toBe('');
  expect(
    native.document?.workingCombats.some((c) => c.sessionId === empty?.id)
  ).toBe(false);
  fireEvent.doubleClick(
    screen.getByRole('button', { name: 'Historical empty' })
  );
  fireEvent.change(screen.getByLabelText('Rename session'), {
    target: { value: 'Archive' },
  });
  fireEvent.keyDown(screen.getByLabelText('Rename session'), { key: 'Enter' });
  await waitFor(() =>
    expect(native.document?.sessions[2]?.label).toBe('Archive')
  );
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Session views' })).getByRole(
      'button',
      { name: 'Combat', exact: true }
    )
  );
  fireEvent.click(screen.getByRole('button', { name: '+ Encounter' }));
  expect(screen.getByLabelText('Name')).toHaveFocus();
  expect(screen.getByLabelText('Start with')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Untitled encounter' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create encounter' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Create encounter' })
    ).not.toBeInTheDocument()
  );
  expect(
    screen.getByRole('button', {
      name: 'Untitled encounter',
      exact: true,
      pressed: true,
    })
  ).toBeInTheDocument();
  fireEvent.keyDown(
    screen.getByRole('button', {
      name: 'Untitled encounter',
      exact: true,
      pressed: true,
    }),
    { key: 'F2' }
  );
  fireEvent.change(screen.getByLabelText('Rename encounter'), {
    target: { value: 'New fight' },
  });
  fireEvent.keyDown(screen.getByLabelText('Rename encounter'), {
    key: 'Enter',
  });
  await waitFor(() =>
    expect(
      native.document?.workingCombats.find((c) => c.sessionId === empty?.id)
        ?.state.title
    ).toBe('New fight')
  );
  expect(native.document?.notes).toBe('Campaign notes');
});
