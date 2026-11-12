/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignSnapshots from '../components/desktop/CampaignSnapshots';
import { parseCampaign } from '../helpers/campaignDocument';
import { syntheticCombat } from './fixtures/campaignB1';
import type { CampaignDocument } from '../helpers/campaignDocument';
import type { CampaignStorage, DocumentState } from '../types/campaignStorage';
function setup(fail = false) {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const doc = {
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
        id: 'test',
        title: 'Test',
        notes: '',
      })
    ),
    sessions: [{ id: 's', label: 'Test session' }],
  };
  const replace = jest.fn(
    async (document: CampaignDocument): Promise<DocumentState> => {
      if (fail) throw Error('Synthetic failed update');
      return {
        document,
        path: null,
        recentPath: null,
        dirty: true,
        busy: false,
        token: 2,
        epoch: 1,
        status: '',
        error: null,
      };
    }
  );
  const storage: CampaignStorage = {
    replace,
    getState: jest.fn(),
    discardRejectedEdits: jest.fn(),
    subscribe: () => () => undefined,
    mutate: jest.fn(),
    command: jest.fn(),
    exportWorking: jest.fn(),
    exportSource: jest.fn(),
    pickSource: jest.fn(),
  };
  window.campaignStorage = storage;
  render(
    <CampaignSnapshots
      document={doc}
      token={1}
      busy={false}
      activeSessionId="s"
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Import combat JSON' }));
  const text = JSON.stringify(syntheticCombat());
  fireEvent.change(screen.getByLabelText('Original source'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Preview import' }));
  return { replace, text, doc };
}
afterEach(() => {
  delete window.campaignStorage;
  jest.restoreAllMocks();
});
test('Import and use is atomic, seeds the title once, and clears the successful draft', async () => {
  const { replace } = setup();
  expect(screen.getByLabelText('Record title')).toHaveValue(
    'Synthetic lantern skirmish'
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Import and use', exact: true })
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('ready to edit')
  );
  const next = replace.mock.calls[0]?.[0];
  expect(next?.records).toHaveLength(1);
  expect(next?.workingCombats).toHaveLength(1);
  expect(next?.workspace.view).toBe('combats');
  expect(screen.getByLabelText('Original source')).toHaveValue('');
  expect(screen.queryByLabelText('Record title')).not.toBeInTheDocument();
});
test('store-only preserves evidence without activation and a new import defaults to new source', async () => {
  const { replace } = setup();
  fireEvent.change(screen.getByLabelText('Import outcome'), {
    target: { value: 'store' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Store snapshot only', exact: true })
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Snapshot stored')
  );
  expect(replace.mock.calls[0]?.[0].workingCombats).toEqual([]);
  fireEvent.change(screen.getByLabelText('Original source'), {
    target: { value: JSON.stringify({ ...syntheticCombat(), title: 'Next' }) },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Preview import' }));
  expect(screen.getByLabelText('Record title')).toHaveValue('Next');
  expect(screen.getByLabelText('Import destination')).toHaveValue('new');
  expect(screen.getByLabelText('Import outcome')).toHaveValue('use');
});
test('failed updates retain the draft and cancel changes no records', async () => {
  const { replace, text } = setup(true);
  fireEvent.change(screen.getByLabelText('Record title'), {
    target: { value: 'Retained title' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Import and use', exact: true })
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'Synthetic failed update'
    )
  );
  expect(screen.getByLabelText('Original source')).toHaveValue(text);
  expect(screen.getByLabelText('Record title')).toHaveValue('Retained title');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel import' }));
  expect(replace).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Original source')).toHaveValue('');
});
