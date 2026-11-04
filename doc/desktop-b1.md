# B1 — campaign snapshot capture

The next slice adds [campaign-controlled working inventory and a focused workspace](desktop-working-inventory.md). Its V3 format preserves this B1 evidence.

B1 extends the committed Tauri foundation. It does not change shell selection, add XP settlement, embed full tool editors, or synchronize separate tools with the campaign. All verification data is invented. Private design material was read in place; no private campaign evidence was copied into source or assets.

## Build, launch, and use

With Node/npm, Rust/Cargo, and Xcode command-line tools available:

```sh
npm ci
npm run desktop:build
npm run desktop:run
npm run desktop:test
npm run build
```

The local app remains `src-tauri/target/release/bundle/macos/AD&D Tools.app`. Quit before rebuilding. The web target continues to export under `/adnd-combat-tools`; desktop assets use their separate output and local origin. No deployment or release step is involved.

1. Open a campaign or choose File → New Campaign. Existing V1 title/notes files display a notice that Save upgrades them to V2. Opening does not rewrite the original; a same-path Save preserves its previous bytes in `.bak`.
2. Enter a session label and click **Add session**. Session labels need not be numeric.
3. Expand **Import combat or inventory**. Choose **Import combat URL**, **Import combat JSON**, or **Import inventory**. Paste the URL/text or use **Choose JSON file…**.
4. Click **Preview import**. Inspect the active round/rosters or DM character/item summary, supply a record title, and choose **New record** or **Add revision** as the destination. Click **Attach snapshot**.
5. A matching snapshot shows the existing records. Choose **Reuse this record**, or explicitly confirm that identical content represents a distinct record. Reusing matching content selects its existing revision without appending another.
6. Select a record under **Combats** or **Inventories** to inspect it. Use the selected-revision control or **Earlier revision / Later revision**. Record titles and session associations can be corrected without creating source revisions. The session-label field also renames the selected session.
7. Use **Export original … source…** to write the selected original input locally. JSON stays JSON; a tracker URL is exported as a text file for pasting into the existing tracker workflow. Inventory exports are explicitly labeled DM sources.
8. Save, quit the app completely, relaunch, and choose **Reopen last**. Neither original files nor network access are needed. Title/notes edits and Save As retain attachments and their history.

These are **captured snapshots**. Editing the separate Tracker or Encumbrance tool does not update a stored revision. Import again to capture later changes. Import timestamps record capture time, not play time. Record-local combatant keys and source inventory IDs are not a global character registry.

## Model and validation

V2 retains campaign ID/title/notes and adds sessions and records. Each session has an ID/label. Each record has an ID, type, title, session association, revision list, and selected/current revision ID. Each revision retains its ID, UTC import time, original source kind/text/name or URL, source version, interpretation version, SHA-256 original-text hash, SHA-256 normalized-content hash, and normalized payload.

Original text is immutable evidence. Normalized payload is its validated interpretation. URL whitespace is retained exactly, while a trimmed copy is decoded without fetching the site. JSON source text is retained before migrations. On opening and saving, the original is decoded again with interpretation version 1 and compared against the stored payload, hashes, and source version. Inconsistent/corrupt revisions reject the entire candidate before replacing the active campaign. Unknown campaign-envelope fields and unsupported versions are rejected. Future interpretation changes must explicitly support historical interpretations or migrate them; they must not silently reinterpret stored revisions.

The existing tracker transformer and encumbrance parser remain authoritative migrations. Tracker JSON versions 1–8 and the codec's zlib/base64 URL state are supported. Boundary checks cover roster/state sizes, numeric/string fields, active round, cells, action references, and sparse-cell coordinates. Blank HP remains unknown. URL decompression is streamed with a 1 MB output ceiling, checks its checksum and UTF-8, and rejects truncated/malformed state.

DM inventory versions 1–9 are supported. Player/redacted documents are rejected. The existing parser handles migrations and custom items; additional checks reject duplicate IDs and missing/cyclic container links before sanitation. Legacy single-character files get a deterministic source-local character ID, avoiding random identity changes during replay. The standalone parser retains its previous default behavior.

Equivalent tracker JSON/URL forms are matched using the existing codec's canonical compact representation, including omitted defaults. Stored payload and original evidence remain intact. New record/revision IDs are generated independently of content hashes, titles, names, and filenames.

The shared TypeScript validator is bundled by esbuild and executed natively in an isolated QuickJS runtime with no filesystem/network bindings, a 128 MB memory ceiling, and a 15-second validation deadline. Cargo generates that bundle during native builds, so a fresh checkout cannot accidentally use a stale validator. This permits native open/save to reuse the same parsers and checks as the frontend. Import sources are limited to 1 MB; the complete pretty-printed campaign must fit the existing 8 MB read/save limit. Oversize data fails before file replacement.

All persistent edits reach native document state. Attachment/metadata updates and text edits are queued before Save, Quit, and Finder-open operations. An application token plus campaign ID prevents stale async imports from attaching to a newly opened or edited campaign. Native updates reject removal or alteration of existing immutable revisions. Export only accesses a selected stored revision, uses a native destination picker, and refuses to overwrite the active campaign or its backup.

## Verification

The packaged Mac app was used for the native observations below. Automated checks are identified separately; mocked choices are not described as native verification.

| Scenario                | Evidence                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1 migration            | Native Open displayed the upgrade notice; the source remained V1 on disk until Save, which produced V2. A Rust filesystem test verifies exact V1 backup bytes and preservation of ID/title/notes.                                                                                                                                                                                                         |
| Both imports            | Natively pasted a multi-round tracker URL with leading/trailing whitespace, inspected names/HP/effects, and attached it to a named session. Natively selected a two-character DM JSON file with nested containers, quantities, custom values, and identification information; preview and capture succeeded.                                                                                              |
| Immediate Save          | The first test caught a queue ordering bug; attachment updates now join the pending-operation queue. The corrected native Attach → immediate Command-S persisted both records. An adapter test verifies Save waits for attachment validation/application.                                                                                                                                                 |
| Duplicate               | Reimporting identical DM JSON showed its existing record. Reuse reported “Already imported” and kept one revision. Automated tests verify equivalent JSON/URL forms, codec-omitted defaults, and explicit distinct-record creation.                                                                                                                                                                       |
| History                 | A changed inventory quantity/DM note was deliberately appended to the same record. Both revisions were retained; revision 2 was current after restart. In the final package, Earlier revision showed the original quantity 2 and original DM note, while Later revision showed quantity 3 and the changed note. Automated tests also append changed combat content and reject duplicate revision content. |
| Metadata                | Native campaign title/notes edits, session rename, record rename, and Save As preserved all campaign/record/revision IDs and source arrays, checked against the saved JSON.                                                                                                                                                                                                                               |
| Full restart            | Verified process exit, moved original combat/URL/inventory inputs away, launched a fresh process, and reopened the saved campaign. Both records and the two-revision inventory restored; the latest nested inventory contents remained readable.                                                                                                                                                          |
| Export                  | Native DM JSON and combat URL exports were byte-identical to their selected original inputs and accepted by the standalone DM parser and tracker decoder.                                                                                                                                                                                                                                                 |
| Failed write / conflict | A real read-only test folder made Save during Quit fail. The app kept the entire draft and the disk campaign remained byte-identical. An external edit triggered Save As / Reload / Cancel; Reload restored the external metadata and all attachments.                                                                                                                                                    |
| Cancellation            | Native Cancel import and cancelling the source file picker left the campaign saved and its records unchanged.                                                                                                                                                                                                                                                                                             |
| Invalid and stale input | Automated checks reject unsupported versions, malformed/truncated/checksum-corrupt URL state, decompression bombs, bad references/cycles, corrupt stored payload/source, oversized input, and stale campaign tokens/IDs. A malformed native URL preview failed without replacing the active campaign.                                                                                                     |
| Public tools            | The GitHub Pages static export builds independently. Browser smoke checks exercise calculator, tracker, and encumbrance DM with the Pages asset prefix. A build-time dynamic import excludes the desktop workspace and bridge from the public module graph; the final web-output audit found no native command/bridge code.                                                                               |

Final automated checks: **107 Jest suites / 736 tests and nine Rust tests passed**, along with `npm run tsc`, `npm run format`, `npm run lint`, `cargo fmt --check`, and `git diff --check`. Lint retains only the pre-existing unused-export warning in `src/types/util.ts`. Both production build targets passed.

Synthetic native test files live under `/private/tmp/adnd-b1-fixtures/`. `B1 retained snapshots.adnd` is the captured campaign; original inputs were moved into `sources-moved/`. These are temporary test artifacts, not private campaign records or build resources.

## Limits and scope

There is still one open campaign at a time, explicit Save, one previous-version backup, and no autosave, live synchronization, XP settlement, global identity reconciliation, permanent-delete workflow, or player sharing. A snapshot is DM-private. Files larger than the stated limits are rejected. The original local-file check-to-rename concurrency limitation remains; this is not a multi-writer/cloud synchronization protocol. The local Mac build is not developer-signed/notarized for distribution. No push, deploy, release, or B2 work was performed.
