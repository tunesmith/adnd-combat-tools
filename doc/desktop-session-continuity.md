# C1: Start next session and session notes

C1 adds explicit session continuation to the existing Tauri workspace. It stops before Party Reference, saving throws, effective levels, XP, or any private historical-session import. The public tracker and encumbrance tools retain their standalone behavior.

## Hands-on workflow

1. Select the source session. Use **Session notes** for stopping points and reminders.
2. Choose **+ Session**, enter a name, and check any current inventory, encounters, or notes to carry. Every transfer starts unchecked. The footer summarizes your choices.
3. Choose **Create session**. An empty selection creates an empty session. Selected transfers preserve source checkpoints and open the new session in Session notes.
4. Double-click a session or encounter name, or focus it and press F2, to rename it. Enter saves and Escape cancels. **+ Encounter** creates an Untitled encounter and opens its name for editing.
5. Save with Command-S or File → Save. You can inspect the source session's **Before continuing to …** checkpoints through Version.

Command-Option-5 opens Session notes. Historical versions show **Historical · read only** above the editor.

## Schema and identity choices

Campaign V5 adds session notes and continuation provenance. V1–V4 open through an in-memory migration: every existing campaign/session/record/revision/working/checkpoint ID and source remains intact. Session notes initialize empty. Every old combat's logical `encounterId` initializes to its existing working `id`, and status becomes Unspecified. Nothing is inferred from titles, enemy rosters, HP or round count. Opening does not rewrite disk bytes; Save upgrades the file and preserves its previous bytes in `.bak`. Older apps reject V5.

- A combat `id` remains a unique **working instance** in one owning session. Its `encounterId` is the **logical fight** shared by explicit continuations. Source instances are never moved or reassigned. Each session may have one instance of a given logical encounter; duplicate titles do not merge identities.
- A new continuing instance has a fresh instance ID and editor generation, an independent deep copy of the full tracker payload, the same logical encounter ID and the source session's DM status. `continuedFrom` identifies the source session, source instance and frozen source checkpoint. Status is session-specific: finishing it later does not rewrite a prior session's In progress status.
- Carried inventory has a fresh working ID and independent document, with stable character/item/container IDs and explicit source/checkpoint provenance. No combat/inventory matching or HP synchronization is introduced.
- Session continuation provenance records the selected source IDs, inventory choice, notes choice and confirmation fingerprint. The operation uses a stable destination ID; repeated confirmation returns the existing result without overwriting it or creating another session.

Source-session working state, notes, encounter selection and existing histories remain unchanged during continuation. The UI keeps per-instance historical Version selections when switching sessions/views. Earlier-session versions shown in Version identify their origin session. Stored source-record revision selections remain unchanged. Transient browsing details such as historical preview round/character, Version browsing after a complete app restart, open dialogs and sort toggles remain UI state; the working active round, active inventory character and selected session/encounter are persisted.

A review fingerprint covers the source session, all source working instances, source encounter selection and campaign source records. Stale edits/evidence selections or a switched campaign fail without a partial transfer. A failed native mutation retains the review and reports an error; recover rejected edits through the existing workspace recovery action, then cancel/review fresh choices as needed.

The native shared validator checks source fingerprints, immutable lineage, requested notes, exact initial copies and source checkpoints. It rejects reassignment, forged logical identities, missing/partial transfers, unintended initial HP/round changes and continuation into an existing destination. Existing source/checkpoint immutability, archive limits, queued Save/Quit/Finder Open, atomic saves, backups, external conflicts and unsaved-quit protections remain in force. Later edits in an existing session remain allowed; they affect that session's instance only.

## Verification

All data is synthetic. No TOOF.adnd/backup, private source, Dropbox or TOOFRepo was opened or modified.

### Packaged app

The production code was packaged temporarily as **AD&D Tools C1 Playtest** (`local.adnd.tools.c1playtest`) to isolate its running window and recent-file state. This testing identity is not a new multi-campaign feature. The delivered normal bundle remains **AD&D Tools.app** (`local.adnd.tools`).

The original C1 packaged walkthrough, before the controls were simplified, used `/private/tmp/adnd-c1-synthetic/Synthetic V4.adnd`:

- Opened actual V4 bytes containing inventory and four working encounters. The visible status was Unspecified and the file remained byte-identical on disk until explicit Save.
- Marked one Finished, one In progress and one Prepared; left the fourth Unspecified. Entered multiline source-session notes. The continuation checklist suggested only the In progress fight. Inventory was independently deselected in a cancelled review; cancellation created nothing.
- Started Synthetic Second with that fight, inventory, and an explicitly checked notes copy. Only one new combat instance appeared. Its logical ID matched the source while its instance ID differed. Full round payloads and HP 14 matched exactly, with no round advancement. The first Save created V5 and an exact original V4 backup.
- Edited second-session notes, changed its HP to 3 and its nested item quantity to 9. The source retained HP 14, quantity 2 and its original notes. Source checkpoints and imported record evidence remained equal to their earlier values. The item still belonged to Mira and remained in Inner case.
- Made the synthetic folder unwritable, edited notes and attempted Save. Permission-denied feedback remained visible, the edit stayed in memory and the saved file stayed byte-identical. Restoring permission allowed Save to succeed.
- Fully quit and verified the isolated app was no longer running. Relaunched and reopened: Synthetic Second, multiline notes (including the recovered edit), In progress status, active Moonrise round, HP 3, quantity 9 and nested storage were present. The saved document retained two sessions, five combat instances (four source plus one continuation), two inventories and the two source checkpoints. No Finished/Prepared/Unspecified encounter was implicitly continued.

### Automated and public web

Synthetic model and UI tests cover V1–V4 migration/defaults, duplicate encounter titles, independent transfer choices, copied versus blank notes, missing inventory, exact payload cloning, logical/instance identity, immutable source history, idempotent confirmation, stale source/evidence, switched campaigns, existing destinations, malformed transfers, Cancel, repeated clicks and retained historical selections across sessions. Workspace tests exercise explicit transfers, empty session creation, and inline renaming.

Actual Rust/QuickJS boundary tests accept a complete continuation, reject altered initial rounds/missing checkpoints, preserve an exact V4 backup, round-trip edited session-two state and prove failed saves leave disk bytes intact. The existing import/ownership/conflict/backup tests remain included.

The GitHub Pages export built and was served locally under `/adnd-combat-tools` in real Chrome. Standalone tracker notes, round advancement, share URL rewriting and browser drafts worked with no native bridge. The inventory File workflow loaded synthetic DM JSON and retained quantity 7 after closing/reopening the item dialog. Tracker console output contained only the existing root favicon 404; the inventory page reported no console errors.

Required checks: `npm run tsc`, `npm test -- --runInBand`, `npm run format`, `npm run lint`, native tests, Rust formatting, `git diff --check`, `npm run desktop:build` and `npm run build`. Final totals: 122 Jest suites / 792 tests and 14 Rust tests. ESLint retains the existing unused-export warning in `src/types/util.ts`; builds retain the Browserslist database notice.

## Build and remaining limits

```sh
npm run desktop:build
npm run desktop:run
npm run build
```

The normal double-clickable Apple Silicon bundle is `src-tauri/target/release/bundle/macos/AD&D Tools.app`. Save/quit an older normal app before opening the rebuilt bundle.

- C1 creates an explicit continuation from the chosen source. It does not synchronize later corrections across sessions, enforce chronological labels, merge encounter branches or rest/replenish resources.
- Source work remains editable for deliberate corrections; destination edits never propagate backward. Checkpoints retain their captured payloads/status. Restoring tracker payload history does not infer a new DM status.
- Saves remain explicit. Crash autosave, multiple campaign windows, cloud coordination and stronger filesystem durability remain outside this slice. Existing size/archive limits still apply.
- C2 Party Reference, saving throws, effective levels, XP, separate session dates and Session 92 imports are deferred.
- No deployment, push or release was performed. Unrelated `output/` is preserved.
