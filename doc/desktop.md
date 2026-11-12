# Desktop campaign app

AD&D Campaign is the local macOS edition of AD&D Combat Tools. It keeps a campaign's
sessions, character profiles, encounters, possessions, Banking and XP in one `.adnd`
file. The file is JSON and can be reopened without its original import files.
The browser tools and the desktop **Tools** menu retain independent standalone workflows.

## Build and run

Install Node 20 or 22, npm, a stable Rust/Cargo toolchain, and Xcode command-line tools.
Save and quit a running app before replacing its bundle.

```sh
npm ci
npm run desktop:build
npm run desktop:run
```

The bundle is `src-tauri/target/release/bundle/macos/AD&D Campaign.app`. Once built,
it runs without a development server. This is a local build; signing, notarization
and an update service are not part of this workflow.

For browser development, use `npm run dev`. `npm run build` produces the GitHub
Pages export under `/adnd-combat-tools`; desktop assets have their own output and
local origin. See [architecture and verification](desktop-architecture.md) for
storage ownership, validation, tests and native diagnostics.

## Workspace

Open a file through **File → Open**, Finder, or **Reopen Last Campaign**. Use
**File → New Campaign** for a new document. Select a session, then a view:

| View        | Purpose                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| Session     | Character profiles, compact XP reference, session notes and session imports |
| References  | Saving throws and manual reference notes                                    |
| Banking     | Recorded money balances, transactions and reconciliation                    |
| Possessions | Physical character inventories, containers and storage locations            |
| Combats     | Editable encounters, rounds and scoped version history                      |
| XP          | Earned events, award points, recipient settlement and accepted history      |

[Profiles and membership](desktop-party-reference.md),
[possessions and Banking](desktop-possessions.md), and [XP](desktop-xp.md) explain
features that have independent state and deliberate copy/review actions.

**+ Session** appends a session with optional copies of selected profiles,
inventory, encounters and notes. Transfer boxes start unchecked. Copied data is
independent; later source edits do not update it. Copying an encounter through
this dialog continues the same logical fight with its complete round history.
The placement control also offers eligible historical insert/move operations.
Session-tab order supplies chronology; ordinary reordering is locked after XP
confirmation. Historical XP reconstruction uses the explicit [extension workflow](desktop-xp.md#history-and-corrections).

Double-click a session/encounter name or focus it and press F2 to rename it;
Enter accepts and Escape cancels. Session tabs support drag and Option-Shift-Left/Right
when reordering is allowed. Command-Option-1/2 opens Possessions/Combats,
3 or 4 opens Session details/imports, 5 opens Session, and 6 opens XP.
Navigation shortcuts defer to text fields and dialogs.

## Create and run encounters

**+ Encounter** opens **Name / Start with**. Choose **Empty** or a party from an
active encounter in the selected session. The selected encounter's party is the
default when its last round has members; each option shows its last round and
party size. Creation selects a separate encounter with one fresh Round 1.

Party copying always uses the source's **last round**, even if an earlier round is
on screen. It preserves party order, combat setup, current and maximum HP, and
character reference notes. Blank or textual current HP stays exactly as recorded.
Enemies, effects, actions, results, targets, initiative, matchup cells and round
notes are cleared. Enter healing and other between-fight corrections yourself;
notes, profiles and possessions do not update copied HP or equipment.

**Add from party/profile…** copies supported name/class/effective-level values
from a session profile into a combatant draft. Review HP, armor, weapons and
movement before adding it. It is a snapshot, not a live profile link. Use manual
party-member creation for a distinct character with an already-present name.

The **Version** control below the editor switches between current work and
read-only imports/checkpoints. Historical navigation stays local to the preview.
The adjacent actions capture named checkpoints, restore a version while preserving
current work, or create a separate encounter from history. Restores use the selected
encounter's proven history, not unrelated records with matching names.

**Remove encounter from this session** preserves the instance and its history.
Populated encounters require confirmation. Use Undo or **Removed encounters** to
recover it; removal in one session does not remove its continuation elsewhere.

## Import and inspect sources

In **Session → Session imports**, choose combat URL, combat JSON or DM inventory
JSON, then preview and name the record. Player/redacted inventory files are not
campaign import sources.

**Import and use** captures immutable source evidence and creates/selects working
state. Replacing current inventory requires review and a checkpoint; its money
comparison does not change Banking. **Store snapshot only** keeps a preparation
source without changing current work. Original source export is available there.

Duplicate content can reuse its existing record or be explicitly approved as a
distinct record. Reusing a combat source preserves its working edits. Adding a
revision stores new evidence without overwriting the working combat; inspect or
restore it through Version. Stored checkpoints without provable ownership remain
accessible through session imports rather than being guessed into restore lists.

## Save and recover

Command-S or **File → Save** flushes queued editor updates, including unblurred
tracker input. Save As, Quit, close, reopen and open also respect pending edits and
IME completion. Apply or save modal form drafts first; Campaign Save does not
implicitly confirm a profile dialog, intention draft or XP award.

The header distinguishes Editing, Waiting for edits, Saving, Saved and needs
attention. Input made after a Save request remains dirty until another Save.
After rejection, **Retry pending edits** retries retained operations against
accepted state; **Discard rejected edits** deliberately restores accepted state.
A disk-save failure leaves the draft available for another Save attempt.

An external-file conflict offers **Save As**, **Reload**, or Cancel. Save As keeps
local edits in another file; Reload replaces them with the disk version. Ordinary
saves do not create `.bak` files. The first save that upgrades an older on-disk
schema preserves its exact bytes in a collision-safe recovery copy.

Saves are explicit, not crash autosave. Use one campaign window and avoid concurrent
writers. Selected session/view, encounter/round and inventory holder are persisted;
open dialogs and historical-preview navigation are temporary UI state.
