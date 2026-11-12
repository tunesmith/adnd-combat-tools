import { bankingReplacementReview } from '../helpers/campaignBanking';
import baseline from './fixtures/campaignSnapshots.json';
import { storageInventory } from './fixtures/storageInventory';
import {
  inventoryHolders,
  transferInventorySubtree,
  removeStorageLocation,
} from '../helpers/encumbranceStorage';
import {
  parseEncumbranceDocument,
  stringifyEncumbranceDocument,
  redactEncumbranceDocument,
  buildPlayerMergePlan,
  applyPlayerMergePlan,
} from '../helpers/encumbranceDocument';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';
import {
  getTotalEncumbranceGp,
  getTotalValueGp,
  getContainerLoadSummary,
} from '../helpers/encumbranceRules';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  startWorkingInventory,
  captureInventoryCheckpoint,
  changeWorkingInventory,
} from '../helpers/campaignWorkingInventory';
import {
  sessionFingerprint,
  startNextSession,
} from '../helpers/campaignContinuity';
import { interpretSource } from '../helpers/campaignSnapshots';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing synthetic fixture');
  return value;
}
const at = '2026-11-07T12:00:00.000Z';
const catalog = (doc: ReturnType<typeof storageInventory>) =>
  new Map([
    ...Array.from(encumbranceCatalogById.entries()),
    ...inventoryHolders(doc).flatMap((h) =>
      h.inventory.flatMap((i) =>
        i.customItem ? [[i.catalogId, i.customItem] as const] : []
      )
    ),
  ]);
const value = (doc: ReturnType<typeof storageInventory>) =>
  inventoryHolders(doc).reduce(
    (sum, h) => sum + getTotalValueGp(h, catalog(doc)),
    0
  );
test('storage chest preserves nested capacity, values and metadata, without any PC carried load', () => {
  const stored = storageInventory();
  const definitions = catalog(stored);
  const originalItems = stored.storageLocations[0]?.inventory;
  if (!originalItems) throw new Error('Missing stock');
  expect(
    stored.characters.every((c) => getTotalEncumbranceGp(c, definitions) === 0)
  ).toBe(true);
  expect(
    getContainerLoadSummary('case', originalItems, definitions)
  ).toMatchObject({ used: 32, capacity: 100, isOverCapacity: false });
  const held = transferInventorySubtree(
    stored,
    'pack',
    'castle',
    'synthetic-tal'
  );
  expect(getTotalEncumbranceGp(required(held.characters[1]), definitions)).toBe(
    48
  );
  expect(held.characters[1]?.inventory).toEqual(originalItems);
  expect(value(held)).toBe(value(stored));
  expect(stored.storageLocations[0]?.inventory).toEqual(originalItems);
  // Move a coin lot directly into another holder's inner container and back to loose stock.
  const bag = transferInventorySubtree(
    held,
    'case',
    'synthetic-tal',
    'synthetic-mira'
  );
  const separate = transferInventorySubtree(
    bag,
    'gold-lot',
    'synthetic-mira',
    'synthetic-tal',
    'pack'
  );
  expect(
    separate.characters[1]?.inventory.find((i) => i.id === 'gold-lot')
      ?.containerId
  ).toBe('pack');
  const back = transferInventorySubtree(
    separate,
    'gold-lot',
    'synthetic-tal',
    'castle'
  );
  expect(
    back.storageLocations[0]?.inventory.find((i) => i.id === 'gold-lot')
  ).toEqual({
    ...originalItems.find((i) => i.id === 'gold-lot'),
    containerId: null,
  });
  expect(value(back)).toBe(value(stored));
  expect(
    new Set(inventoryHolders(back).flatMap((h) => h.inventory.map((i) => i.id)))
      .size
  ).toBe(5);
  expect(parseEncumbranceDocument(stringifyEncumbranceDocument(back))).toEqual(
    back
  );
});
test('holder identity, ancestry, nonempty removal and future document versions are protected', () => {
  const doc = storageInventory();
  expect(() => removeStorageLocation(doc, 'castle')).toThrow(
    'Move or remove all items'
  );
  expect(() =>
    transferInventorySubtree(doc, 'pack', 'castle', 'castle', 'case')
  ).toThrow('container');
  expect(() =>
    transferInventorySubtree(doc, 'pack', 'castle', 'synthetic-tal', 'case')
  ).toThrow('container');
  expect(() =>
    transferInventorySubtree(doc, 'gold-lot', 'castle', 'castle', 'scroll')
  ).toThrow('container');
  const duplicate: typeof doc = JSON.parse(JSON.stringify(doc));
  required(duplicate.characters[0]).inventory.push({
    ...required(required(doc.storageLocations[0]).inventory[0]),
    containerId: null,
  });
  expect(() => parseEncumbranceDocument(JSON.stringify(duplicate))).toThrow(
    'Duplicate item'
  );
  expect(() =>
    parseEncumbranceDocument(JSON.stringify({ ...doc, version: 11 }))
  ).toThrow('supported');
  const emptied = transferInventorySubtree(
    doc,
    'pack',
    'castle',
    'synthetic-tal'
  );
  expect(removeStorageLocation(emptied, 'castle').storageLocations).toEqual([]);
});
test('player redaction and both edited/deleted moved-item merge conflicts preserve stored copies exactly', () => {
  let carried = transferInventorySubtree(
    storageInventory(),
    'pack',
    'castle',
    'synthetic-mira'
  );
  const player = redactEncumbranceDocument(carried, 'synthetic-mira');
  expect(player.version).toBe(9);
  expect(JSON.stringify(player)).not.toMatch(
    /storageLocations|castle notes|Synthetic private evidence/
  );
  carried = transferInventorySubtree(
    carried,
    'pack',
    'synthetic-mira',
    'castle'
  );
  required(player.character.inventory[2]).quantity = 99;
  const plan = buildPlayerMergePlan(carried, player);
  expect(
    plan.items.some(
      (i) =>
        i.kind === 'issue' && i.message.includes('stored at Synthetic Castle')
    )
  ).toBe(true);
  const result = applyPlayerMergePlan(carried, plan);
  expect(result).toEqual(carried);
  player.character.inventory = [];
  expect(
    buildPlayerMergePlan(carried, player).items.filter(
      (i) => i.kind === 'issue'
    )
  ).toHaveLength(5);
  expect(
    applyPlayerMergePlan(carried, buildPlayerMergePlan(carried, player))
  ).toEqual(carried);
  // A stale plan made before transfer cannot resurrect an added row at a new holder.
  const fresh = redactEncumbranceDocument(carried, 'synthetic-tal');
  fresh.character.inventory.push({
    ...required(required(storageInventory().storageLocations[0]).inventory[4]),
    containerId: null,
  });
  expect(
    applyPlayerMergePlan(carried, buildPlayerMergePlan(carried, fresh))
  ).toEqual({ ...carried, activeCharacterId: 'synthetic-tal' });
});
test('current campaigns preserve V9 evidence and checkpoints alongside V10 working inventory', () => {
  const oldInventory = required(
    required(baseline.records[1]).revisions[0]
  ).payload;
  const old = {
    ...parseCampaign(JSON.stringify(baseline)),
    workingInventories: [
      {
        id: 'working',
        sessionId: 'session-1',
        title: 'Possessions',
        document: { ...oldInventory, version: 10, storageLocations: [] },
        origin: { kind: 'empty' },
      },
    ],
    inventoryCheckpoints: [
      {
        id: 'historic',
        workingId: 'working',
        sessionId: 'session-1',
        label: 'Original',
        capturedAt: at,
        document: oldInventory,
      },
    ],
  };
  const migrated = parseCampaign(JSON.stringify(old));
  expect(migrated.schemaVersion).toBe(21);
  expect(migrated.records).toEqual(baseline.records);
  expect(migrated.inventoryCheckpoints[0]?.document).toEqual(oldInventory);
  expect(migrated.workingInventories[0]?.document).toEqual({
    ...oldInventory,
    version: 10,
    storageLocations: [],
  });
  expect(
    interpretSource(
      'inventory-json',
      required(required(baseline.records[1]).revisions[0]).sourceText
    ).payload
  ).toEqual(oldInventory);
});
test('storage checkpoints, restore, save/reopen and explicit session carry remain independent', () => {
  let campaign = startWorkingInventory(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    storageInventory(),
    { kind: 'empty' },
    'working',
    'unused',
    at
  );
  campaign = captureInventoryCheckpoint(
    campaign,
    'working',
    'Castle stock',
    'checkpoint',
    at
  );
  const historical = JSON.stringify(campaign.inventoryCheckpoints);
  const carried = startNextSession(campaign, {
    campaignId: campaign.id,
    sourceSessionId: 'session-1',
    sourceFingerprint: sessionFingerprint(campaign, 'session-1'),
    destinationId: 'session-2',
    label: 'Second',
    combats: [],
    inventory: {
      sourceId: 'working',
      instanceId: 'working-next',
      checkpointId: 'before-next',
    },
    copyNotes: false,
    capturedAt: at,
  });
  const edited = changeWorkingInventory(
    carried,
    'working-next',
    'session-2',
    transferInventorySubtree(
      storageInventory(),
      'pack',
      'castle',
      'synthetic-tal'
    )
  );
  const reopened = parseCampaign(serializeCampaign(edited));
  expect(reopened.workingInventories[0]?.document).toEqual(storageInventory());
  expect(
    reopened.workingInventories[1]?.document.characters[1]?.inventory
  ).toHaveLength(5);
  expect(JSON.stringify(reopened.inventoryCheckpoints.slice(0, 1))).toBe(
    historical
  );
  const restored = startWorkingInventory(
    reopened,
    'session-2',
    required(reopened.inventoryCheckpoints[0]).document,
    { kind: 'checkpoint', checkpointId: 'checkpoint' },
    'restored',
    'before-restore',
    at,
    bankingReplacementReview(
      reopened,
      'session-2',
      required(reopened.inventoryCheckpoints[0]).document
    ).fingerprint
  );
  expect(
    restored.workingInventories.find((w) => w.id === 'restored')?.document
  ).toEqual(storageInventory());
  expect(restored.records).toEqual(baseline.records);
});
