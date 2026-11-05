# Import and history usability

This pass implements the five Session 93 play-test usability fixes. It includes the mixed-record duplicate-scan fix and its synthetic regressions. Session dates remain deferred; session labels continue to work as before.

## Import workflow

1. Select a session, then Campaign Details → Import…. Choose combat URL, combat JSON, or inventory JSON and preview the source.
2. Check the seeded title and edit it once if needed. Choose a new source record or explicitly add a revision to an existing record.
3. Leave **Import and use** selected to capture immutable evidence and open usable working state in one native update. A combat normally becomes a new encounter. The first inventory activates directly. Replacing an existing inventory names it and its session in a confirmation and checkpoints its previous state.
4. Choose **Store snapshot only** for preparation masters or archives. The source stays in this session's imports without creating an encounter or replacing inventory. Select it there later to open/create a combat or use it as inventory. Replacements remain deliberate.
5. Preview is collapsed and follows the title/destination/final action. It uses the same readable, read-only editors as history, including character/round navigation and friendly item/container names. Original source text and export remain secondary provenance controls.

A successful import clears the text, filename, preview, title, destination and distinct-record approval, retaining the session. Import another source starts fresh. Failures retain the input and preview for correction/retry. Cancel clears the import draft without changing records. The form blocks repeated submissions while an update is pending.

Duplicate content requires selecting its existing source or explicitly approving a distinct record. Reusing an imported combat source selects its already linked encounter and preserves working edits. Adding a revision to that source stores the new evidence and opens the existing encounter without overwriting it; the new revision is available in Version. An inventory revision can replace current inventory after the explicit replacement confirmation. Identical repeated imports reuse linked work rather than creating duplicate working copies.

## History ownership

Version is scoped to the selected encounter or current inventory through record IDs, working IDs, checkpoint IDs and persisted origins. Renaming does not affect scope. Unrelated sources are in the session imports chooser, rather than routine restore lists. Stored checkpoints remain discoverable there too, including older checkpoints that lack enough provenance to prove a link to current work. New encounters can deliberately be created from these stored versions.

New checkpoints optionally retain their owner's origin, allowing subsequent restores and inventory replacements to keep the provable source lineage. Existing snapshots/checkpoints are never rewritten to add guessed links. The V4 parser accepts older documents without that optional provenance. An older app that cannot read the added fields will reject them rather than drop evidence; use the rebuilt app for subsequent saves.

Ordinary combat restore helpers and the native replacement boundary reject unrelated histories. The native boundary also checks new checkpoint provenance. Inventory replacement from an unrelated source is an explicit import/source-activation operation; ordinary history restore cannot perform it. Existing checkpoint immutability, source validation, previous-version backups, conflict checks, dirty tracking, queued edits and unsaved-quit behavior remain in force.

**Current · editable** and **Historical · read only** appear near the top of the content. Version and its secondary actions remain below the editor. First activation uses **Use as current inventory** directly. Replacement confirmations have short action labels, focus on Cancel, and support Escape.

## Verification

All verification data is synthetic. The live TOOF campaign/backup, Dropbox and TOOFRepo were not used as test inputs or changed.

### Packaged app

The same production code was packaged temporarily as `AD&D Tools Playtest`, with identifier `local.adnd.tools.playtest`. This isolated its running window and recent-file storage from the normal app. It is a testing arrangement, not a multiple-campaign product feature. The delivered normal bundle is still `AD&D Tools.app` with identifier `local.adnd.tools`.

The packaged walkthrough:

- Imported combat A and B with Import and use, observed seeded titles and direct navigation to separate encounters. Returning to Import showed a cleared draft. Renamed A; its Version menu contained only A's imported revision.
- Imported a two-character inventory with nested containers into an empty session. It opened directly with Current · editable and zero inventory checkpoints. Expanded its readable preview and verified ordinary character controls and friendly item names.
- Stored a preparation master only. The campaign contained four immutable source records but only two active encounters and one working inventory. All four original source texts matched their synthetic input files byte-for-byte.
- Used the explicit inventory replacement action. The confirmation named the current inventory/session, Escape cancelled it, and a subsequent confirmed replacement created a checkpoint containing the prior inventory.
- Saved, fully quit (verified no running isolated app), relaunched and reopened. The renamed A, B, current inventory, preparation source, stable IDs and replacement checkpoint remained. The preparation master was still not an active encounter.

These checks used `/private/tmp/adnd-session93-synthetic/Synthetic campaign.adnd`; it is disposable synthetic data.

### Automated and browser checks

Synthetic tests cover atomic import/use versus store-only; failed updates retaining drafts; successful imports resetting drafts and destination; cancellation; add-revision without overwriting working combat; duplicate reuse and explicit distinct records; ownership after rename/save/reopen; unrelated restore rejection in both TypeScript and the actual native QuickJS boundary; and preservation of sources, working inventories/combats and checkpoints. The earlier mixed-record import regressions remain included.

The public GitHub Pages export was served under `/adnd-combat-tools` and checked in real Chrome. Standalone tracker note editing, round advancement, share-URL rewriting and browser drafts worked without a native bridge. Standalone inventory loaded synthetic DM JSON and retained a quantity edit from 2 to 7 after closing/reopening its item dialog. Its File workflow remained present. The tracker observed the existing root favicon 404; no application errors were observed, and the inventory page had no console errors.

Repository verification: TypeScript, Jest, Prettier, ESLint, Rust tests/formatting, `git diff --check`, Tauri build and public static build. Exact final test totals are reported with the delivery. ESLint retains the existing unused-export warning in `src/types/util.ts`; build tooling retains its Browserslist database notice.

## Build and remaining limits

```sh
npm run desktop:build
npm run desktop:run
npm run build
```

The double-clickable normal app is `src-tauri/target/release/bundle/macos/AD&D Tools.app`. Fully quit an older running normal app before trying the rebuilt version. Node/Rust/Xcode prerequisites are unchanged.

- Older opaque checkpoint provenance is not guessed from titles or matching payloads. Such evidence remains accessible in Session imports → Stored checkpoints.
- Saves remain explicit; crash autosave and multi-window campaign editing are not added. Existing document/archive size limits and filesystem durability limits still apply.
- XP, explicit cross-session carry-forward, session-date schema changes and Session 92 reconstruction/import are deferred. No live-data edit testing or multi-session continuity claim is made here.
- No deployment, push or release was performed. Unrelated `output/` is preserved.
