import type {
  EncumbranceDmDocumentV10,
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
