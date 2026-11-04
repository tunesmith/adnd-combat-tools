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

test('Save waits for attachment validation and application', async () => {
  let finish: () => void = () => undefined;
  const mutation = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const calls: string[] = [];
  window.__TAURI__ = {
    core: {
      invoke: <T>(name: string): Promise<T> => {
        calls.push(name);
        return (name === 'campaign_replace'
          ? mutation
          : Promise.resolve()) as unknown as Promise<T>;
      },
    },
    event: { listen: async () => () => undefined },
  };
  const storage = await createTauriStorage();
  const replacement = storage?.replace(
    {
      kind: 'adnd-campaign',
      schemaVersion: 3,
      workingInventories: [],
      inventoryCheckpoints: [],
      workspace: { sessionId: null, view: 'possessions' },
      id: 'synthetic',
      title: '',
      notes: '',
      sessions: [],
      records: [],
    },
    0
  );
  await Promise.resolve();
  const save = storage?.command('save');
  expect(calls).toEqual(['campaign_replace']);
  finish();
  await replacement;
  await save;
  expect(calls).toEqual(['campaign_replace', 'campaign_command']);
});

test('queued campaign mutations rebase on accepted state and stale epochs are cancelled', async () => {
  const doc = {
    kind: 'adnd-campaign' as const,
    schemaVersion: 3 as const,
    id: 'campaign',
    title: '',
    notes: '',
    sessions: [],
    records: [],
    workingInventories: [],
    inventoryCheckpoints: [],
    workspace: { sessionId: null, view: 'possessions' as const },
  };
  let native = {
    document: doc,
    path: null,
    recentPath: null,
    dirty: false,
    busy: false,
    token: 0,
    epoch: 5,
    status: '',
    error: null,
  };
  let writes = 0;
  window.__TAURI__ = {
    core: {
      invoke: async <T>(
        command: string,
        args?: Record<string, unknown>
      ): Promise<T> => {
        if (command === 'campaign_state') return native as unknown as T;
        if (command === 'campaign_replace') {
          expect(args?.['token']).toBe(native.token);
          writes++;
          native = {
            ...native,
            token: native.token + 1,
            document: JSON.parse(String(args?.['text'])),
          };
          return native as unknown as T;
        }
        return undefined as unknown as T;
      },
    },
    event: { listen: async () => () => undefined },
  };
  const storage = await createTauriStorage();
  await Promise.all([
    storage?.mutate('campaign', 5, (d) => ({ ...d, notes: 'first' })),
    storage?.mutate('campaign', 5, (d) => ({
      ...d,
      title: d.notes + ' second',
    })),
  ]);
  expect(native.document.title).toBe('first second');
  expect(writes).toBe(2);
  native = { ...native, epoch: 6 };
  expect(
    await storage?.mutate('campaign', 5, (d) => ({ ...d, notes: 'late' }))
  ).toBeNull();
  expect(writes).toBe(2);
});

test('rejected edits block Save until the accepted draft is restored', async () => {
  const calls: string[] = [];
  window.__TAURI__ = {
    core: {
      invoke: async <T>(name: string): Promise<T> => {
        calls.push(name);
        if (name === 'campaign_state')
          return { epoch: 1, document: { id: 'c' } } as unknown as T;
        if (name === 'campaign_replace') throw new Error('Too large');
        return undefined as unknown as T;
      },
    },
    event: { listen: async () => () => undefined },
  };
  const storage = await createTauriStorage();
  await expect(storage?.mutate('c', 1, (d) => d)).rejects.toThrow('Too large');
  await expect(storage?.command('save')).rejects.toThrow('Too large');
  expect(calls).not.toContain('campaign_command');
  await storage?.discardRejectedEdits();
  await storage?.command('save');
  expect(calls).toContain('campaign_command');
});
