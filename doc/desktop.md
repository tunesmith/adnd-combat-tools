# Personal Mac desktop — checkpoint A (Tauri)

The optional desktop edition now uses Tauri 2 with bundled Next 12 assets and a small Rust native layer. The React frontend and existing domain code remain shared with the GitHub Pages edition. There is no XP, campaign inventory integration, or checkpoint B implementation.

## Build and run

Prerequisites: Node 20 or 22, npm, Xcode command-line tools, and a stable Rust toolchain. Cargo is Rust's dependency/build/test tool; rustup manages toolchains.

On this Mac, Homebrew installed rustup under `/opt/homebrew/opt/rustup`. Bash is the login shell. In `~/.bash_profile`, immediately after the initial PATH exports and before the “Load nvm” comment, use:

```sh
export PATH="/opt/homebrew/opt/rustup/bin:$PATH"
```

This was added by the user and verified in a fresh Bash login shell. It belongs in `.bash_profile`, since `.bashrc` deliberately returns immediately in non-interactive shells. New terminals pick it up automatically; run the export above in an existing terminal to activate it there.

```sh
# Once, if a stable toolchain is not installed:
rustup default stable

# From the tools repository:
npm ci
npm run desktop:build
npm run desktop:run

# Native checks:
npm run desktop:test
cargo fmt --manifest-path src-tauri/Cargo.toml --check

# Existing GitHub Pages build:
npm run build
```

The app is `src-tauri/target/release/bundle/macos/AD&D Tools.app`. The verified Apple Silicon bundle is approximately 11 MB. It uses macOS WebKit instead of shipping Chromium. Quit before rebuilding. The obsolete Electron build output is ignored and can be retained as a local fallback; the scripts and dependencies now target Tauri only.

The verification environment used an ignored `.cargo-local` Cargo cache because its shell sandbox did not allow writes to the default Cargo cache. Ordinary local builds can use Cargo's default cache. Rust is only needed for desktop builds and native tests; the web target remains an npm/Next static export.

## Files and interface

New documents default to `.adnd`; the native Save dialog adds the suffix when you type just a name. These remain readable JSON with `kind`, `schemaVersion`, persistent `id`, `title`, and campaign-wide `notes`. Existing `.json` / `.adnd-campaign.json` documents and `.bak` recovery files remain readable. Saving an existing legacy document preserves its name; Save As suggests `.adnd`.

The bundle registers `.adnd` as “AD&D Campaign” with macOS and handles Finder open requests. All normal document replacement operations validate first. Unknown fields, malformed JSON, unsupported versions, and missing files produce an error while retaining the active draft.

File operations live in the native File menu: New, Open, Save, Save As, Close Campaign, and Reopen Last. Command-N/O/S/Shift-S/W and Command-Q are supported. New/Open/Reopen buttons appear only when no document is loaded. A loaded document shows its title, notes, path, and saved/unsaved status. Standard native Edit commands remain available.

## Persistence and native boundary

`CampaignStorage` remains the shared UI contract. `src/helpers/tauriCampaignStorage.ts` adapts it to Tauri's injected API. This avoids a Next 12 compiler incompatibility with private fields in the current npm Tauri API package. The adapter loads only in the desktop UI and waits for pending text edits before executing menu commands.

`src-tauri/src/document.rs` validates and saves documents. Saves stage and flush a temporary file beside the destination, recheck SHA-256 identity after staging, preserve the exact old bytes in `<filename>.bak`, then atomically replace the file. New destinations use exclusive creation. Save As compares canonical existing paths to recognize aliases such as `/tmp` and `/private/tmp`. External edits or missing/moved files offer Save As / Reload / Cancel; Reload validates before replacing the draft.

`src-tauri/src/main.rs` owns document state, selected paths, menus, dialogs, and recent-path preferences. The renderer cannot submit filesystem paths; access comes from native pickers or OS file-open events. Recent-path preferences live in the app's Application Support directory. Missing files never cause an empty replacement to be written.

`src-tauri/src/macos.rs` implements Cocoa's standard `applicationShouldTerminate:` veto. This is necessary because the stock native Quit action can terminate directly without Tauri's `ExitRequested` event. Normal Quit requests wait for Save / Discard / Cancel, and only successful approval permits termination. Forced termination remains outside this guarantee.

The webview loads bundled assets, blocks external navigation, and has no filesystem, shell, or remote-origin capability. Its capability file permits only event subscriptions; custom commands expose state, text edits, and named document actions. The local content policy blocks remote scripts and connections. Existing web Google Fonts use system-font fallbacks in the desktop app.

## Acceptance verification

All regression fixtures are synthetic and live outside the repository. Existing untracked `output/` work was preserved. The user's unsaved Electron document was saved separately outside the repository before quitting that app. No private campaign evidence, campaign documents, tests, or repository documentation is included in the desktop frontend asset directory.

| Check                     | Evidence                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Native launch             | Built and launched the packaged Tauri `.app` at `tauri://localhost`, using embedded assets with no development server.                                                                                                                                                                                                                                             |
| File round-trip           | Native New, title/notes edits, Save As with automatic `.adnd` suffix, Command-S, Save during Quit, process-exit verification, and subsequent reopening. ID, schema, title, and final notes checked against disk.                                                                                                                                                   |
| Recovery                  | Parsed `.bak` and verified it contained the exact prior document. A real read-only synthetic directory made Save during Quit fail; the app and draft stayed open, and the original file remained unchanged. Rust tests also inject a failure after staging.                                                                                                        |
| Conflicts                 | Externally edited the open file. Native Save offered Save As / Reload / Cancel. Cancel retained the draft. Save As created a separate file and preserved the external version. Rust tests cover changed/missing files and changes during staging.                                                                                                                  |
| Cancellation / validation | Native New, Open, Close, and Save As cancellation retained edits. Opening malformed JSON and schema version 2 produced useful errors without replacing the draft. Rust parsing tests also reject unknown fields. A Rust compatibility test reads legacy `.adnd-campaign.json`, saves `.adnd`, preserves all fields and ID, and leaves the legacy source unchanged. |
| Quit handling             | The initial native-Quit bypass was caught and corrected with the Cocoa guard. Native Cancel retained edits; failed Save prevented exit; successful Save exited.                                                                                                                                                                                                    |
| Web regression            | Static export succeeds. Real Chrome loaded calculator, tracker, and encumbrance DM under `/adnd-combat-tools`; JS/CSS returned successfully under the Pages prefix. The calculator computed a result. The browser had no Tauri API.                                                                                                                                |
| Automated checks          | 106 Jest suites / 723 tests, five Rust tests, TypeScript, Prettier, ESLint, Rust formatting, and `git diff --check`. Lint retains the pre-existing unused-export warning in `src/types/util.ts`.                                                                                                                                                                   |

Synthetic files are under `/private/tmp/adnd-tauri-checkpoint-a/`. `Lantern Copy.adnd` contains the saved final draft; `Lantern.adnd` contains the separately edited external version. Temporary files may be removed by macOS: use Save As to keep a document elsewhere.

The final Finder-open-while-typing smoke check was subsequently completed by the user and passed, including Cancel, Save, and Discard behavior.

## Icons

The app uses a burgundy-and-gold d20 emblem; `.adnd` files use a coordinated paper-document icon. Editable sources are in `src-tauri/icons/design/`. Tauri's icon generator creates `app.icns` / `app.png` and `campaign.icns` / `campaign.png`. The custom `src-tauri/Info.plist` declares the document icon and `local.adnd.campaign` type, conforming to JSON. The campaign icon is bundled at the Resources root. Rebuild and relaunch to pick up the app icon; Finder may retain cached icons until it refreshes.

The `.bak` suffix is an application convention, not a macOS requirement. The first save to a new path creates no backup. Saving over an existing file preserves that file's prior bytes beside it and replaces any older `.bak`. Saving unchanged content also currently refreshes the backup. Save As over an existing destination preserves that destination's previous contents. It is a single recovery copy, not version history; it can be deleted if no longer needed and is recreated on the next overwrite.

## Remaining limits

One document and one remembered path; explicit Save only; no autosave or crash recovery. The local Apple Silicon app has no developer signing/notarization or distribution/update service. Intel, other operating systems, power loss, network/cloud filesystems, and OS shutdown were not tested. There remains a small check-to-rename race against an uncooperative simultaneous writer; this is not a synchronization protocol. Existing Next 12 dependency age is unchanged.

Try the foundation with a synthetic `.adnd` document before beginning checkpoint B. No deploy, push, commit, release, or private campaign migration is part of this work.
