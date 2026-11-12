# Create an encounter from a party

In a session's Combats view, **+ Encounter** opens a compact **Name / Start with**
dialog. Start with defaults to the selected encounter's party when its last round
has participants. Choose **Empty** or another active encounter in the same session;
each source shows its last round label and party size.

The new encounter is selected after the campaign accepts the change. It has a new
identity and one Round 1. Party order, combat setup, current HP, maximum HP, and
character reference notes are copied independently. Enemies, effects, actions,
results, targeting, initiative, matchup cells, and round notes are cleared.
The source's displayed round does not affect copying: the last round is always used.
No healing or equipment changes are inferred from notes, profiles, or inventory.

The existing tracker snapshot normalization and source checkpoint provenance are
used. Creation runs through the existing accepted campaign mutation boundary,
checks source identity/session/generation/removal, and uses stable creation IDs
for retries. Import, historical creation, and standalone tracker flows retain
their existing behavior.

## SOCK Day4 walkthrough

A disposable review file is available at `/tmp/SOCK-encounter-party-copy-review.adnd`.
The original SOCK file was read only and compared byte-for-byte after validation.

1. Select Giant Rats, then **+ Encounter**. Its two-person party is the default.
2. Enter a name and choose Fire Beetles to copy all five PCs from its last round.
3. Create the encounter. Initial HP are Reatha 4, Dan 4, Kramrak 6, Chocolato 1,
   and Imunoanne 2. Edit Chocolato to 4 for healing and Kramrak to 4 for the rat bite.
4. Those corrections affect only the new encounter. A Giant Rats copy has only
   Dan and Kramrak, with Kramrak already at 4 HP.

The disposable file contains Hobgoblins with those manual corrections and a
separate rat-party check. Original encounters and financial/XP history were
compared for preservation, and serialization/reopening retained the selection.
Regression coverage includes blank/textual HP, notes versus effects, last-round
selection, Empty, cancel, no sources, stale/removed sources, duplicate submission,
acceptance failure/retry, and save/reopen.

Build through `npm run desktop:build`; the app bundle is
`src-tauri/target/release/bundle/macos/AD&D Campaign.app`.
