# Campaign architecture and verification

For build commands and ordinary use, start with the [desktop guide](desktop.md).
This document describes the current implementation, not a sequence of releases.

## Ownership boundaries

| Owner                  | Responsibility                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Native `Session`       | Accepted document, saved revision, filesystem operations, native dialogs and validation                             |
| `tauriCampaignStorage` | Optimistic document, ordered queue, replaceable edits, command barriers, rejection/recovery and one subscribed view |
| `DesktopWorkspace`     | Render the subscribed view, request operations, and own presentation state such as dialogs and selected tools       |
| Domain helpers         | Construct and validate campaign transitions without owning files or UI state                                        |

The [storage contract](../src/types/campaignStorage.ts) supplies the displayed
document, native status, queue status and editor revision through one subscription.
A mutation promise reports accepted data; it does not certify a newer optimistic
edit. Awaited confirmations can suppress optimistic preview until acceptance.
The [adapter](../src/helpers/tauriCampaignStorage.ts) owns recovery and editor
invalidation; React does not maintain a second pending counter or reconciliation loop.

Combat changes coalesce over a 180 ms window and while acceptance is in flight.
Only adjacent replaceable changes with the same document identity, epoch, session,
encounter and generation can merge. Discrete mutations seal that batch. Each
operation rebases on current native state, so a later combat snapshot cannot
replace an intervening banking or XP operation.

Document commands occupy the same ordered queue. Repeated identical commands share
completion. Final IME input is included before dispatch. A Save's snapshot precedes
subsequent edits, which remain dirty. Native command IPC completes after the
command/dialog flow, rather than merely acknowledging dispatch. Native notifications
update status without rolling back newer optimistic input. Rejected operations
retain their input and require explicit retry or discard; stale document/editor
callbacks cannot mutate a replacement target.

## Document, identity and history

[CampaignDocument](../src/helpers/campaignDocument.ts) defines campaign schema 21
and supported older readers. The document contains sessions, roster/profiles,
working encounters/inventories, source records, checkpoints, workspace selection,
and optional XP/Banking data. Titles and names are not persistent identities.

A combat has a session-local working `id` and a logical `encounterId`. Explicit
session continuation creates a new working instance with the same logical ID,
a full independent snapshot, and frozen source-checkpoint provenance. A new
party-based encounter gets both new identities and a fresh round. Removal/recovery
and restoration retain evidence and invalidate obsolete editor callbacks.

Inventories have independent working identities per session. Explicit copies
retain holder/item identities and container relationships; destination collisions
are rejected. Profile-to-inventory name matching is a one-time selection aid,
not a stored synchronization link. Historical previews never write editor changes.

Source revisions retain original text, source/interpretation versions, normalized
payload and content/source hashes. Opens and replacements verify that evidence
matches its interpretation. Legacy interpretations and confirmed XP calculator
versions are preserved rather than silently recalculated under current rules.
Checkpoint, lineage, financial and XP transition checks protect accepted history.
Relevant code: [snapshots](../src/helpers/campaignSnapshots.ts),
[history](../src/helpers/campaignHistory.ts), and [continuity](../src/helpers/campaignContinuity.ts).

Older documents migrate in memory; opening does not rewrite disk. Unsupported newer
formats are rejected. A legacy V6 document with nonempty inventory/combat profile-link
lists is also unsupported. Current DM inventory is V10; player exports remain V9.
Compatibility tests and fixtures cover these contracts; adding a format must preserve
existing identities, original evidence and confirmed calculations.

## Native validation and saving

[The native boundary](../src-tauri/src/boundary.rs) executes the shared TypeScript
validator in QuickJS without filesystem/network bindings. Cargo regenerates its
bundle through [the build script](../scripts/buildCampaignBoundary.cjs). Each
invocation has a 128 MB memory limit and a 15-second execution limit.

Every untrusted replacement receives full current-document and transition
validation. The previous document is already accepted native state and is decoded
without repeating its validation. Rust additionally enforces immutable-history
constraints. Untrusted opens/imports retain full validation. Source payloads are
limited to 1 MB and the serialized campaign to 8 MB; collection limits also apply.

[Native persistence](../src-tauri/src/document.rs) serializes the accepted Session
document, stages and syncs a temporary file beside the destination, checks disk
identity before and after staging, then replaces atomically. New destinations use
exclusive creation. Failed writes preserve the original destination. This does not
claim cloud-filesystem coordination, crash autosave or complete power-loss durability;
a narrow external-write race remains between the final check and replacement.

Routine Save and Save As do not refresh backups. A real on-disk schema upgrade
preserves the original bytes as `<campaign>.bak` or `<campaign>.upgrade-N.bak` without
overwriting an existing recovery file. Source/inventory exports protect the active
campaign and its recovery destinations.

## Verification

Run repository checks before a commit:

```sh
npm run tsc
npm test -- --runInBand
npm run format
npm run lint
```

For native/storage changes, also run `npm run desktop:test` and
`npm run desktop:build`. For shared-editor changes, also run `npm run build` and
check the standalone browser workflow. Use synthetic fixtures or disposable copies;
never test destructive/recovery scenarios on a live campaign.

The native backlog harness exercises actual packaged React/Tauri/QuickJS and
filesystem paths. It checks exact saved HP/outcome/notes, coalescing under delay,
input during Save, rejected edits, a validation timeout, disk failure, retry,
repeated commands, navigation, Save As, Quit and external conflicts.

```sh
npm run desktop:build -- --features diagnostic-harness
python3 scripts/desktopBacklogHarness.py --campaign /path/to/SOCK.adnd --mode timing
python3 scripts/desktopBacklogHarness.py --campaign /path/to/SOCK.adnd
npm run desktop:build
```

This harness is scenario-specific: its timing case needs an encounter named
Hobgoblins; the full case also expects Giant Rats and another session. Use the
representative SOCK input or an equivalent fixture. It creates private temporary
copies, checks the original hash and retained history, prints its artifact directory,
and has a 120-second process deadline. Picker/prompt answers are injected, so it
does not verify OS dialog interaction or physical keyboard accelerator delivery.

`ADND_DIAGNOSTICS=1` enables bounded native operation/size/timing output; renderer
timing is opt-in through `window.__CAMPAIGN_DIAGNOSTICS__`. Script injection and fault
controls require the explicit `diagnostic-harness` build feature. Harness runs leave
the normal recent-file shortcut alone. Rebuild normally afterward to remove test
controls. Compare native operation counts and request-to-completion times on the
same input; browser/Node timings alone do not establish native performance.

Keep reusable test code and synthetic fixtures in the repo. Keep generated bundles,
disposable campaign copies and run-specific logs/screenshots out of commits. Past
implementation narratives and benchmark runs are available in Git history.
