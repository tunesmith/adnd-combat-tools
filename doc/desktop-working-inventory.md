# Campaign workspace and working possessions

For the subsequent editable-combat slice and V4 migration, see [Editable campaign encounters](desktop-working-combat.md). The implementation and verification below describe the completed V3 inventory slice.

This delivers the workspace/inventory slice of integrated session play. Possessions are edited directly in the campaign using the existing encumbrance editor. Combats remain read-only captured records. Combat editing, explicit session carry-forward, multi-session continuity validation, and XP settlement are future slices.

## Build and launch

```sh
npm ci
npm run desktop:build
npm run desktop:run
npm run desktop:test
npm run build
```

Use the existing Node/Rust/Xcode prerequisites. The built Apple Silicon app is `src-tauri/target/release/bundle/macos/AD&D Tools.app`. It runs from bundled assets without a development server. Quit older instances before rebuilding; replace an older Applications copy if you installed one there.

## Hands-on workflow

1. Open a campaign and select a session in the compact session strip. **Sessions…** adds or renames sessions.
2. Choose **Possessions**. Select an imported inventory revision and **Use as working inventory**, or choose **Create empty working inventory**.
3. Use the existing item editor to change quantities, **Held by**, **Stored in**, and notes. Its live edits update campaign-owned working state. Close the item dialog with Escape or its normal outside-click behavior.
4. Switch to **Combats**, **History & imports**, or **Campaign Details**, then return. Working edits and the editor's current selection remain available. Command-Option-1 through 4 navigate those views; shortcuts are ignored while typing or composing text.
5. Optionally expand **Capture checkpoint…**, enter a name, and capture a historical version. Ordinary edits and saves do not create visible revisions.
6. Use native **File → Save / Save As** or Command-S. Wait for successful-save feedback, quit completely, relaunch, and **Reopen last**.
7. Use **History & imports** to inspect original imported evidence and named checkpoints. **Use as working inventory** deliberately starts a new working copy; existing work is first preserved in an automatic “Before replacing working inventory” checkpoint.

**Campaign Details** contains the campaign title and campaign-wide notes. Import/provenance/B1 revision controls are under **Import, provenance & revision management** in History. Timestamps are displayed in local, human-readable form and describe capture/import time, not play time.

**Export standalone DM JSON…** writes a separate copy of the selected working inventory. It neither saves the campaign nor changes its save path. The campaign editor does not expose standalone New/Load/Save or player-merge commands that could silently replace working state. The standalone web editor retains its File workflow.

## Ownership and migration

Schema V3 adds:

- `workingInventories`: stable working ID, owning session ID, title, normalized DM inventory document, and an origin reference to an import, checkpoint, or empty creation.
- `inventoryCheckpoints`: stable checkpoint/working/session IDs, a name, capture timestamp, and an independent frozen inventory document.
- `workspace`: selected session and view, persisted with Campaign Save.

There is one current working inventory per session. A new session starts with no working inventory; nothing is automatically carried forward. Starting an empty inventory or copying history is explicit. Inventory and character/item IDs are preserved when copying a historical payload. No cross-tool matching by character name or implicit inventory/combat synchronization is introduced.

V1/V2 files open with new working/checkpoint collections empty and all existing IDs, title/notes, sessions, records, revisions, original sources, fingerprints, and metadata retained. Opening does not rewrite the file. Save upgrades to V3 and preserves the previous file bytes in `.bak`. Older app versions cannot edit a V3 document safely and reject it.

Imported B1 evidence remains immutable. Checkpoints are also immutable; the native update boundary rejects edits/removals of them. Replacing a working inventory requires a checkpoint containing the work being replaced. The normal historical inspector is read-only and does not rewrite the selected imported revision.

## Editor and persistence design

`EncumbranceApp` now accepts a campaign-controlled document, change callback, and export callback. Its existing item/container/transfer/domain logic is shared. Its standalone wrapper retains internal document state and browser file handling. Live character/item handlers now invoke changes from events instead of inside React state updaters; this also fixes the old standalone character-rename fallback behavior.

The workspace owns an optimistic draft while the native campaign owns accepted persistent state. Mutations are queued and rebased on the latest accepted document; Save, Quit, and Finder Open wait for them. Native campaign-load epochs and working IDs prevent delayed callbacks from applying to a different campaign or replaced working inventory. Old native echoes do not overwrite newer local edits. Rejected changes cannot be reported as saved; the UI can restore the accepted draft and reset stale editor controls.

The shared validator checks working documents, origins, session ownership, checkpoint references, and document-local item identity needed for safe transfers. Existing backup, atomic replacement, external-change, size-limit, and unsaved-Quit protections cover the entire expanded campaign. The mutation contract and session/view separation can also support a future controlled combat editor without making inventory state a global shared object.

Desktop styles use installed font fallbacks. Web fonts are centralized in a web-only stylesheet, replaced at desktop build time. This prevents remote font imports from breaking lazy-loaded editor CSS under the local content policy. Workspace button/layout styles are scoped so the embedded editor keeps its established controls and selection styling.

## Verification

All fixtures are synthetic. Native checks used the packaged `.app`; automated tests are described separately.

| Check                           | Evidence                                                                                                                                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration                       | Native Open left a V2 fixture unchanged on disk and showed the V3 upgrade notice. Automated native tests verify exact V2 `.bak` bytes and complete B1 evidence/metadata retention after saving V3.                                                                                  |
| Controlled editing              | Native quantity and DM-note edits worked in the embedded editor. Transferring the parent pack moved its nested case and stones to Tal with stable IDs/container links. A controlled-editor test covers the same callbacks.                                                          |
| Navigation                      | Native Possessions → Combats → Possessions retained edits and Tal's selection. Command-Option shortcuts worked outside inputs and did not interrupt note entry. Automated workspace tests verify the focus guard and view-switch persistence.                                       |
| Working/history separation      | Named checkpoint captured quantity 6. Subsequent working edits reached 9 and then 10. Native History showed checkpoint 6 and original imported 2. Original B1 records/revisions/sources remained equal to the original evidence fixture. No per-keystroke revisions were created.   |
| Empty inventory / association   | Created an empty working inventory in the second session. Returning to the first retained its edited inventory. This checks isolation, not the future carry-forward workflow.                                                                                                       |
| Save As and restart             | Save As retained both working inventories and history. Verified the app process exited, launched a fresh process, and reopened the final file. Native inspection showed quantity 10, Tal, the nested container, notes, and selected character restored.                             |
| Cancel / failed Save / conflict | Cancel on Quit kept the inventory edit. A read-only test folder made Save during Quit fail without exit; the entire file stayed byte-identical. An external edit triggered the conflict dialog; Save As preserved the local working inventory and left the external file untouched. |
| Checkpoint restore safeguards   | Automated tests verify replacing work first checkpoints the previous payload, gives the new working copy a new ID, and rejects delayed updates to the old working ID. Native validation rejects checkpoint alteration/removal and unprotected working-state removal.                |
| Standalone web                  | GitHub Pages export builds. Real Chrome loaded the DM editor under `/adnd-combat-tools`, imported the native standalone-DM export, and changed quantity to 12. The original File menu remained available; there was no native bridge. The native campaign stayed byte-identical.    |

Required checks passed: TypeScript, Prettier, ESLint, 110 Jest suites / 747 tests, 11 Rust tests, Rust formatting, and `git diff --check`. ESLint retains only the pre-existing unused-export warning in `src/types/util.ts`. Both production build targets passed. The browser smoke test observed the existing root favicon 404, with no application errors.

The temporary example is `/private/tmp/adnd-working-fixtures/Working retained.adnd`. It contains the edited session, an independent empty second-session inventory, and historical evidence/checkpoint data. Use Save As elsewhere if you want to keep it; macOS may remove temporary files.

## Routine feedback

The normal editing view omits the Working badge, shortcut hint, and repeated save explanation. Navigation shortcuts still work and respect text-entry focus. Historical views retain their read-only label. The heading is quiet when clean, shows Edited for pending changes, and briefly confirms a completed save with Saved. Saving/Opening feedback is transient; errors and actionable migration notices remain visible. The native save-success counter prevents cancelled or failed dialogs from generating a success confirmation.

## Remaining limits

- Combat editing and the complete two-session carry-forward/unfinished-encounter workflow are not implemented or claimed complete. There is no XP settlement.
- One campaign is open at a time. Save remains explicit; forced termination/crash recovery is not autosave.
- Working inventories use the existing 1 MB inventory validation limit; the complete campaign remains limited to 8 MB. Large archives may incur validation latency.
- Selected session/view and the inventory's active character are saved. Temporary UI state such as an open dialog, sort stack, or All Characters toggle is not persisted across a full quit.
- The app is a local Apple Silicon build without developer signing/notarization or an update service. Network/cloud-filesystem coordination and power-loss durability are unverified; the existing narrow external-write race remains.

Private campaign material, Dropbox, TOOFRepo, live campaign files, and unrelated `output/` were left unchanged. No push, deployment, publication, or release was performed.
