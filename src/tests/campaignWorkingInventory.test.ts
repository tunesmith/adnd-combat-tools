import baseline from './fixtures/campaignB1V2.json';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  captureInventoryCheckpoint,
  changeWorkingInventory,
  emptyWorkingInventory,
  startWorkingInventory,
} from '../helpers/campaignWorkingInventory';
import { syntheticInventory } from './fixtures/campaignB1';
const at = '2026-11-04T12:00:00.000Z';
function setup() {
  const doc = parseCampaign(JSON.stringify(baseline));
  return startWorkingInventory(
    doc,
    'session-1',
    syntheticInventory(),
    { kind: 'import', recordId: 'inventory-1', revisionId: 'inventory-r1' },
    'working-1',
    'unused',
    at
  );
}
test('V2 migration retains every B1 record, source, identity and metadata', () => {
  const doc = parseCampaign(JSON.stringify(baseline));
  expect(doc.schemaVersion).toBe(16);
  expect(doc.records).toEqual(baseline.records);
  expect(doc.sessions).toEqual(
    baseline.sessions.map((s) => ({ ...s, notes: '' }))
  );
  expect(doc.id).toBe(baseline.id);
  expect(doc.workingInventories).toEqual([]);
});
test('working edits and checkpoints round-trip independently from immutable imports', () => {
  const doc = setup();
  const original = JSON.stringify(doc.records);
  const inventory = syntheticInventory();
  const item = inventory.characters[0]?.inventory[2];
  if (!item) throw new Error('Missing fixture');
  item.quantity = 7;
  item.dmNotes = 'Working note';
  const edited = changeWorkingInventory(
    doc,
    'working-1',
    'session-1',
    inventory
  );
  expect(edited.inventoryCheckpoints).toHaveLength(0);
  const checkpoint = captureInventoryCheckpoint(
    edited,
    'working-1',
    'Before camp',
    'check-1',
    at
  );
  item.quantity = 9;
  const later = changeWorkingInventory(
    checkpoint,
    'working-1',
    'session-1',
    inventory
  );
  const reopened = parseCampaign(serializeCampaign(later));
  expect(
    reopened.workingInventories[0]?.document.characters[0]?.inventory[2]
      ?.quantity
  ).toBe(9);
  expect(
    reopened.inventoryCheckpoints[0]?.document.characters[0]?.inventory[2]
      ?.quantity
  ).toBe(7);
  expect(JSON.stringify(reopened.records)).toBe(original);
});
test('replacing working state checkpoints the work being replaced and uses a new identity', () => {
  const doc = setup();
  const replaced = startWorkingInventory(
    doc,
    'session-1',
    emptyWorkingInventory(),
    { kind: 'empty' },
    'working-2',
    'before-restore',
    at
  );
  expect(replaced.inventoryCheckpoints[0]?.document).toEqual(
    doc.workingInventories[0]?.document
  );
  expect(replaced.workingInventories[0]?.id).toBe('working-2');
  expect(() =>
    changeWorkingInventory(
      replaced,
      'working-1',
      'session-1',
      syntheticInventory()
    )
  ).toThrow('cancelled');
});
test('sessions have independent working inventories; no implicit carry-forward', () => {
  const doc = setup();
  doc.sessions.push({ id: 'session-2', label: 'Next session' });
  const next = startWorkingInventory(
    doc,
    'session-2',
    emptyWorkingInventory(),
    { kind: 'empty' },
    'working-2',
    'unused',
    at
  );
  expect(next.workingInventories).toHaveLength(2);
  expect(next.workingInventories[0]).toEqual(doc.workingInventories[0]);
  expect(next.workingInventories[1]?.document.characters[0]?.inventory).toEqual(
    []
  );
});
test('invalid session and inventory references are rejected on reopen', () => {
  const doc = setup();
  const working = doc.workingInventories[0];
  if (!working) throw new Error('Missing fixture');
  working.sessionId = 'missing';
  expect(() => parseCampaign(JSON.stringify(doc))).toThrow();
});

test('ambiguous item IDs across owners are rejected for working transfers', () => {
  const doc = setup();
  const inventory = syntheticInventory();
  const a = inventory.characters[0],
    b = inventory.characters[1];
  if (!a || !b) throw new Error('Missing fixture');
  b.inventory = JSON.parse(JSON.stringify(a.inventory));
  expect(() =>
    changeWorkingInventory(doc, 'working-1', 'session-1', inventory)
  ).toThrow('Duplicate item ID');
});
