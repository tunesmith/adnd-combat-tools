window.__CAMPAIGN_DIAGNOSTICS__ = true;
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  while (!window.__TAURI__?.core || !window.campaignStorage) await sleep(50);
  const invoke = window.__TAURI__.core.invoke;
  const log = (name, ms, count = 0) =>
    invoke('campaign_diagnostic', { name, ms, count });
  try {
    let notes;
    while (
      !(notes = document.querySelector(
        'textarea[placeholder="Anything you want to remember when you revisit this round later."]'
      ))
    )
      await sleep(100);
    const initial = await window.campaignStorage.getState();
    const started = performance.now();
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value'
    ).set;
    notes.focus();
    const text = 'Native typed!';
    for (let i = 1; i <= text.length; i++) {
      setter.call(notes, text.slice(0, i));
      notes.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(25);
    }
    await log('typing_done', performance.now() - started, text.length);
    const save = performance.now();
    await window.campaignStorage.command('save');
    let current = await window.campaignStorage.getState();
    while (current.saveCount === initial.saveCount) {
      await sleep(100);
      current = await window.campaignStorage.getState();
    }
    await log('save_complete', performance.now() - save, current.saveCount);
    const combat = current.document.workingCombats.find(
      (c) => c.title === 'Hobgoblins'
    );
    await log(
      'exact_text',
      0,
      Number(combat.state.rounds[combat.state.activeRound].summary === text)
    );
    await window.campaignStorage.command('quit');
  } catch (e) {
    await log('harness_failed', 0, 1);
  }
})();
