# Desktop combat editing and document-command backlog

## Measured cause

Measured on the packaged macOS Tauri app, with a disposable copy of SOCK including
Day4 Hobgoblins and historical records (original file: 925,420 bytes; replacement
IPC payload approximately 527 KB). The live file and live app process were left
alone. Measurements below are individual representative runs, not broad benchmarks.

The original renderer enqueued one full replacement for every input change. Each
native replacement parsed/validated the new campaign, then ran a second boundary
that parsed/validated both the same new campaign and the already accepted old
campaign before checking history. Native Save validated the accepted document
again. QuickJS work dominated; session-lock wait was effectively zero. Thirteen
characters created thirteen completed replacements, without a feedback loop.

| Same 13-character round-note edit, immediate Save |    Before |    After |
| ------------------------------------------------- | --------: | -------: |
| Native replacements                               |        13 |        2 |
| Median native replacement                         |  1,804 ms |   643 ms |
| Total native replacement time                     | 23,512 ms | 1,285 ms |
| Save request to completion                        | 24,024 ms | 1,152 ms |
| Native save work                                  |    690 ms |    21 ms |

Timing logs contain operation names, sizes, counts, and elapsed times, not campaign
text. Review artifacts are under `output/desktop-backlog/`. Native validation
remains bounded at 15 seconds per QuickJS invocation. The remaining approximately
0.6-second replacement cost is full validation of the new campaign; typing no
longer creates one such operation per intermediate character.

Two separate reliability issues were present: menu-action errors were swallowed,
and a rejected edit latched an error that silently blocked subsequent Save/Quit.
Native command IPC also returned before the command itself completed, permitting
redundant command threads and hiding completion/failure from the renderer.

## Change

Combat snapshots remain immediately visible in the tracker. Storage batches adjacent
replaceable snapshots for 180 ms and coalesces trailing snapshots while native
acceptance is in flight. The key includes document identity, epoch, session,
encounter, and generation. A discrete operation seals the preceding batch; every
snapshot rebases on accepted state and changes only its owned encounter.
Banking, XP, import/restore, creation/removal, and navigation retain their order.

Save, Save As, Quit, close, reopen, and open seal the latest batch and occupy a
position in the same queue. Repeated identical commands share their promise.
Different commands requested while another is active report a visible wait/error
instead of stacking dialogs. Commands wait for IME composition's final input;
there is no blur-dependent field draft. Edits made after a Save request remain
behind its saved snapshot and dirty until the next Save. Native command IPC now
settles only when the command and its dialogs complete.

Each new replacement still receives full schema, normalization, financial/XP,
reference, and history validation. The old document comes from the accepted native
Session, so it is decoded without redundant validation. Native immutable-history
checks remain. Save serializes and atomically persists only the Session's accepted
document, retaining size limits, backup behavior, and both external-revision checks.
Untrusted opens/imports retain full validation.

The status distinguishes Editing, Waiting for edits, Saving, and needs attention.
Rejected input stays visible. **Retry pending edits** replays retained operations
in order against accepted state; **Discard rejected edits** explicitly restores
accepted state. A failed Save can be retried without discarding the draft. Native
state notifications update status without replacing newer optimistic or rejected
input. QuickJS timeouts reject normally and settle the queue; no timeout race can
claim a write was cancelled while it continues invisibly.

## Validation

The packaged-app harness drove real React input events for HP `4+2-1`, an outcome,
and round notes, then the native menu-action listener and native document commands.
It verified exact reopened text, 500 ms injected acceptance delays, repeated Save
and Quit, input during a 900 ms delayed save, rejected replacement, a real 1 ms
QuickJS execution-limit failure, a pre-persist disk failure, Retry, Quit/Cancel then
Save, Save As/reopen, encounter/session navigation, external-conflict Cancel/Reload,
a genuine reopen after an external edit, and immediate Quit with Save.

Twelve native scenario checks passed. Host checks verified the earlier saved
snapshot during concurrent typing, unchanged bytes after disk failure/conflict
Cancel, exact text after final Quit, unchanged other encounters, financial/XP
history and source records, and an unchanged live source-file hash. Native picker
and prompt **answers** were injected only in the diagnostic build; the actual
Session command, validation, locking, and atomic filesystem paths executed.
The normal menu accelerator wiring is unchanged.

Focused tests also interleave coalesced combat edits with real banking and XP
confirmation helpers, validate delayed/stale callbacks and IME completion, and
exercise visible recovery through DesktopWorkspace. Native tests cover immutable
history and trusted-save conflict checks in addition to the existing banking/XP
and disk-safety suites.

Run the native harness independently:

```sh
npm run desktop:build -- --features diagnostic-harness
python3 scripts/desktopBacklogHarness.py --campaign /path/to/SOCK.adnd --mode timing
python3 scripts/desktopBacklogHarness.py --campaign /path/to/SOCK.adnd
```

The harness creates a private temporary directory, selects Hobgoblins only in the
copy, retains artifacts for inspection, and has a 120-second process deadline.
`ADND_DIAGNOSTICS=1` enables bounded native timing output. Renderer timing is also
opt-in. Script injection and fault/prompt/picker controls require the explicit
`diagnostic-harness` feature. Build normally afterward:

```sh
npm run desktop:build
```

The delivered normal bundle is
`src-tauri/target/release/bundle/macos/AD&D Campaign.app`.

Final checks passed: 164 Jest suites / 1,061 tests, 31 native tests, TypeScript,
Prettier (write and check), lint, and the normal desktop build. Lint retains the
pre-existing unused-export warning in `src/types/util.ts`. The first diagnostic
run changed the recent-file shortcut; it was restored to the live SOCK path.
Subsequent harness runs bypass recent-file persistence.
