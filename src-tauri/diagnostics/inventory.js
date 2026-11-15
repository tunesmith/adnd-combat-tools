window.__CAMPAIGN_DIAGNOSTICS__ = true;
(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  while (!window.campaignStorage) await sleep(40);
  const store = window.campaignStorage,
    invoke = window.__TAURI__.core.invoke;
  const log = (name, ms = 0, count = 1) =>
    invoke('campaign_diagnostic', { name, ms, count });
  const check = (value) => {
    if (!value) throw Error('Unexpected inventory state');
  };
  const wait = async (predicate) => {
    for (let i = 0; i < 500; i++) {
      if (predicate()) return;
      await sleep(25);
    }
    throw Error('UI wait timed out');
  };
  const field = (name) =>
    Array.from(document.querySelectorAll('[role=dialog] label'))
      .find((e) => e.querySelector('span')?.textContent.trim() === name)
      ?.querySelector('input,textarea');
  const edit = async (item) => {
    const button = () =>
      Array.from(document.querySelectorAll('[aria-label^="Edit "]')).find(
        (e) => e.getAttribute('aria-label') === 'Edit ' + item.name
      );
    await wait(button);
    button().click();
    await wait(() => field('Player Notes'));
  };
  const close = () =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
  const input = (label, value) => {
    const el = field(label);
    el.focus();
    Object.getOwnPropertyDescriptor(
      el instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : HTMLTextAreaElement.prototype,
      'value'
    ).set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    check(el.value === value);
  };
  const latencies = [];
  const type = async (label, value) => {
    for (let i = 1; i <= value.length; i++) {
      const start = performance.now();
      input(label, value.slice(0, i));
      const elapsed = performance.now() - start;
      latencies.push(elapsed);
      // Yield through IPC so background WebKit timer throttling cannot slow
      // the simulated typing to one character per second.
      await log('inventory_input_to_dom', elapsed);
    }
  };
  let phase = 'start',
    queue,
    peak = 0;
  let domainMs = 0,
    domainCalls = 0;
  const mutate = store.mutate;
  store.mutate = (id, epoch, change, ...rest) =>
    mutate(
      id,
      epoch,
      (doc) => {
        const start = performance.now();
        try {
          return change(doc);
        } finally {
          domainMs += performance.now() - start;
          domainCalls++;
        }
      },
      ...rest
    );
  store.subscribe((s) => {
    queue = s.queue;
    peak = Math.max(peak, queue?.queued ?? 0);
  });
  try {
    const state = await store.getState(),
      sid = state.document.workspace.sessionId;
    const work = (d) => d.workingInventories.find((w) => w.sessionId === sid);
    const holder = work(state.document).document.storageLocations.find(
      (h) => h.id === work(state.document).document.activeCharacterId
    );
    const [first, second] = holder.inventory.filter(
      (i) => i.catalogId.startsWith('coin-') && i.name
    );
    const current = (d, id) =>
      work(d)
        .document.storageLocations.find((h) => h.id === holder.id)
        .inventory.find((i) => i.id === id);
    phase = 'no_save';
    await edit(first);
    await type('Player Notes', 'no save');
    let start = performance.now();
    await wait(() => queue?.queued === 0);
    await log('inventory_drain', performance.now() - start);
    phase = 'save';
    const typing = performance.now();
    await type('Player Notes', 'first source');
    await type('Day', '123');
    close();
    await edit(second);
    await type('Player Notes', 'second lot');
    await log(
      'inventory_mean_input_to_dom',
      latencies.reduce((a, b) => a + b, 0) / latencies.length,
      latencies.length
    );
    await log('inventory_typing', performance.now() - typing, peak);
    start = performance.now();
    await store.command('save');
    await log('inventory_save', performance.now() - start);
    await store.command('reopen');
    const reopened = (await store.getState()).document;
    check(
      current(reopened, first.id).day === 123 &&
        current(reopened, first.id).playerNotes === 'first source' &&
        current(reopened, second.id).playerNotes === 'second lot'
    );
    await log('inventory_domain_work', domainMs, domainCalls);
    await log('pass_inventory_exact');
    if (window.inventoryValidation) {
      const fault = (kind, value = 0) =>
        invoke('campaign_diagnostic_fault', { kind, value });
      const button = (label) =>
        Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent.trim() === label
        );
      const note = () => field('Player Notes');
      const rejected = async (command) => {
        try {
          await command();
        } catch {
          return true;
        }
        return false;
      };
      const savedValue = async () =>
        current((await store.getState()).document, first.id).playerNotes;
      phase = 'delayed';
      await edit(first);
      await fault('delay', 500);
      peak = 0;
      await type('Player Notes', 'delayed source note');
      note().setSelectionRange(4, 4);
      await fault('menu-save');
      await fault('menu-save');
      await wait(() => queue?.queued === 0);
      check(
        peak <= 4 &&
          note().selectionStart === 4 &&
          document.activeElement === note()
      );
      check((await savedValue()) === 'delayed source note');
      await fault('delay', 0);
      await log('pass_inventory_menu_save');
      phase = 'export';
      const el = note();
      el.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true })
      );
      input('Player Notes', 'export partial');
      const exported = store.exportWorking(
        state.document.id,
        (await store.getState()).epoch,
        work(state.document).id
      );
      input('Player Notes', 'export final 確定');
      el.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true })
      );
      check(await exported);
      await log('inventory_check_export');
      await log('pass_inventory_ime_export');
      phase = 'during_save';
      input('Player Notes', 'saving snapshot');
      await fault('save-delay', 600);
      let changed = false;
      const unsubscribe = await window.__TAURI__.event.listen(
        'campaign-state',
        ({ payload }) => {
          if (payload.busy && payload.activity === 'save' && !changed) {
            changed = true;
            input('Player Notes', 'typed during save');
          }
        }
      );
      const saving = store.command('save');
      check(store.command('save') === saving);
      await saving;
      unsubscribe();
      await log('inventory_during_save');
      await wait(() => queue?.queued === 0);
      check(
        changed &&
          (await store.getState()).dirty &&
          (await savedValue()) === 'typed during save'
      );
      await log('pass_inventory_during_save');
      phase = 'retry';
      for (const kind of ['reject', 'timeout']) {
        await fault(kind);
        input('Player Notes', kind + ' retained');
        check(await rejected(() => store.command('save')));
        check(note().value === kind + ' retained');
        await wait(() => button('Retry pending edits'));
        button('Retry pending edits').click();
        await wait(() => !document.querySelector('div[role=alert]'));
        await store.command('save');
        check((await savedValue()) === kind + ' retained');
        await log('pass_inventory_' + kind);
      }
      phase = 'discard';
      await fault('reject');
      input('Player Notes', 'discard me');
      check(await rejected(() => store.command('save')));
      button('Discard rejected edits').click();
      await wait(() => !note() && !document.querySelector('div[role=alert]'));
      await edit(first);
      check(note().value === 'timeout retained');
      await log('pass_inventory_discard');
      phase = 'disk_failure';
      await log('before_disk_failure');
      input('Player Notes', 'disk retry');
      await fault('save-failure');
      check(await rejected(() => store.command('save')));
      await log('disk_failure_preserved');
      check(note().value === 'disk retry');
      await store.command('save');
      await log('pass_inventory_disk_failure');
      phase = 'switch_holder';
      input('Player Notes', 'before switching');
      close();
      const other = work(state.document).document.characters.find((h) =>
        h.inventory.some((i) => i.name)
      );
      button(other.name).click();
      const editCharacter = () =>
        document.querySelector(
          'button[aria-label="Edit ' + CSS.escape(other.name) + '"]'
        );
      await wait(editCharacter);
      editCharacter().click();
      await wait(() => field('DM Notes'));
      input('DM Notes', 'character notes test');
      close();
      const otherItem = other.inventory.find((i) => i.name);
      await edit(otherItem);
      input('Day', '17');
      close();
      button('Session').click();
      button('Possessions').click();
      button(holder.name).click();
      await store.command('save');
      const switched = (await store.getState()).document;
      check(current(switched, first.id).playerNotes === 'before switching');
      check(
        work(switched)
          .document.characters.find((h) => h.id === other.id)
          .inventory.find((i) => i.id === otherItem.id).day === 17
      );
      check(
        work(switched).document.characters.find((h) => h.id === other.id)
          .dmNotes === 'character notes test'
      );
      const originalSession = switched.sessions.find((s) => s.id === sid),
        earlier = switched.sessions.find((s) => s.id !== sid);
      await edit(first);
      input('Player Notes', 'before navigation');
      close();
      const version = document.querySelector(
        'section[aria-label="Possessions"] select'
      );
      if (version && version.options.length > 1) {
        version.value = version.options[1].value;
        version.dispatchEvent(new Event('change', { bubbles: true }));
        await wait(() =>
          document.querySelector('[aria-label="Historical inventory"]')
        );
        version.value = '';
        version.dispatchEvent(new Event('change', { bubbles: true }));
      }
      button(earlier.label).click();
      button(originalSession.label).click();
      await store.command('save');
      check((await savedValue()) === 'before navigation');
      await log('pass_inventory_navigation');
      phase = 'quit_cancel';
      await edit(first);
      input('Player Notes', 'cancel quit');
      await fault('prompt-cancel');
      const quit = store.command('quit');
      check(store.command('quit') === quit);
      await quit;
      check((await store.getState()).dirty);
      await log('pass_inventory_quit_cancel');
      phase = 'close_reopen';
      input('Player Notes', 'final input before Close');
      await fault('prompt-save');
      await store.command('close');
      check(!(await store.getState()).document);
      await store.command('reopen');
      await edit(first);
      check(note().value === 'final input before Close');
      await log('pass_inventory_close_reopen');
      phase = 'save_as';
      input('Player Notes', 'save as final');
      await fault('save-as');
      await store.command('saveAs');
      await store.command('reopen');
      await edit(first);
      check(note().value === 'save as final');
      await log('pass_inventory_save_as');
      phase = 'conflict';
      await log('inventory_external_edit');
      await sleep(1500);
      input('Player Notes', 'conflict draft');
      await fault('prompt-cancel');
      await store.command('save');
      check(
        (await store.getState()).dirty && note().value === 'conflict draft'
      );
      await log('pass_conflict_cancel');
      await fault('prompt-reload');
      await store.command('save');
      await edit(first);
      check(note().value === 'save as final');
      await log('pass_inventory_conflict_reload');
      phase = 'quit_save';
      input('Player Notes', 'quit final');
      await fault('prompt-save');
    }
    await store.command('quit');
  } catch {
    await log('FAIL_inventory_' + phase);
  }
})();
