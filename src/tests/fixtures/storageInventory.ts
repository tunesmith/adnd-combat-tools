import { syntheticInventory } from './campaignB1';
import { transferInventorySubtree } from '../../helpers/encumbranceStorage';
import type {
  EncumbranceDmDocumentV10,
  EncumbranceInventoryItem,
} from '../../types/encumbrance';
/** Invented castle stock. No campaign evidence or personal data. */
export function storageInventory(): EncumbranceDmDocumentV10 {
  const doc = syntheticInventory();
  const holder = doc.characters[0];
  if (!holder) throw new Error('Missing synthetic character');
  const chest = holder.inventory[0];
  if (!chest) throw new Error('Missing chest');
  chest.name = 'Invisible chest';
  const details = {
    day: 2,
    playerNotes: 'Invented castle stock',
    playerKnowsValue: true,
    playerMagicKnowledge: 'known-magical' as const,
    dmNotes: 'Synthetic private evidence',
    isMagical: true,
    fullyIdentified: true,
  };
  const coins: EncumbranceInventoryItem = {
    ...details,
    id: 'gold-lot',
    catalogId: 'gold-piece',
    quantity: 30,
    containerId: 'case',
    customItem: {
      id: 'gold-piece',
      name: 'Gold lot',
      category: 'coins',
      encumbranceGp: 1,
      valueGp: 1,
    },
  };
  const scroll: EncumbranceInventoryItem = {
    ...details,
    id: 'scroll',
    catalogId: 'test-scroll',
    name: 'Identified scroll',
    quantity: 1,
    containerId: 'pack',
    valueGpOverride: 100,
    customItem: {
      id: 'test-scroll',
      name: 'Scroll',
      category: 'treasure',
      encumbranceGp: 1,
      valueGp: 50,
    },
  };
  holder.inventory.push(coins, scroll);
  doc.storageLocations.push({
    id: 'castle',
    name: 'Synthetic Castle',
    notes: 'DM-only castle notes',
    inventory: [],
  });
  return transferInventorySubtree(doc, 'pack', holder.id, 'castle');
}
