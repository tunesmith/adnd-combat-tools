window.__CAMPAIGN_DIAGNOSTICS__ = true;
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  while (!window.campaignStorage) await sleep(50);
  const storage = window.campaignStorage,
    native = window.__TAURI__;
  const log = (name, count = 1) =>
    native.core.invoke('campaign_diagnostic', { name, ms: 0, count });
  const fault = (kind, value = 0) =>
    native.core.invoke('campaign_diagnostic_fault', { kind, value });
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value'
  ).set;
  const notes = () =>
    document.querySelector(
      'textarea[placeholder="Anything you want to remember when you revisit this round later."]'
    );
  const field = (label) =>
    Array.from(document.querySelectorAll('tfoot tr'))
      .find((r) => r.querySelector('th')?.textContent === label)
      ?.querySelector('textarea');
  const input = (el, value) => {
    if (!el) throw Error('missing field');
    el.focus();
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const type = async (el, text) => {
    for (let i = 1; i <= text.length; i++) {
      input(el, text.slice(0, i));
      await sleep(15);
    }
  };
  const check = (value) => {
    if (!value) throw Error('assertion failed');
  };
  const wait = async (test) => {
    for (let i = 0; i < 250; i++) {
      if (test()) return;
      await sleep(40);
    }
    throw Error('UI wait timed out');
  };
  const state = () => storage.getState();
  let phase = 'start';
  let queue;
  storage.subscribe((next) => {
    queue = next.queue;
  });
  try {
    await wait(() => notes());
    await fault('delay', 500);
    phase = 'fields';
    const typedAt = performance.now();
    await type(field('HP'), '4+2-1');
    await type(field('Outcome'), 'Hit, 3 damage');
    await type(notes(), 'Round note: exact final text.');
    await native.core.invoke('campaign_diagnostic', {
      name: 'three_fields_typed',
      ms: performance.now() - typedAt,
      count: 46,
    });
    // Same listener used by native File > Save and Cmd-S.
    await fault('menu-save');
    await fault('menu-save');
    await wait(() =>
      Array.from(document.querySelectorAll('[role=status]')).some(
        (e) => e.textContent === 'Saved'
      )
    );
    await fault('delay', 0);
    await storage.command('reopen');
    await wait(() => notes());
    check(field('HP').value === '4+2-1');
    check(field('Outcome').value === 'Hit, 3 damage');
    check(notes().value === 'Round note: exact final text.');
    await log('pass_exact_fields_reopen');
    phase = 'during_save';
    input(notes(), 'saved snapshot');
    await fault('save-delay', 900);
    let edited = false;
    const unlisten = await native.event.listen(
      'campaign-state',
      ({ payload }) => {
        if (payload.busy && payload.activity === 'save' && !edited) {
          edited = true;
          input(notes(), 'newer while saving');
        }
      }
    );
    await storage.command('save');
    unlisten();
    await sleep(1000);
    check(notes().value === 'newer while saving');
    check((await state()).dirty);
    await log('during_save_snapshot');
    await storage.command('save');
    await log('pass_during_save');
    phase = 'rejection';
    for (const kind of ['reject', 'timeout']) {
      await fault(kind);
      input(notes(), 'retained after ' + kind);
      let rejected = false;
      try {
        await storage.command('save');
      } catch {
        rejected = true;
      }
      check(rejected);
      await wait(() => document.querySelector('div[role=alert]'));
      check(notes().value === 'retained after ' + kind);
      const retry = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent === 'Retry pending edits'
      );
      check(retry);
      retry.click();
      await wait(() => !document.querySelector('div[role=alert]'));
      await storage.command('save');
      await log('pass_' + kind + '_retry');
    }
    phase = 'save_failure';
    await log('before_disk_failure');
    input(notes(), 'retained after disk failure');
    await fault('save-failure');
    let rejected = false;
    try {
      await storage.command('save');
    } catch {
      rejected = true;
    }
    check(rejected);
    check(notes().value === 'retained after disk failure');
    await wait(() => document.querySelector('div[role=alert]'));
    await log('disk_failure_preserved');
    await storage.command('save');
    await log('pass_disk_failure_retry');
    phase = 'quit_cancel';
    input(notes(), 'quit cancelled input');
    await fault('prompt-cancel');
    const quit = storage.command('quit');
    check(storage.command('quit') === quit);
    await quit;
    check(notes().value === 'quit cancelled input');
    check((await state()).dirty);
    await storage.command('save');
    await log('pass_quit_cancel_save');
    phase = 'save_as';
    input(notes(), 'Save As exact input');
    await fault('save-as');
    await storage.command('saveAs');
    await storage.command('reopen');
    await wait(() => notes());
    check(notes().value === 'Save As exact input');
    await log('pass_save_as_reopen');
    phase = 'navigation';
    input(notes(), 'navigation final');
    Array.from(document.querySelectorAll('button'))
      .find((b) => b.textContent === 'Giant Rats')
      .click();
    await sleep(100);
    Array.from(document.querySelectorAll('button'))
      .find((b) => b.textContent === 'Hobgoblins')
      .click();
    await storage.command('save');
    await storage.command('reopen');
    await wait(() => notes());
    check(notes().value === 'navigation final');
    await log('pass_encounter_navigation');
    phase = 'session_navigation';
    input(notes(), 'session navigation final');
    const navigating = await state(),
      origin = navigating.document.workspace.sessionId;
    const other = navigating.document.sessions.find((s) => s.id !== origin);
    const home = navigating.document.sessions.find((s) => s.id === origin);
    Array.from(document.querySelectorAll('button'))
      .find((b) => b.textContent === other.label)
      .click();
    await sleep(100);
    Array.from(document.querySelectorAll('button'))
      .find((b) => b.textContent === home.label)
      .click();
    await storage.command('save');
    await storage.command('reopen');
    await wait(() => notes());
    check(notes().value === 'session navigation final');
    await log('pass_session_navigation');
    phase = 'conflict';
    await log('await_external_edit');
    await sleep(3000);
    input(notes(), 'unsaved conflict input');
    await fault('prompt-cancel');
    await storage.command('save');
    check(notes().value === 'unsaved conflict input');
    check((await state()).dirty);
    await wait(() => document.querySelector('div[role=alert]'));
    await log('pass_conflict_cancel');
    await fault('prompt-reload');
    await storage.command('save');
    await wait(() => notes());
    check(notes().value === 'external round note');
    await log('pass_conflict_reload');
    await storage.command('reopen');
    await wait(() => notes());
    check(notes().value === 'external round note');
    input(notes(), 'after external reopen');
    await storage.command('save');
    await log('pass_external_reopen_save');
    phase = 'quit_save';
    input(notes(), 'Immediate quit final input');
    await fault('prompt-save');
    await log('before_final_quit');
    await storage.command('quit');
  } catch (e) {
    const body = document.body.textContent;
    await log(
      'failure_flags',
      (body.includes('Injected replacement') ? 1 : 0) +
        (body.includes('needs attention') ? 2 : 0) +
        (queue?.error ? 4 : 0) +
        (queue?.rejected ? 8 : 0) +
        (document.querySelector('div[role=alert]') ? 16 : 0)
    );
    await log(
      'FAIL_' +
        phase +
        '_' +
        (String(e).includes('not allowed')
          ? 'permission'
          : String(e).includes('UI wait')
          ? 'uiwait'
          : 'assertion')
    );
  }
})();
