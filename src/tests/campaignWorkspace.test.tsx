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
import { syntheticInventory } from './fixtures/campaignB1';
import type { DocumentState, CampaignStorage } from '../types/campaignStorage';
afterEach(() => {
  delete window.campaignStorage;
});
test('campaign-controlled edits survive navigation, and shortcuts do not steal text input', async () => {
  const doc = startWorkingInventory(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    syntheticInventory(),
    { kind: 'empty' },
    'work',
    'unused',
    '2026-11-04T12:00:00.000Z'
  );
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
  expect(native.document?.records).toEqual(baseline.records);
});
