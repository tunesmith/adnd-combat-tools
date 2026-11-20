/** @jest-environment jsdom */
import type { CampaignDocument } from '../helpers/campaignDocument';
import { createTauriStorage } from '../helpers/tauriCampaignStorage';

afterEach(() => {
  delete window.__TAURI__;
});
test('ordinary browser has no native storage', async () => {
  expect(await createTauriStorage()).toBeNull();
});
test.each(['save', 'quit', 'openPending:test-file'])(
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
          return (command === 'campaign_replace'
            ? pendingEdit.then(() => ({
                document: { id: 'synthetic' },
                epoch: 1,
                token: 1,
              }))
            : Promise.resolve({
                document: { id: 'synthetic' },
                epoch: 1,
                token: 0,
              })) as unknown as Promise<T>;
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
    const edit = storage?.mutate('synthetic', 1, (d) => ({
      ...d,
      title: 'Synthetic',
      notes: 'Keep the final keystroke',
    }));
    await Promise.resolve();
    await Promise.resolve();
    menuAction?.({ payload: action });
    expect(calls).toEqual(['campaign_state', 'campaign_replace']);
    finishEdit();
    await edit;
    await Promise.resolve();
    await Promise.resolve();
    expect(calls).toEqual([
      'campaign_state',
      'campaign_replace',
      'campaign_command',
    ]);
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
          ? mutation.then(() => ({ document: null, epoch: 1, token: 1 }))
          : Promise.resolve()) as unknown as Promise<T>;
      },
    },
    event: { listen: async () => () => undefined },
  };
  const storage = await createTauriStorage();
  const replacement = storage?.replace(
    {
      kind: 'adnd-campaign',
      schemaVersion: 21,
      workingCombats: [],
      combatCheckpoints: [],
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
    schemaVersion: 21 as const,
    workingCombats: [],
    combatCheckpoints: [],
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
  await expect(
    storage?.mutate('c', 1, (d) => ({ ...d, notes: 'later queued edit' }))
  ).rejects.toThrow('Too large');
  await expect(storage?.command('save')).rejects.toThrow('Too large');
  expect(calls).not.toContain('campaign_command');
  await storage?.discardRejectedEdits();
  await storage?.command('save');
  expect(calls).toContain('campaign_command');
});

test.each(['save', 'quit', 'openPending:test-file'])(
  '%s waits for a queued combat edit and retains inventory',
  async (action) => {
    const { parseCampaign } = await import('../helpers/campaignDocument');
    const { createWorkingCombat, changeWorkingCombat } = await import(
      '../helpers/campaignWorkingCombat'
    );
    const { syntheticCombat, syntheticInventory } = await import(
      './fixtures/campaignB1'
    );
    const { startWorkingInventory } = await import(
      '../helpers/campaignWorkingInventory'
    );
    const baseline = (await import('./fixtures/campaignSnapshots.json'))
      .default;
    let doc = createWorkingCombat(
      startWorkingInventory(
        parseCampaign(JSON.stringify(baseline)),
        'session-1',
        syntheticInventory(),
        { kind: 'empty' },
        'inventory',
        'unused',
        '2026-11-04T12:00:00.000Z'
      ),
      'session-1',
      'Gate',
      syntheticCombat(),
      { kind: 'empty' },
      'encounter'
    );
    let finish: () => void = () => undefined;
    const blocked = new Promise<void>((resolve) => {
      finish = resolve;
    });
    let onAction: ((event: { payload: unknown }) => void) | undefined;
    const commands: string[] = [];
    window.__TAURI__ = {
      core: {
        invoke: async <T>(
          name: string,
          args?: Record<string, unknown>
        ): Promise<T> => {
          if (name === 'campaign_state')
            return { document: doc, epoch: 1, token: 1 } as unknown as T;
          if (name === 'campaign_replace') {
            await blocked;
            doc = parseCampaign(String(args?.['text']));
            return { document: doc, epoch: 1, token: 2 } as unknown as T;
          }
          commands.push(String(args?.['command']));
          return undefined as unknown as T;
        },
      },
      event: {
        listen: async <T>(
          name: string,
          handler: (event: { payload: T }) => void
        ) => {
          if (name === 'campaign-action')
            onAction = handler as (event: { payload: unknown }) => void;
          return () => undefined;
        },
      },
    };
    const storage = await createTauriStorage();
    const state = syntheticCombat();
    const round = state.rounds[1];
    if (!round) throw Error('fixture');
    round.summary = 'Last keystroke before native command';
    const edit = storage?.mutate(doc.id, 1, (d) =>
      changeWorkingCombat(d, 'encounter', 'session-1', 0, state)
    );
    onAction?.({ payload: action });
    await Promise.resolve();
    expect(commands).toEqual([]);
    finish();
    await edit;
    await Promise.resolve();
    await Promise.resolve();
    expect(commands).toEqual([action]);
    expect(doc.workingCombats[0]?.state.rounds[1]?.summary).toBe(
      'Last keystroke before native command'
    );
    expect(doc.workingInventories[0]?.document.characters).toHaveLength(2);
  }
);

test.each(['save', 'quit', 'openPending:test-file'])(
  '%s waits for one atomic XP confirmation and ignores a stale award callback',
  async (action) => {
    const { xpCastleDraft } = await import('./fixtures/xpCampaign');
    const { previewXpAward, confirmXpAward, xpLedger } = await import(
      '../helpers/campaignXp'
    );
    const { parseCampaign } = await import('../helpers/campaignDocument');
    let doc = xpCastleDraft(),
      epoch = 1;
    const preview = previewXpAward(doc, 'refuge-point');
    let finish: () => void = () => undefined;
    const blocked = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const commands: string[] = [];
    let onAction: ((event: { payload: unknown }) => void) | undefined;
    window.__TAURI__ = {
      core: {
        invoke: async <T>(
          name: string,
          args?: Record<string, unknown>
        ): Promise<T> => {
          if (name === 'campaign_state')
            return { document: doc, epoch, token: 1 } as unknown as T;
          if (name === 'campaign_replace') {
            await blocked;
            doc = parseCampaign(String(args?.['text']));
            return { document: doc, epoch, token: 2 } as unknown as T;
          }
          commands.push(String(args?.['command']));
          return undefined as unknown as T;
        },
      },
      event: {
        listen: async <T>(
          name: string,
          handler: (event: { payload: T }) => void
        ) => {
          if (name === 'campaign-action')
            onAction = handler as (event: { payload: unknown }) => void;
          return () => undefined;
        },
      },
    };
    const storage = await createTauriStorage();
    const edit = storage?.mutate(doc.id, 1, (d) =>
      confirmXpAward(
        d,
        'refuge-point',
        preview.fingerprint,
        'queued-award',
        '2026-11-07T12:00:00.000Z'
      )
    );
    onAction?.({ payload: action });
    await Promise.resolve();
    expect(commands).toEqual([]);
    finish();
    await edit;
    await Promise.resolve();
    await Promise.resolve();
    expect(commands).toEqual([action]);
    expect(xpLedger(doc).events).toHaveLength(1);
    expect(xpLedger(doc).events[0]?.rows.map((r) => r.award)).toEqual([
      507, 507, 507, 461, 507,
    ]);
    epoch = 2;
    expect(
      await storage?.mutate(doc.id, 1, (d) =>
        confirmXpAward(
          d,
          'refuge-point',
          preview.fingerprint,
          'late-award',
          '2026-11-07T12:00:00.000Z'
        )
      )
    ).toBeNull();
    expect(xpLedger(doc).events).toHaveLength(1);
  }
);

function queueHarness(
  document: CampaignDocument = {
    kind: 'adnd-campaign' as const,
    schemaVersion: 21 as const,
    id: 'c',
    title: '',
    notes: '',
    sessions: [],
    records: [],
    workingCombats: [],
    combatCheckpoints: [],
    workingInventories: [],
    inventoryCheckpoints: [],
    workspace: { sessionId: null, view: 'combats' as const },
  }
) {
  let current = {
    document,
    epoch: 1,
    token: 0,
    dirty: false,
    busy: false,
    path: null,
    recentPath: null,
    status: '',
    error: null,
  };
  const writes: string[] = [],
    saved: string[] = [];
  const events = new Map<string, (event: { payload: unknown }) => void>();
  let readBlock: Promise<void> | undefined;
  let block: Promise<void> | undefined,
    blockCommand: Promise<void> | undefined,
    rejection: Error | undefined;
  window.__TAURI__ = {
    core: {
      invoke: async <T>(
        name: string,
        args?: Record<string, unknown>
      ): Promise<T> => {
        if (name === 'campaign_state') {
          if (readBlock) await readBlock;
          return current as unknown as T;
        }
        if (name === 'campaign_replace') {
          if (block) await block;
          if (rejection) throw rejection;
          current = {
            ...current,
            document: JSON.parse(String(args?.['text'])),
            token: current.token + 1,
            dirty: true,
          };
          writes.push(current.document.notes);
          return current as unknown as T;
        }
        if (name === 'campaign_command') {
          saved.push(current.document.notes);
          if (blockCommand) await blockCommand;
          current = { ...current, dirty: false };
        }
        return undefined as unknown as T;
      },
    },
    event: {
      listen: async <T>(
        name: string,
        handler: (event: { payload: T }) => void
      ) => {
        events.set(name, handler as (event: { payload: unknown }) => void);
        return () => undefined;
      },
    },
  };
  return {
    writes,
    saved,
    events,
    current: () => current,
    blockRead: (promise?: Promise<void>) => {
      readBlock = promise;
    },
    block: (promise?: Promise<void>) => {
      block = promise;
    },
    blockCommand: (promise?: Promise<void>) => {
      blockCommand = promise;
    },
    reject: (error?: Error) => {
      rejection = error;
    },
    epoch: () => {
      current = { ...current, epoch: current.epoch + 1 };
    },
  };
}
const combatKey = {
  combatId: 'encounter',
  sessionId: 'session',
  generation: 0,
};
function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
test('typing coalesces but discrete operations and command barriers preserve accepted order', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  const first = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'a' }),
    combatKey
  );
  const last = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'abc' }),
    combatKey
  );
  expect(first).toBe(last);
  const discrete = storage?.mutate('c', 1, (d) => ({
    ...d,
    title: d.notes + ' banking',
  }));
  const after = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: d.title + ' final' }),
    combatKey
  );
  await storage?.command('save');
  await Promise.all([first, last, discrete, after]);
  expect(h.writes).toEqual(['abc', 'abc', 'abc banking final']);
  expect(h.saved).toEqual(['abc banking final']);
});
test('delayed acceptance coalesces trailing input, repeated Save is single, and edits during save stay dirty', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  const delay = deferred(),
    saving = deferred();
  h.block(delay.promise);
  h.blockCommand(saving.promise);
  const edit = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'before save' }),
    combatKey
  );
  const save = storage?.command('save');
  expect(storage?.command('save')).toBe(save);
  const later = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'during' }),
    combatKey
  );
  const latest = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'during save final' }),
    combatKey
  );
  expect(later).toBe(latest);
  delay.resolve();
  await edit;
  // The post-command edit cannot cross the save snapshot barrier.
  saving.resolve();
  await save;
  await latest;
  expect(h.saved).toEqual(['before save']);
  expect(h.writes).toEqual(['before save', 'during save final']);
  expect(h.current().dirty).toBe(true);
  await storage?.command('save');
  expect(h.saved).toEqual(['before save', 'during save final']);
});
test('menu failures are visible; rejected input is retained for retry in order, or deliberately discarded', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  const phases: string[] = [];
  await storage?.getState();
  storage?.subscribe((s) => phases.push(s.error || s.queue?.phase || 'idle'));
  h.reject(new Error('Validation timed out'));
  const bad = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'keep me' }),
    combatKey
  );
  h.events.get('campaign-action')?.({ payload: 'save' });
  await expect(bad).rejects.toThrow('Validation timed out');
  await expect(storage?.command('save')).rejects.toThrow(
    'Validation timed out'
  );
  expect(phases.some((s) => s.includes('Validation timed out'))).toBe(true);
  expect(h.saved).toEqual([]);
  h.reject();
  await storage?.retryRejectedEdits?.();
  expect(h.current().document.notes).toBe('keep me');
  expect(phases[phases.length - 1]).toBe('idle');
  await storage?.command('save');
  expect(h.saved).toEqual(['keep me']);
  h.reject(new Error('Rejected'));
  await expect(
    storage?.mutate('c', 1, (d) => ({ ...d, notes: 'discard me' }))
  ).rejects.toThrow('Rejected');
  await storage?.discardRejectedEdits();
  h.reject();
  await storage?.command('save');
  expect(h.saved).toEqual(['keep me', 'keep me']);
});
test('composition flush includes the final input, and stale epochs never receive a draft', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  document.dispatchEvent(new Event('compositionstart', { bubbles: true }));
  const partial = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'partial' }),
    combatKey
  );
  const save = storage?.command('save');
  const final = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: '確定' }),
    combatKey
  );
  document.dispatchEvent(new Event('compositionend', { bubbles: true }));
  await save;
  await Promise.all([partial, final]);
  expect(h.saved).toEqual(['確定']);
  const stale = storage?.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'wrong document' }),
    combatKey
  );
  h.epoch();
  await storage?.command('save');
  expect(await stale).toBeNull();
  expect(h.saved).toEqual(['確定', '確定']);
});

test.each(['banking', 'xp'] as const)(
  'combat edits on both sides of an accepted %s operation preserve its ledger',
  async (kind) => {
    const { bankFixture, bankLeg, bankPost } = await import(
      './fixtures/bankingKifu'
    );
    const { xpCastleDraft } = await import('./fixtures/xpCampaign');
    const { confirmXpAward, previewXpAward, xpLedger } = await import(
      '../helpers/campaignXp'
    );
    const { bankLedger } = await import('../helpers/campaignBanking');
    const { createWorkingCombat, changeWorkingCombat } = await import(
      '../helpers/campaignWorkingCombat'
    );
    const { parseCampaign, validateHistoryTransition } = await import(
      '../helpers/campaignDocument'
    );
    const { syntheticCombat } = await import('./fixtures/campaignB1');
    let doc = kind === 'banking' ? bankFixture() : xpCastleDraft();
    const sessionId = doc.sessions[0]?.id;
    if (!sessionId) throw Error('Missing session');
    doc = createWorkingCombat(
      doc,
      sessionId,
      'Test',
      syntheticCombat(),
      { kind: 'empty' },
      'editor'
    );
    let token = 0;
    window.__TAURI__ = {
      core: {
        invoke: async <T>(
          name: string,
          args?: Record<string, unknown>
        ): Promise<T> => {
          if (name === 'campaign_replace') {
            const next = parseCampaign(String(args?.['text']));
            validateHistoryTransition(doc, next, '');
            doc = next;
            token++;
          }
          return { document: doc, epoch: 1, token } as unknown as T;
        },
      },
      event: { listen: async () => () => undefined },
    };
    const storage = await createTauriStorage();
    const edit = (value: string) => {
      const state = syntheticCombat(),
        round = state.rounds[1];
      if (!round) throw Error('Missing round');
      round.summary = value;
      return storage?.mutate(
        doc.id,
        1,
        (d) => changeWorkingCombat(d, 'editor', sessionId, 0, state),
        { combatId: 'editor', sessionId, generation: 0 }
      );
    };
    const early = edit('intermediate'),
      before = edit('before transaction');
    const transaction = storage?.mutate(doc.id, 1, (d) =>
      kind === 'xp'
        ? confirmXpAward(
            d,
            'refuge-point',
            previewXpAward(d, 'refuge-point').fingerprint,
            'queued-award',
            '2026-11-07T12:00:00.000Z'
          )
        : bankPost(d, {
            transactionId: 'queued-transfer',
            sessionId: 'day3',
            description: 'Ordered transfer',
            kind: 'transfer',
            changes: [
              bankLeg(d, 'day3', 'castle-kifu-storage', 'ep', -1, 'castle-ep'),
              bankLeg(d, 'day3', 'inventory-reatha', 'ep', 1, 'queued-ep'),
            ],
          })
    );
    const after = edit('after transaction');
    await storage?.command('save');
    await Promise.all([early, before, transaction, after]);
    expect(token).toBe(3);
    expect(
      doc.workingCombats.find((c) => c.id === 'editor')?.state.rounds[1]
        ?.summary
    ).toBe('after transaction');
    if (kind === 'xp')
      expect(xpLedger(doc).events.some((e) => e.id === 'queued-award')).toBe(
        true
      );
    else
      expect(
        bankLedger(doc).entries.some(
          (e) => e.transactionId === 'queued-transfer'
        )
      ).toBe(true);
  }
);

test('one subscription keeps newer optimistic input over native status while mutation promises return accepted data', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  if (!storage) throw Error('Missing storage');
  let shown = await storage.getState();
  storage.subscribe((s) => {
    shown = s;
  });
  const delay = deferred();
  h.block(delay.promise);
  const first = storage.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'first' }),
    combatKey
  );
  const save = storage.command('save');
  const last = storage.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'latest' }),
    combatKey
  );
  expect(shown.document?.notes).toBe('latest');
  expect(shown.queue?.queued).toBe(3);
  h.events.get('campaign-state')?.({
    payload: { ...h.current(), busy: true, activity: 'save' },
  });
  expect(shown.document?.notes).toBe('latest');
  expect(shown.busy).toBe(true);
  delay.resolve();
  expect((await first)?.document?.notes).toBe('first');
  await save;
  await last;
  expect(shown.document?.notes).toBe('latest');
  expect(shown.queue?.queued).toBe(0);
  expect(shown.dirty).toBe(true);
  // A delayed native snapshot must not roll back the accepted revision.
  h.events.get('campaign-state')?.({
    payload: {
      ...h.current(),
      token: 0,
      document: { ...h.current().document, notes: 'stale' },
    },
  });
  expect(shown.document?.notes).toBe('latest');
});

test('discard owns editor invalidation and preserves input submitted during recovery', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  if (!storage) throw Error('Missing storage');
  let shown = await storage.getState();
  const version = shown.editorVersion;
  storage.subscribe((s) => {
    shown = s;
  });
  h.reject(Error('Rejected'));
  const rejected = storage.mutate('c', 1, (d) => ({
    ...d,
    notes: 'discard this',
  }));
  await expect(rejected).rejects.toThrow('Rejected');
  expect(shown.document?.notes).toBe('discard this');
  expect(shown.queue?.rejected).toBe(true);
  const read = deferred();
  h.blockRead(read.promise);
  h.reject();
  const discard = storage.discardRejectedEdits();
  const newer = storage.mutate('c', 1, (d) => ({
    ...d,
    notes: 'typed during discard',
  }));
  expect(shown.document?.notes).toBe('typed during discard');
  read.resolve();
  await discard;
  await newer;
  expect(shown.document?.notes).toBe('typed during discard');
  expect(shown.editorVersion).toBe((version || 0) + 1);
  expect(shown.queue?.rejected).toBe(false);
  expect(
    await storage.mutate(
      'c',
      1,
      (d) => ({ ...d, notes: 'late editor callback' }),
      combatKey,
      { editorVersion: version }
    )
  ).toBeNull();
  expect(shown.document?.notes).toBe('typed during discard');
});

test('late errors from the previous document cannot poison the new document', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  if (!storage) throw Error('Missing storage');
  let shown = await storage.getState();
  storage.subscribe((s) => {
    shown = s;
  });
  const delay = deferred();
  h.block(delay.promise);
  h.reject(Error('Old edit rejected'));
  const old = storage.mutate('c', 1, (d) => ({ ...d, notes: 'old input' }));
  await Promise.resolve();
  await Promise.resolve();
  h.epoch();
  h.events.get('campaign-state')?.({ payload: h.current() });
  delay.resolve();
  await expect(old).rejects.toThrow('Old edit rejected');
  expect(shown.epoch).toBe(2);
  expect(shown.error).toBeNull();
  expect(shown.queue?.rejected).toBe(false);
  h.reject();
  await storage.mutate('c', 2, (d) => ({ ...d, notes: 'new document input' }));
  await storage.command('save');
  expect(h.saved).toEqual(['new document input']);
});

test('accepted-only operations do not show an unconfirmed result as an optimistic edit', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  if (!storage) throw Error('Missing storage');
  let shown = await storage.getState();
  storage.subscribe((s) => {
    shown = s;
  });
  const delay = deferred();
  h.block(delay.promise);
  const confirmation = storage.mutate(
    'c',
    1,
    (d) => ({ ...d, title: 'confirmed transaction' }),
    undefined,
    { preview: false }
  );
  const edit = storage.mutate(
    'c',
    1,
    (d) => ({ ...d, notes: 'typed while confirming' }),
    combatKey
  );
  expect(shown.document?.title).toBe('');
  expect(shown.document?.notes).toBe('typed while confirming');
  delay.resolve();
  await confirmation;
  await edit;
  expect(shown.document?.title).toBe('confirmed transaction');
  expect(shown.document?.notes).toBe('typed while confirming');
});

test('inventory membership invalidates callbacks from the editor it replaces', async () => {
  const h = queueHarness(),
    storage = await createTauriStorage();
  if (!storage) throw Error('Missing storage');
  const { syntheticInventory } = await import('./fixtures/campaignB1');
  const { startWorkingInventory } = await import(
    '../helpers/campaignWorkingInventory'
  );
  await storage.getState();
  await storage.mutate('c', 1, (d) =>
    startWorkingInventory(
      { ...d, sessions: [{ id: 'session', label: 'Session' }] },
      'session',
      syntheticInventory(),
      { kind: 'empty' },
      'inventory',
      'checkpoint',
      '2026-11-12T12:00:00.000Z'
    )
  );
  const oldEditor = await storage.getState();
  await storage.mutate('c', 1, (d) => ({
    ...d,
    workingInventories: d.workingInventories.map((w) => ({
      ...w,
      document: {
        ...w.document,
        characters: [
          ...w.document.characters,
          ...w.document.characters.slice(0, 1).map((c) => ({
            ...c,
            id: 'added',
            name: 'New member',
            inventory: [],
          })),
        ],
      },
    })),
  }));
  expect((await storage.getState()).editorVersion).not.toBe(
    oldEditor.editorVersion
  );
  const stale = jest.fn((d) => ({ ...d, notes: 'stale inventory edit' }));
  expect(
    await storage.mutate('c', 1, stale, undefined, {
      editorVersion: oldEditor.editorVersion,
    })
  ).toBeNull();
  expect(stale).not.toHaveBeenCalled();
  expect(h.current().document.notes).toBe('');
});

test('inventory batches rebase exact fields across a transfer, direct quantity edit and reconciliation', async () => {
  const { bankFixture, bankLeg, bankPost, bankingAt } = await import(
    './fixtures/bankingKifu'
  );
  const {
    editWorkingInventoryFields,
    changeWorkingInventory,
    startWorkingInventory,
  } = await import('../helpers/campaignWorkingInventory');
  const {
    bankHolders,
    bankReconciliationFingerprint,
    commitBankReconciliation,
  } = await import('../helpers/campaignBanking');
  const { parseCampaign, serializeCampaign } = await import(
    '../helpers/campaignDocument'
  );
  const original = bankFixture(),
    sessionId = 'day3',
    holderId = 'castle-kifu-storage',
    workingId = 'day3-stock',
    itemId = 'castle-ep';
  original.workspace = {
    ...original.workspace,
    sessionId,
    view: 'possessions',
  };
  const h = queueHarness(original),
    storage = await createTauriStorage();
  if (!storage) throw Error('Fixture');
  await storage.getState();
  const edit = (
    fields: { playerNotes?: string; quantity?: number; day?: number },
    item = itemId
  ) =>
    storage.mutate(
      original.id,
      1,
      (d) =>
        editWorkingInventoryFields(d, workingId, sessionId, {
          kind: 'item',
          holderId,
          itemId: item,
          fields,
        }),
      {
        sessionId,
        workingId,
        holderId,
        itemId: item,
        fields: Object.keys(fields),
      }
    );
  const work = (d: CampaignDocument) => {
    const w = d.workingInventories.find((w) => w.id === workingId);
    if (!w || w.document.version !== 10) throw Error('Fixture');
    return w.document;
  };
  const item = (d: CampaignDocument, id: string) =>
    bankHolders(work(d))
      .flatMap((h) => h.inventory)
      .find((i) => i.id === id);
  const first = edit({ playerNotes: 'partial' });
  expect(edit({ day: 17 })).toBe(first);
  expect(edit({ playerNotes: 'earned in vault' })).toBe(first);
  expect(edit({ day: 3 }, 'castle-sp')).toBe(first);
  const transfer = storage.mutate(original.id, 1, (d) =>
    bankPost(d, {
      transactionId: 'split',
      sessionId,
      description: 'Move coins',
      kind: 'transfer',
      changes: [
        bankLeg(d, sessionId, holderId, 'ep', -10, itemId),
        bankLeg(d, sessionId, 'inventory-reatha', 'ep', 10, 'split-coins'),
      ],
    })
  );
  const after = edit({ playerNotes: 'edited after transfer' });
  await Promise.all([first, transfer, after]);
  const accepted = h.current().document;
  expect(h.writes).toHaveLength(3);
  expect(item(accepted, itemId)).toMatchObject({
    day: 17,
    quantity: 690,
    playerNotes: 'edited after transfer',
  });
  expect(item(accepted, 'split-coins')).toMatchObject({
    day: 17,
    quantity: 10,
    playerNotes: 'earned in vault',
  });
  expect(item(accepted, 'castle-sp')?.day).toBe(3);
  await edit({ quantity: 680 });
  expect(h.current().document.banking).toEqual(accepted.banking);
  await storage.mutate(original.id, 1, (d) =>
    commitBankReconciliation(
      d,
      sessionId,
      bankReconciliationFingerprint(d, sessionId),
      'reconcile',
      bankingAt
    )
  );
  expect(h.current().document.banking?.entries.at(-1)?.kind).toBe(
    'reconciliation'
  );
  expect(h.current().document.xp).toEqual(original.xp);

  const pending = edit({ day: 18 });
  await storage.mutate(original.id, 1, (d) => {
    const inventory = work(d);
    return changeWorkingInventory(d, workingId, sessionId, {
      ...inventory,
      storageLocations: inventory.storageLocations.map((h) => ({
        ...h,
        inventory: h.inventory.filter((i) => i.id !== itemId),
      })),
    });
  });
  await pending;
  await expect(edit({ day: 19 })).rejects.toThrow('removed');
  expect(item(h.current().document, itemId)).toBeUndefined();
  await storage.discardRejectedEdits();
  await storage.mutate(original.id, 1, (d) =>
    startWorkingInventory(
      d,
      sessionId,
      work(d),
      { kind: 'empty' },
      'replacement',
      'before-restore',
      bankingAt
    )
  );
  await expect(edit({ day: 20 }, 'castle-sp')).rejects.toThrow('changed');
  const recovered = await storage.discardRejectedEdits();
  expect(
    recovered.document?.workingInventories.some((w) => w.id === 'replacement')
  ).toBe(true);
  expect(parseCampaign(serializeCampaign(h.current().document))).toEqual(
    h.current().document
  );
});

test('two native file selections keep their own destinations when the first fails', async () => {
  let send: ((event: { payload: unknown }) => void) | undefined;
  const calls: string[] = [];
  let rejectFirst: (error: Error) => void = () => undefined;
  const first = new Promise<void>((_, reject) => {
    rejectFirst = reject;
  });
  window.__TAURI__ = {
    core: {
      invoke: async <T>(name: string, args?: Record<string, unknown>) => {
        if (name === 'campaign_command') {
          const action = String(args?.['command']);
          calls.push(action);
          if (action === 'openPending:first') await first;
        }
        return undefined as unknown as T;
      },
    },
    event: {
      listen: async <T>(
        name: string,
        handler: (event: { payload: T }) => void
      ) => {
        if (name === 'campaign-action')
          send = handler as (event: { payload: unknown }) => void;
        return () => undefined;
      },
    },
  };
  await createTauriStorage();
  send?.({ payload: 'openPending:first' });
  send?.({ payload: 'openPending:second' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(calls).toEqual(['openPending:first']);
  rejectFirst(new Error('File moved'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(calls.filter((action) => action.startsWith('openPending:'))).toEqual([
    'openPending:first',
    'openPending:second',
  ]);
  expect(calls).toContain('cancelPending:first');
});
