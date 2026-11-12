/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import DesktopWorkspace from '../components/desktop/DesktopWorkspace';
import { createTauriStorage } from '../helpers/tauriCampaignStorage';
import { parseCampaign } from '../helpers/campaignDocument';
import { createWorkingCombat } from '../helpers/campaignWorkingCombat';
import { syntheticCombat } from './fixtures/campaignB1';
import baseline from './fixtures/campaignSnapshots.json';
import type { DocumentState } from '../types/campaignStorage';
afterEach(() => {
  delete window.campaignStorage;
  delete window.__TAURI__;
  jest.restoreAllMocks();
});
test('native rejection retains the visible draft and Retry clears the error only after acceptance', async () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const doc = createWorkingCombat(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    'Encounter',
    syntheticCombat(),
    { kind: 'empty' },
    'encounter'
  );
  let state: DocumentState = {
    document: doc,
    epoch: 1,
    token: 1,
    dirty: false,
    busy: false,
    path: 'test.adnd',
    recentPath: null,
    status: '',
    error: null,
  };
  let failure = true;
  const listeners = new Map<string, (event: { payload: unknown }) => void>();
  window.__TAURI__ = {
    core: {
      invoke: async <T,>(
        name: string,
        args?: Record<string, unknown>
      ): Promise<T> => {
        if (name === 'campaign_state') {
          listeners.get('campaign-state')?.({ payload: state });
          return state as unknown as T;
        }
        if (name === 'campaign_replace') {
          if (failure) throw Error('Injected replacement rejection');
          state = {
            ...state,
            document: parseCampaign(String(args?.['text'])),
            token: state.token + 1,
            dirty: true,
          };
          listeners.get('campaign-state')?.({ payload: state });
          return state as unknown as T;
        }
        return undefined as unknown as T;
      },
    },
    event: {
      listen: async <T,>(
        name: string,
        handler: (event: { payload: T }) => void
      ) => {
        listeners.set(name, handler as (event: { payload: unknown }) => void);
        return () => undefined;
      },
    },
  };
  const storage = await createTauriStorage();
  if (!storage) throw Error('Missing native mock');
  window.campaignStorage = storage;
  render(<DesktopWorkspace />);
  const notes = await screen.findByPlaceholderText(
    'Anything you want to remember when you revisit this round later.'
  );
  fireEvent.change(notes, { target: { value: 'Retain this exact input' } });
  await act(async () => {
    await expect(storage.command('save')).rejects.toThrow(
      'Injected replacement rejection'
    );
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Injected replacement rejection'
  );
  expect(notes).toHaveValue('Retain this exact input');
  failure = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry pending edits' }));
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  );
  expect(notes).toHaveValue('Retain this exact input');
  expect(
    state.document?.workingCombats.find((c) => c.id === 'encounter')?.state
      .rounds[1]?.summary
  ).toBe('Retain this exact input');
  await act(async () => {
    await storage.command('save');
  });
});
