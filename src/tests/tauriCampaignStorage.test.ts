/** @jest-environment jsdom */
import { createTauriStorage } from '../helpers/tauriCampaignStorage';

afterEach(() => {
  delete window.__TAURI__;
});
test('ordinary browser has no native storage', async () => {
  expect(await createTauriStorage()).toBeNull();
});
test.each(['save', 'openPending'])(
  '%s waits for in-flight edits',
  async (action) => {
    let finishEdit: () => void = () => undefined;
    const pendingEdit = new Promise<void>((resolve) => {
      finishEdit = resolve;
    });
    const calls: string[] = [];
    let menuAction: ((event: { payload: unknown }) => void) | undefined;
    window.__TAURI__ = {
      core: {
        invoke: <T>(command: string): Promise<T> => {
          calls.push(command);
          return (command === 'campaign_edit'
            ? pendingEdit
            : Promise.resolve(undefined)) as unknown as Promise<T>;
        },
      },
      event: {
        listen: async <T>(
          name: string,
          handler: (event: { payload: T }) => void
        ) => {
          if (name === 'campaign-action')
            menuAction = handler as (event: { payload: unknown }) => void;
          return () => undefined;
        },
      },
    };
    const storage = await createTauriStorage();
    const edit = storage?.edit('Synthetic', 'Keep the final keystroke');
    await Promise.resolve();
    menuAction?.({ payload: action });
    expect(calls).toEqual(['campaign_edit']);
    finishEdit();
    await edit;
    await Promise.resolve();
    await Promise.resolve();
    expect(calls).toEqual(['campaign_edit', 'campaign_command']);
  }
);
