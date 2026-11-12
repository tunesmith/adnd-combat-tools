# Session inventory membership

Possessions remains independent of profiles, combat and Banking. Removing a
character changes only the open physical inventory. It never creates a financial
transaction, deletes the roster character or changes earlier sessions.

## Remove and restore

In Possessions, select a character and open the existing character editor.
**Remove character** asks for confirmation before removing their entire inventory,
including containers, nested contents and money. Campaign mode preserves the full
pre-removal inventory as a checkpoint. The remaining character or storage selection
is valid even when the last character is removed. An entirely empty DM inventory
can be saved and reopened; player files still contain one character.

Removed holders with a known zero ledger balance and no discrepancy disappear
from current Banking balances. Nonzero or unresolved balances remain visible with
their historical names. Their transactions remain available, and **Already
recorded in possessions** can resolve an outgoing ledger balance deliberately.

Restoring a profile through Session's **+ Character** does not restore gear.
In campaign Possessions, **+ Character** separately offers an empty inventory or
an explicit copy from an earlier session. Empty is the default. Earlier copies
preserve the holder ID, item IDs, container graph, strength, notes and privacy
fields, and capture the complete source checkpoint. Editing the copy does not
change its source. If some of those item IDs already exist elsewhere in the
destination inventory, copying is refused to avoid duplicating transferred gear;
choose another source or start empty.

## Carry-forward

In **+ Session**, select the party profiles to carry and check **Current
inventory**. Only their matching inventory characters are copied. Storage and its
contents are carried independently. Retired profiles are omitted by the existing
inclusive-last-session policy.

There are no saved profile links. The one-time selection uses unique normalized
names on both sides. Additional or ambiguous inventory holders appear under
**Other inventory holders**, with explicit include/omit choices; they start
included to avoid silently discarding unmatched gear. Renamed or ambiguous holders
therefore require an explicit choice rather than a guessed association.

## Model and compatibility

Campaign V21 retains all V1–V20 data. Legacy continuations without holder choices
retain their original whole-inventory interpretation. New continuations record
`inventoryCharacterIds` and preserve a full source checkpoint. A returning copy
records source/target identity on its source checkpoint. Transition validation
checks exact copies, immutable evidence and replay identities. Ordinary saves
remain quiet; a schema upgrade uses the existing original-file recovery backup.

Standalone DM JSON remains V10 and now accepts zero characters, including a
storage-only or completely empty document. Older tools that reject empty DM
documents require the updated web build. Exporting a player file requires an
actual inventory character. Standalone creation and editing otherwise retain
their existing workflow.

## Verification

Synthetic shared-editor tests cover removal confirmation/cancellation, the last
character, player boundaries, selected carry-forward, returning gear, nested
containers, copy retries and collisions, and deliberate Banking resolution.
Native tests exercise V20 migration, immutable history, filtered continuation,
returning copies, atomic save failures, reopen and external conflicts.

A disposable SOCK copy exercises Stan and Vitameno removal, three selected party
holders plus storage, and explicit restoration of an earlier inventory. Earlier
working inventories, roster retirement, XP and financial records stay unchanged.
The original campaign and its existing backup are read-only validation sources.

The exported public web build was also checked in Chrome: confirm last-character
removal, export the empty V10 DM file, reload, and import it again. The empty
inventory reopens cleanly with Add Item disabled until a holder is added.
