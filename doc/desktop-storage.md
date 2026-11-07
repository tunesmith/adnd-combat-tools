# Storage locations and quiet saves

Possessions supports characters and storage locations in the same shared desktop/web editor. Use **+ Storage**, enter a name and optional private notes, then select that location in the Storage group. Click its name summary to rename it or remove it. Locations with contents cannot be removed until their items have been moved or removed.

A location has no strength, movement or carrying limit. Chests, bags and other physical containers remain inventory items with their existing weight, value, capacity and magical properties. The location view shows value and container warnings. **All possessions** includes storage, labels those rows with the full location name, counts value once, and reports carried load from characters only.

In an item's editor, **Held by** chooses a character or a storage location. This moves that item and its entire nested subtree to the destination, retaining IDs and metadata. The transferred root starts loose. **Stored in** then offers valid containers at that destination, with the usual capacity warnings. No container is chosen automatically. Transfers move whole stacks.

## Persistence and compatibility

- DM inventory V10 adds `storageLocations`, with stable `id`, `name`, `notes`, and `inventory`. The existing `activeCharacterId` selector field can now select a character or a storage location. Storage is a distinct sibling collection, never a fake character or campaign profile.
- Older inventories open as V10 with empty storage and unchanged item/character IDs, custom definitions, values and knowledge flags. Player exports remain V9, contain only a selected character's permitted information, and exclude all storage/private notes. Player export controls are disabled while storage is selected.
- All holders share unique item/holder identities within one inventory instance. Container ancestry must remain within its holder and cannot be cyclic. A player file whose item has since moved to storage produces a merge issue, preserving the stored item. Applying a stale merge plan also cannot duplicate that item on the character.
- Campaign V9 upgrades editable working inventories to V10. Original source text, revisions, source/content hashes and historical inventory checkpoints retain their original values and versions. Normalizer 1's interpretation of older inventory sources stays frozen at V9. Read-only inspection and explicit restoration adapt them for the current editor. Duplicate matching accounts for equivalent V9/V10 inventories.
- Campaign Save, immediate queued edits, checkpoints/restores and explicit next-session inventory transfer include storage. Each session has independent working state. Later movement does not alter the previous session or its evidence. There is no live storage synchronization.
- Unsupported newer campaign/inventory versions are rejected. Older apps cannot edit the new schema safely. The standalone GitHub Pages DM tool uses the same model and controls.

## Save policy

Ordinary Save, repeated Save and confirmed Save As overwrite do not create or refresh `.bak`. The first save that actually upgrades an existing campaign's on-disk schema preserves the exact original bytes. It uses `<campaign>.bak`, or `<campaign>.upgrade-N.bak` if a recovery file already exists. No previous backup is overwritten or deleted. The decision uses the disk schema, not the already migrated editor document.

Writes still validate, stage and sync a same-directory temporary file, recheck disk identity, and replace atomically. New paths use exclusive creation. Failures that leave the editor draft and original destination safe clean up temporary files. Recovery-specific copy is confined to upgrades. Existing backups and collision-safe recovery siblings remain protected from source/inventory exports.

## Verification

Synthetic tests cover old-document migration, nested chest/coin/scroll transfers, capacity and value conservation, identity/ancestry rejection, nonempty removal, storage editing and immediate post-transfer edits, player privacy and moved-item conflicts, preserved old evidence/checkpoints, restore, and independent next-session copies. Native filesystem tests cover routine saves, Save As overwrite, exact upgrade backups, collisions, validation, injected failures, conflicts, cleanup and reopen. No live campaign or private sources are used.

Whole-stack transfers and manual inventory editing remain the scope. There is no financial ownership model, banking, XP accounting or character-profile synchronization.

The packaged-app walkthrough used an isolated application identity and a synthetic campaign. It verified rename/nonempty removal, nested chest transfer with immediate Save, 48 gp PC load versus zero while stored, explicit next-session copying, unchanged original checkpoint inspection, full Quit, Reopen last and the retained five-row subtree. Automated tests additionally exercise destination containers, player merges, restore and native failure/backup collision paths.
