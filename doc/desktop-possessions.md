# Possessions and Banking

Possessions records physical custody. Banking records financial history. They are
independent: manual money edits do not automatically create financial transactions,
and copying a session inventory does not rewrite earlier snapshots. See the
[desktop guide](desktop.md) for importing, version history and saving.

## Items, containers and storage

**+ Storage** creates a named location with optional private notes. Select its tab
to inspect value and container warnings; open its name summary to rename or remove
it. A nonempty location must be emptied before removal. Locations have no strength,
movement or carrying limit. Chests and bags are still inventory items with their
usual weight, capacity and magical properties.

In an item editor, **Held by** moves the item and its complete nested subtree to a
character or storage location, preserving IDs and metadata. The root starts loose.
**Stored in** then chooses a valid destination container; no container is selected
automatically. Transfers move whole stacks. **All possessions** includes storage
value once and calculates carried loads from characters only.

Player exports contain a selected character's permitted information and exclude
storage and private notes. Export requires an actual character. Merging an older
player file cannot duplicate an item that has since moved to storage; moved-item
conflicts require review. DM inventories may contain zero characters, including
storage-only or entirely empty documents.

## Inventory membership

Select a character and open its editor to **Remove character**. Confirmation removes
that character's whole physical inventory, including containers, contents and money;
campaign mode first checkpoints the complete inventory. Roster membership, earlier
sessions and Banking history remain intact.

Campaign Possessions has its own **+ Character**. Choose an empty inventory (the
default) or copy the most recent inventory for a returning character. The secondary
source choice lists older inventories; use **Other inventory character** to browse
other holders deliberately. Copies retain holder/item
IDs, container structure, strength, notes and privacy fields, with a full source
checkpoint. Copying is refused if item IDs already exist elsewhere in the destination;
choose another source or start empty to avoid duplicating transferred gear.

For **+ Session → Current inventory**, the selected party profiles determine matching
inventory characters to carry. Storage carries independently. Matching uses unique
normalized names; ambiguous/unmatched holders appear under **Other inventory holders**
with explicit include/omit choices, initially included. Source and destination remain
independently editable.

## Banking transactions

**Opening balances** lists the selected session's inventory holders, including storage.
A holder matched to a roster character appears in their participating, eligible sessions.
Enter explicit zeros for known zero balances.

For **Income → Add to possessions**, **Day for new stacks** defaults to the number in
a session label such as `Day 6` or `Day6 — 2025-10-04`. Review or override it before
saving. For other labels, enter the acquisition day explicitly (zero is valid).
Credits to an existing stack keep its acquisition day.
Unrecorded balances remain unknown. Banking compares ledger balances with current
physical money. A net match does not prove every intermediate event was recorded.

Income, Payment, Transfer and Exchange offer two modes:

| Mode                            | Effect                                                         |
| ------------------------------- | -------------------------------------------------------------- |
| Ordinary transaction            | Updates the ledger and corresponding possessions together      |
| Already recorded in possessions | Updates only the ledger after a physical change made elsewhere |

Preview the balances, tender and remaining discrepancy before recording. Transfers,
exchanges and explicit fees retain their balance/value validations. Ledger-only
outgoing amounts use recorded balances; incoming quantities use existing stacks.
Partial reconciliation is allowed, but over-allocation is rejected. Use **Record
remaining difference as adjustment** only for a deliberate, reviewed adjustment.

A recorded transaction keeps its mode. Editing/deleting a ledger-only transaction
does not reverse physical changes. Corrections retain financial history and affect
derived later balances; they do not synchronize independent later inventory snapshots.
Repeated confirmation cannot post the same operation twice.

Removing a physical holder with a known zero balance and no discrepancy hides it
from current Banking balances. Nonzero or unresolved balances remain visible under
historical names. Their transactions remain accessible, and ledger-only transactions
can deliberately resolve an outgoing balance without recreating physical gear.

## Imports, restores and older records

Replacing inventory through import or historical restore requires an explicit money
comparison, preserves the displaced checkpoint, and leaves Banking unchanged. Review
any resulting discrepancy in Banking afterward.

Recorded financial adjustments retain their original effects. Manual inventory edits
do not generate new automatic adjustments. The obsolete, physical-only
`possessionsReconciliations` audit format is unsupported; it is absent from the
retained campaigns and is distinct from current Banking reconciliation.

XP treasure choices are also independent: Keep/Sell/Defer determines award inputs,
not a money transfer, inventory sale or change of custody. See [XP](desktop-xp.md).
