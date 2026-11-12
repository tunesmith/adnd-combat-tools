import { syntheticInventory } from './fixtures/campaignB1';
import {
  parseEncumbranceDocument,
  stringifyEncumbranceDocument,
} from '../helpers/encumbranceDocument';
import { getInventoryItemTotalValueGp } from '../helpers/encumbranceRules';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';

test('saved catalog lanterns use 7 gp while explicit overrides survive reopening', () => {
  const doc = syntheticInventory();
  const holder = doc.characters[0];
  const item = holder?.inventory[0];
  if (!holder || !item) throw Error('Fixture');
  holder.inventory = [undefined, 7, 0, 12].map((valueGpOverride, i) => ({
    ...item,
    id: 'lantern-' + i,
    catalogId: 'lantern',
    customItem: undefined,
    quantity: 1,
    containerId: null,
    valueGpOverride,
  }));
  const reopened = parseEncumbranceDocument(stringifyEncumbranceDocument(doc));
  if (reopened.kind !== 'adnd-encumbrance-dm') throw Error('Fixture');
  const inventory = reopened.characters[0]?.inventory ?? [];
  expect(
    inventory.map((i) =>
      getInventoryItemTotalValueGp(i.id, inventory, encumbranceCatalogById)
    )
  ).toEqual([7, 7, 0, 12]);
  expect(inventory.map((i) => i.valueGpOverride)).toEqual([
    undefined,
    7,
    0,
    12,
  ]);
});
