/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import DesktopWorkspace from '../components/desktop/DesktopWorkspace';
import { parseCampaign } from '../helpers/campaignDocument';
import { startWorkingInventory } from '../helpers/campaignWorkingInventory';
import baseline from './fixtures/campaignB1V2.json';
import { createWorkingCombat } from '../helpers/campaignWorkingCombat';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
import type { DocumentState, CampaignStorage } from '../types/campaignStorage';
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `workspace-bank-${++id}` },
  });
});
afterEach(() => {
  delete window.campaignStorage;
  jest.restoreAllMocks();
});
test('campaign-controlled edits survive navigation, and shortcuts do not steal text input', async () => {
  let doc = startWorkingInventory(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    syntheticInventory(),
    { kind: 'empty' },
    'work',
    'unused',
    '2026-11-04T12:00:00.000Z'
  );
  doc = createWorkingCombat(
    doc,
    'session-1',
    'Gate',
    syntheticCombat(),
    { kind: 'empty' },
    'gate'
  );
  doc = createWorkingCombat(
    doc,
    'session-1',
    'Bridge',
    syntheticCombat(),
    { kind: 'empty' },
    'bridge'
  );
  doc.workspace.view = 'possessions';
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  let native: DocumentState = {
    document: doc,
    path: 'synthetic.adnd',
    recentPath: null,
    dirty: false,
    busy: false,
    token: 1,
    epoch: 1,
    status: 'Opened',
    error: null,
  };
  const listeners = new Set<(s: DocumentState) => void>();
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
      if (id !== native.document?.id || epoch !== native.epoch) return null;
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
    edit: jest.fn(),
    command: jest.fn(),
    pickSource: jest.fn(),
    exportSource: jest.fn(),
    exportWorking: jest.fn(),
  };
  window.campaignStorage = storage;
  render(<DesktopWorkspace />);
  await screen.findByRole('button', { name: 'Edit Blue lantern stones' });
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit Blue lantern stones' })
  );
  const dialog = screen.getByRole('dialog', { name: 'Blue lantern stones' });
  const quantity = within(dialog).getByLabelText('Quantity');
  fireEvent.change(quantity, { target: { value: '6' } });
  fireEvent.keyDown(quantity, {
    key: '2',
    code: 'Digit2',
    metaKey: true,
    altKey: true,
  });
  expect(
    screen.getByRole('button', { name: 'Possessions', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.keyDown(window, {
    key: '2',
    code: 'Digit2',
    metaKey: true,
    altKey: true,
  });
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Combats', exact: true })
    ).toHaveAttribute('aria-pressed', 'true')
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Possessions', exact: true })
  );
  await screen.findByRole('button', { name: 'Edit Blue lantern stones' });
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit Blue lantern stones' })
  );
  expect(
    within(
      screen.getByRole('dialog', { name: 'Blue lantern stones' })
    ).getByLabelText('Quantity')
  ).toHaveValue(6);
  expect(
    native.document?.workingInventories[0]?.document.characters[0]?.inventory.find(
      (i) => i.id === 'gem'
    )?.quantity
  ).toBe(6);
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Combats', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Gate', exact: true }));
  fireEvent.change(
    screen.getByPlaceholderText(
      'Anything you want to remember when you revisit this round later.'
    ),
    { target: { value: 'Gate edit retained' } }
  );
  fireEvent.click(screen.getByRole('button', { name: 'Bridge', exact: true }));
  fireEvent.change(
    screen.getByPlaceholderText(
      'Anything you want to remember when you revisit this round later.'
    ),
    { target: { value: 'Bridge edit retained' } }
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Possessions', exact: true })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Combats', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Gate', exact: true }));
  expect(
    screen.getByPlaceholderText(
      'Anything you want to remember when you revisit this round later.'
    )
  ).toHaveValue('Gate edit retained');
  await waitFor(() =>
    expect(native.document?.workingCombats[1]?.state.rounds[1]?.summary).toBe(
      'Bridge edit retained'
    )
  );
  expect(
    native.document?.workingInventories[0]?.document.characters[0]?.inventory[2]
      ?.quantity
  ).toBe(6);
  expect(native.document?.records).toEqual(baseline.records);
  fireEvent.click(
    screen.getByRole('button', { name: 'Campaign Details', exact: true })
  );
  const details = within(
    screen.getByRole('region', { name: 'Campaign Details' })
  );
  const title = details.getByLabelText('Campaign title');
  const notes = details.getByLabelText('Campaign notes');
  expect(
    title.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(details.queryByText('Session imports')).not.toBeInTheDocument();
  expect(details.queryByText('synthetic.adnd')).not.toBeInTheDocument();
  expect(
    details.queryByText(/Choose a location with File/)
  ).not.toBeInTheDocument();
  expect(details.queryByText(/Campaign Save includes/)).not.toBeInTheDocument();
  fireEvent.change(title, { target: { value: 'Edited synthetic title' } });
  fireEvent.change(notes, { target: { value: 'Campaign-wide note' } });
  await waitFor(() =>
    expect(native.document?.title).toBe('Edited synthetic title')
  );
  expect(native.document?.notes).toBe('Campaign-wide note');
  fireEvent.click(screen.getByRole('button', { name: 'Session', exact: true }));
  const overview = await screen.findByRole('region', {
    name: 'Session overview',
  });
  expect(
    within(overview).getByText('Session imports', { selector: 'summary' })
  ).toBeInTheDocument();
});
