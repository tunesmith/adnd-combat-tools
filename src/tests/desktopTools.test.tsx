/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import DesktopWorkspace from '../components/desktop/DesktopWorkspace';
import {
  standaloneTools,
  standaloneToolForRoute,
} from '../helpers/standaloneTools';
import { xpCastleDraft } from './fixtures/xpCampaign';
import { serializeCampaign } from '../helpers/campaignDocument';
import type { CampaignStorage, DocumentState } from '../types/campaignStorage';
jest.mock('../components/desktop/StandaloneToolHost', () => ({
  __esModule: true,
  default: ({ path }: { path: string }) => (
    <p>Synthetic bundled tool content {path}</p>
  ),
}));
afterEach(() => {
  delete window.__TAURI__;
  delete window.campaignStorage;
  window.history.replaceState({}, '', '/');
});
test.each([false, true])(
  'all native tools open directly and return without mutating campaign data (campaign=%s)',
  async (hasCampaign) => {
    const doc = hasCampaign ? xpCastleDraft() : null;
    if (doc) doc.workspace.view = 'session';
    const before = doc ? serializeCampaign(doc) : null;
    let openTool: ((event: { payload: unknown }) => void) | undefined;
    window.__TAURI__ = {
      core: {
        invoke: async <T,>(): Promise<T> => {
          throw Error('Unexpected native write');
        },
      },
      event: {
        listen: async <T,>(
          name: string,
          handler: (event: { payload: T }) => void
        ) => {
          if (name === 'open-standalone-tool')
            openTool = handler as (event: { payload: unknown }) => void;
          return () => undefined;
        },
      },
    };
    const native: DocumentState = {
      document: doc,
      path: null,
      recentPath: null,
      dirty: false,
      busy: false,
      token: 1,
      epoch: 1,
      status: '',
      error: null,
    };
    const mutate = jest.fn();
    const command = jest.fn();
    const storage: CampaignStorage = {
      getState: async () => native,
      subscribe: () => () => undefined,
      discardRejectedEdits: async () => native,
      mutate,
      command,
      replace: jest.fn(),
      pickSource: jest.fn(),
      exportSource: jest.fn(),
      exportWorking: jest.fn(),
    };
    window.campaignStorage = storage;
    const view = render(<DesktopWorkspace />);
    await waitFor(() => expect(openTool).toBeDefined());
    expect(
      screen.queryByText('Standalone tools', { selector: 'summary' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Synthetic bundled tool content/)
    ).not.toBeInTheDocument();
    for (const tool of standaloneTools) {
      await act(async () => {
        openTool?.({ payload: tool.path });
      });
      expect(window.location.pathname).toBe(`${tool.path}.html`);
      expect(
        screen.getByRole('heading', { name: tool.label })
      ).toBeInTheDocument();
      expect(screen.getByText(/Synthetic bundled tool content/)).toBeVisible();
      fireEvent.click(
        screen.getByRole('button', {
          name: hasCampaign ? 'Return to campaign' : 'Back to welcome',
        })
      );
      await waitFor(() =>
        expect(
          screen.queryByText(/Synthetic bundled tool content/)
        ).not.toBeInTheDocument()
      );
    }
    expect(mutate).not.toHaveBeenCalled();
    expect(command).not.toHaveBeenCalled();
    expect(doc ? serializeCampaign(doc) : null).toBe(before);
    expect(native.dirty).toBe(false);

    await act(async () => {
      openTool?.({ payload: 'https://example.invalid/tool' });
    });
    expect(window.location.pathname).toBe('/');
    view.unmount();
  }
);
test('tool routing recognizes bundled DM/player subpages without exposing a directory view', () => {
  expect(standaloneToolForRoute('/encumbrance/dm?preview=1')?.id).toBe(
    'tool-encumbrance'
  );
  expect(standaloneToolForRoute('/encumbrance/player')?.id).toBe(
    'tool-encumbrance'
  );
  expect(standaloneToolForRoute('/tracker.html#state')?.id).toBe(
    'tool-tracker'
  );
  expect(standaloneToolForRoute('/')).toBeUndefined();
});
