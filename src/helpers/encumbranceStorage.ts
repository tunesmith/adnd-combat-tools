import type {
  EncumbranceDmDocumentV10,
  EncumbranceDmCharacter,
  EncumbranceInventoryItem,
} from '../types/encumbrance';
import { getDescendantIds } from './encumbranceRules';
import { validateInventoryHolders } from './encumbranceDocument';

export function inventoryHolders(document: EncumbranceDmDocumentV10) {
  return [...document.characters, ...document.storageLocations];
}
export function updateHolderInventory(
  document: EncumbranceDmDocumentV10,
  holderId: string,
  update: (inventory: EncumbranceInventoryItem[]) => EncumbranceInventoryItem[]
): EncumbranceDmDocumentV10 {
  if (!inventoryHolders(document).some((h) => h.id === holderId))
    throw new Error('Inventory holder changed.');
  return {
    ...document,
    characters: document.characters.map((h) =>
      h.id === holderId ? { ...h, inventory: update(h.inventory) } : h
    ),
    storageLocations: document.storageLocations.map((h) =>
      h.id === holderId ? { ...h, inventory: update(h.inventory) } : h
    ),
  };
}
export function transferInventorySubtree(
  document: EncumbranceDmDocumentV10,
  itemId: string,
  sourceId: string,
  destinationId: string,
  containerId: string | null = null
): EncumbranceDmDocumentV10 {
  const source = inventoryHolders(document).find((h) => h.id === sourceId);
  const destination = inventoryHolders(document).find(
    (h) => h.id === destinationId
  );
  if (!source || !destination || !source.inventory.some((i) => i.id === itemId))
    throw new Error('Item or holder changed.');
  const ids = new Set([itemId, ...getDescendantIds(source.inventory, itemId)]);
  const moved = source.inventory
    .filter((i) => ids.has(i.id))
    .map((i) => ({
      ...i,
      containerId: i.id === itemId ? containerId : i.containerId,
    }));
  const removed = updateHolderInventory(document, sourceId, (items) =>
    items.filter((i) => !ids.has(i.id))
  );
  const next = updateHolderInventory(removed, destinationId, (items) => [
    ...items,
    ...moved,
  ]);
  validateInventoryHolders(inventoryHolders(next));
  return next;
}
export function removeStorageLocation(
  document: EncumbranceDmDocumentV10,
  id: string
): EncumbranceDmDocumentV10 {
  const location = document.storageLocations.find((s) => s.id === id);
  if (!location) throw new Error('Storage location changed.');
  if (location.inventory.length)
    throw new Error(
      'Move or remove all items before removing this storage location.'
    );
  return {
    ...document,
    storageLocations: document.storageLocations.filter((s) => s.id !== id),
    activeCharacterId:
      document.activeCharacterId === id
        ? document.characters[0]?.id || ''
        : document.activeCharacterId,
  };
}

export function removeInventoryCharacter(
  document: EncumbranceDmDocumentV10,
  id: string
): EncumbranceDmDocumentV10 {
  if (!document.characters.some((c) => c.id === id))
    throw Error('Inventory character changed.');
  const characters = document.characters.filter((c) => c.id !== id);
  const next = {
    ...document,
    characters,
    activeCharacterId:
      document.activeCharacterId === id
        ? characters[0]?.id ?? document.storageLocations[0]?.id ?? ''
        : document.activeCharacterId,
  };
  validateInventoryHolders(inventoryHolders(next));
  return next;
}
export function selectInventoryCharacters(
  document: EncumbranceDmDocumentV10,
  ids: readonly string[]
): EncumbranceDmDocumentV10 {
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !document.characters.some((c) => c.id === id))
  )
    throw Error('Inventory character choices changed.');
  const characters = document.characters.filter((c) => ids.includes(c.id));
  return {
    ...document,
    characters,
    activeCharacterId: [...characters, ...document.storageLocations].some(
      (h) => h.id === document.activeCharacterId
    )
      ? document.activeCharacterId
      : characters[0]?.id ?? document.storageLocations[0]?.id ?? '',
  };
}

export type InventoryFieldEdit =
  | {
      kind: 'item';
      holderId: string;
      itemId: string;
      fields: Partial<
        Omit<EncumbranceInventoryItem, 'id' | 'catalogId' | 'customItem'>
      >;
    }
  | {
      kind: 'character';
      holderId: string;
      fields: Partial<
        Pick<EncumbranceDmCharacter, 'name' | 'strength' | 'dmNotes'>
      >;
    };

/** Apply only the fields the user edited, against the current holder and item. */
export function applyInventoryFields(
  doc: EncumbranceDmDocumentV10,
  edit: InventoryFieldEdit
): EncumbranceDmDocumentV10 {
  if (edit.kind === 'item') {
    return updateHolderInventory(doc, edit.holderId, (items) => {
      if (!items.some((i) => i.id === edit.itemId))
        throw Error(
          'Inventory item moved or was removed. Reopen the item editor.'
        );
      return items.map((i) =>
        i.id === edit.itemId ? { ...i, ...edit.fields } : i
      );
    });
  }
  if (!doc.characters.some((c) => c.id === edit.holderId))
    throw Error(
      'Inventory character was removed. Reopen the character editor.'
    );
  return {
    ...doc,
    characters: doc.characters.map((c) =>
      c.id === edit.holderId ? { ...c, ...edit.fields } : c
    ),
  };
}
