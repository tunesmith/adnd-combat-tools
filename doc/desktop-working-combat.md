# Editable campaign encounters

For the current import/use, scoped history, and preview workflow, see [Import and history usability](desktop-playtest-usability.md). The verification below records the preceding combat integration slice.

This slice adds working combats to the existing Tauri campaign workspace. It reuses the combat tracker alongside the completed Possessions editor. Explicit cross-session carry-forward, multi-session continuity validation, and XP remain future work.

## Build and launch

```sh
npm ci
npm run desktop:build
npm run desktop:run
```

Use the existing Node 20/22, Rust/Cargo, and Xcode command-line prerequisites. If Rust is managed by Homebrew rustup, `/opt/homebrew/opt/rustup/bin` must be on PATH. The double-clickable Apple Silicon app is `src-tauri/target/release/bundle/macos/AD&D Tools.app`. It uses bundled assets; no npm command or development server is needed to run that app afterward. Quit an older running copy before rebuilding or launching the new bundle.

## Try it

1. Open a campaign and select a session. Choose Possessions or Combats.
2. In Combats, use the clickable encounter tabs to select a fight, or New encounter to create one. Version selects Current, an import, or a checkpoint. Both editors use the same Version / … toolbar below their content. New encounter is on the right above the combat editor.
3. Use … → Capture checkpoint to name a version in a small dialog. Historical versions replace the content in the same area; Return to current brings back current work. … → Restore this version preserves current work before replacement. Combat history also offers creating a distinct new encounter.
4. Use Campaign Details → Import… for imports and provenance management. The old History & imports tab and lower history panels have been removed. Older saved history-view navigation opens Campaign Details; no document migration is needed.
5. Save with Command-S, fully quit, relaunch and Reopen last. Shortcuts Command-Option-1/2 select Possessions/Combats; 3 selects Details, with 4 retained as a Details alias. Text-entry focus still pauses navigation shortcuts.

Historical previews cannot write editor changes to the campaign. Inventory history keeps the normal character tabs, All Characters, and sorting available; these navigation choices are local. Combat history has a local round selector. Save intention accepts staged changes in the tracker’s intention dialog; Campaign Save writes the document.

## Document ownership and migration

V4 adds `workingCombats`, `combatCheckpoints`, and `workspace.combatSelections` (session ID → encounter ID). Each working combat stores a stable encounter ID, owning session, title, full normalized tracker state, origin reference, and editor generation. Multiple combats may belong to one session. A new session starts without combats; nothing is copied or matched automatically.

The full tracker state is retained: all round rosters and labels, active round, initiatives, HP, effects, notes, intentions/actions/results, declared actions and target references, matchup cells and visibility, and supported creature/calculation fields. UI-only details such as open dialogs, graph inspector selection, and unaccepted modal drafts are not persisted.

V1–V3 documents migrate in memory. Existing fields, IDs, B1 records/revisions/original sources/hashes/metadata, working inventories, inventory checkpoints, and session associations remain intact. Opening does not rewrite the original. Save writes V4 with the previous bytes in `.bak`; older apps reject V4 rather than losing its new fields.

The tracker accepts campaign state and change callbacks and uses its existing reducer for every accepted edit. The standalone hook remains the owner only in web mode. Campaign mode bypasses URL encoding/rewriting, browser local/session drafts, recovery prompts, standalone import, and standalone New Combat replacement. The embedded roster modal has its own portal root, separate from inventory. Hidden views do not receive tracker keyboard actions. Switching encounters remounts transient editor controls while retaining campaign-owned data.

The workspace and native adapter use the existing queued functional mutations, load epochs, optimistic echoes, and rejected-edit recovery. Save, Quit, and Finder Open wait for queued combat edits. A restore increments the editor generation, so delayed callbacks from the former version are rejected even though encounter identity is unchanged. A failed mutation blocks later queued edits and saves until accepted state is restored; navigation cannot accidentally clear the failure and report lost work as saved.

Native validation preserves immutable imports/checkpoints, prohibits encounter removal or session reassignment in this slice, and requires a checkpoint before a generation change. The shared tracker removal helper now removes an absent actor’s declarations and reindexes surviving action targets/cells in the active round; earlier rounds stay unchanged.

## Verification

All examples and test data are synthetic. Packaged-app checks and automated checks are distinguished below.

- Packaged app: opened a V3 campaign with existing inventory and B1 evidence; Save produced V4 and an exact V3 backup. Created an encounter from imported history and an independent empty encounter, then added roster members through the tracker.
- Packaged app: edited HP, effects, notes, intention/results, and round notes; captured “Before reinforcements” at HP 14; advanced the first encounter to three rounds and edited current HP to 9. Switched encounters and Possessions, edited nested-item quantity to 8 and its DM note, and saved.
- Packaged app: saved immediately from round-note and roster Max HP fields. Fully quit, confirmed no running app instance, relaunched, and reopened. Both encounters, the roster name/Max HP, all rounds, inventory quantity/notes/container links, and selection survived. History showed checkpoint HP 14 and original imported unknown HP independently of working HP 9. Original evidence compared equal to the fixture.
- Packaged app: cancelled restore; cancelled unsaved Quit; a read-only synthetic directory made Save during Quit fail while leaving the file byte-identical and the app open. An external edit triggered conflict detection; Save As retained local combat and inventory edits without changing the external version.
- Packaged app: selected an independent empty second session and returned without carrying or losing encounters. Restored the first encounter from its earlier checkpoint, verified the same ID and increased generation on disk, inspected the automatically preserved three-round state, then restored that state again. Existing imports and the original checkpoint stayed byte-for-byte equivalent as JSON values.
- Web: the GitHub Pages export loaded under `/adnd-combat-tools` in real Chrome. Tracker URL import, round advance, URL rewriting, browser draft persistence, and return to the edited prior round worked. Encumbrance loaded standalone DM JSON through its file input and retained a quantity edit after closing/reopening the item dialog. Neither web page had a native bridge; no application console errors were observed.
- Automated: full-state serialization, V1/V2/V3 migration, immutable checkpoint preservation, same-ID restore with generation invalidation, session ownership rejection, stale load epochs, rejected mutation blocking, and Save/Quit/Finder Open waiting for combat mutations. Controlled tracker tests exercise declarations, round creation, immediate roster edits, and absence of URL/browser draft writes. Workspace tests switch two encounters and Possessions without cross-applying edits. Native tests cover round-trip, previous-version backups, restoration protection, immutable history, failed writes, and conflicts.

Checks passed: `npm run tsc`, `npm test -- --runInBand` (116 suites, 764 tests), `npm run format`, `npm run format:check`, `npm run lint`, `npm run desktop:test` (12 Rust tests), Rust formatting, `git diff --check`, `npm run desktop:build`, and `npm run build`. ESLint reports only the pre-existing unused-export warning in `src/types/util.ts`; the builds retain the existing Browserslist database notice.

The saved native example is `/private/tmp/adnd-combat-fixtures/Combat workspace retained.adnd`. It is disposable synthetic data; use Save As elsewhere to keep a copy.

## Remaining limits

- No XP, encounter completion inference, automatic character matching, HP/inventory synchronization, or cross-session carry-forward. The next slice must validate the explicit multi-session continuity workflow.
- One open campaign at a time. Saves are explicit; full quit/reopen is not crash autosave. Use the existing native conflict workflow rather than concurrent writers.
- Campaign working-combat share/export is not exposed in this slice. B1 original-source export remains under import/provenance management. Standalone web sharing/export and local drafts remain available in the separate web tool.
- The existing limits remain: 1 MB per tracker/inventory payload, 8 MB per campaign, bounded archive collections. Very large archives may incur validation latency. Power-loss durability, cloud filesystem coordination, and the pre-existing narrow external-write race are not claimed solved.
- The app is locally built for Apple Silicon, without developer signing/notarization or an updater. No deployment, push, release, or publication was performed. Private campaign files, Dropbox, TOOFRepo, live TOOF data, and unrelated `output/` were left unchanged.

## Unified version controls

The B1 field-tree browser, raw source/payload viewers, separate combat summary renderer, two-column history panels, and standalone History & imports workspace tab have been removed. Stored sources remain available through explicit export in Campaign Details → Import…. Both tools share VersionToolbar, including checkpoint naming and restore confirmation dialogs. The main editor position remains stable when switching between current and historical versions.

Verification includes packaged-app combat and inventory version selection, read-only previews, return to current, and cancelling checkpoint naming. Automated tests cover preview isolation, queued mutations, and deliberate checkpoint/restore actions. The shared persistence model and native protections are unchanged.

Historical inventory navigation is implemented inside EncumbranceApp: read-only mode rejects document mutations while allowing local character selection, All Characters, and sorting. Edit/add/export controls are disabled or omitted. The standalone editor and current campaign editor retain their behavior.
