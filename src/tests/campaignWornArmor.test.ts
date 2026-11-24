import {
  parseCampaign,
  serializeCampaign,
  type CampaignDocument,
} from '../helpers/campaignDocument';
import { emptyProfile } from '../helpers/campaignParty';
import { emptyProfileReference } from '../helpers/campaignPartyModel';
import { interpretSource } from '../helpers/campaignSnapshots';
import {
  parseEncumbranceDocument,
  redactEncumbranceDocument,
  stringifyEncumbranceDocument,
} from '../helpers/encumbranceDocument';
import {
  armorChoices,
  characterLoad,
  partyGear,
  wornArmorByHolder,
} from '../helpers/partyEncumbrance';
import type {
  EncumbranceDmDocumentV10,
  EncumbranceInventoryItem,
} from '../types/encumbrance';

const suit: EncumbranceInventoryItem = {
  id: 'suit',
  catalogId: 'custom-suit',
  quantity: 1,
  containerId: null,
  day: 11,
  playerNotes: 'Found below',
  dmNotes: 'Secret origin',
  playerKnowsValue: false,
  playerMagicKnowledge: 'known-magical',
  isMagical: true,
  fullyIdentified: true,
  encumbranceGpOverride: 450,
  valueGpOverride: 5000,
  customItem: {
    id: 'custom-suit',
    name: 'Unhelpful inventory label',
    category: 'treasure',
    encumbranceGp: 0,
    valueGp: 0,
  },
};

function fixture(item = suit, selectedId = 'suit'): CampaignDocument {
  const inventory: EncumbranceDmDocumentV10 = {
    kind: 'adnd-encumbrance-dm',
    version: 10,
    activeCharacterId: 'holder',
    characters: [
      {
        id: 'holder',
        name: '  Rider  ',
        strength: { score: 8, exceptional: 'none' },
        dmNotes: '',
        inventory: [item],
      },
    ],
    storageLocations: [],
  };
  const checkpoint = JSON.parse(
    JSON.stringify(inventory)
  ) as EncumbranceDmDocumentV10;
  return {
    kind: 'adnd-campaign',
    schemaVersion: 21,
    sessionMetadataVersion: 1,
    id: 'campaign',
    title: 'Campaign',
    notes: '',
    sessions: [{ id: 'session', label: 'Session', sessionNumber: 1 }],
    party: {
      roster: [{ id: 'rider', name: 'Rider', player: '', notes: '' }],
      profiles: [
        {
          ...emptyProfile('session', 'rider'),
          reference: {
            ...emptyProfileReference(),
            wornArmor: { itemId: selectedId, type: 'plate' },
          },
        },
      ],
    },
    records: [],
    workingInventories: [
      {
        id: 'working',
        sessionId: 'session',
        title: 'Working inventory',
        document: inventory,
        origin: { kind: 'empty' },
      },
    ],
    inventoryCheckpoints: [
      {
        id: 'checkpoint',
        workingId: 'working',
        sessionId: 'session',
        label: 'Earlier gear',
        capturedAt: '2025-11-07T00:00:00Z',
        document: checkpoint,
      },
    ],
    workingCombats: [],
    combatCheckpoints: [],
    workspace: { sessionId: 'session', view: 'session' },
  };
}

function wornState(doc: CampaignDocument) {
  const profile = doc.party?.profiles[0];
  const inventory = doc.workingInventories[0]?.document;
  const holder = partyGear(doc, 'session').holders.get('rider');
  const item = holder?.inventory[0];
  if (!profile || !holder || !inventory || inventory.version !== 10 || !item)
    throw new Error('Incomplete test inventory.');
  return { profile, holder, inventory, item };
}

test('moves an explicit legacy classification to the linked working item only', () => {
  const before = fixture();
  const text = serializeCampaign(before);
  expect(wornState(parseCampaign(text, 'edit')).item.customItem).toEqual(
    suit.customItem
  );
  const migrated = parseCampaign(text);
  const { item, holder, profile, inventory } = wornState(migrated);
  expect(item).toEqual({
    ...suit,
    customItem: {
      ...suit.customItem,
      category: 'armor',
      bodyArmorType: 'plate',
    },
  });
  expect(profile.reference?.wornArmor).toEqual({ itemId: 'suit' });
  expect(migrated.inventoryCheckpoints).toEqual(before.inventoryCheckpoints);
  expect(characterLoad(profile, holder)).toMatchObject({
    load: 0,
    armorName: 'Plate (magic)',
    armorMove: 12,
    finalMove: '12″',
  });
  expect(wornArmorByHolder(migrated, 'session').get(holder.id)).toBe('suit');
  expect(parseCampaign(serializeCampaign(migrated))).toEqual(migrated);

  const standalone = stringifyEncumbranceDocument(inventory);
  expect(parseEncumbranceDocument(standalone)).toEqual(inventory);
  expect(interpretSource('inventory-json', standalone).payload).toEqual(
    inventory
  );
  const player = redactEncumbranceDocument(inventory);
  expect(player.character.inventory[0]).toMatchObject({
    customItem: { category: 'armor', bodyArmorType: 'plate' },
  });
  expect(player.character.inventory[0]).not.toHaveProperty('dmNotes');
  expect(player.character.inventory[0]).not.toHaveProperty('isMagical');
});

test('uses existing item and catalog types ahead of the old profile type', () => {
  const { customItem, ...catalogSuit } = suit;
  if (!customItem) throw new Error('Missing armor definition.');
  const existing = fixture({
    ...suit,
    customItem: { ...customItem, category: 'armor', bodyArmorType: 'ring' },
  });
  const fromItem = wornState(parseCampaign(serializeCampaign(existing)));
  expect(fromItem.profile.reference?.wornArmor).toEqual({ itemId: 'suit' });
  expect(characterLoad(fromItem.profile, fromItem.holder)?.armorName).toBe(
    'Ring (magic)'
  );

  const catalog = fixture({ ...catalogSuit, catalogId: 'armor-chain' });
  const fromCatalog = wornState(parseCampaign(serializeCampaign(catalog)));
  expect(fromCatalog.profile.reference?.wornArmor).toEqual({ itemId: 'suit' });
  expect(
    characterLoad(fromCatalog.profile, fromCatalog.holder)?.armorName
  ).toBe('Chain (magic)');
});

test('an unmatched profile link stays reviewable and does not classify a different item', () => {
  const doc = parseCampaign(serializeCampaign(fixture(suit, 'missing')));
  const { item, holder, profile } = wornState(doc);
  expect(profile.reference?.wornArmor?.itemId).toBe('missing');
  expect(item).toEqual(suit);
  expect(armorChoices(holder)).toEqual([]);
  expect(characterLoad(profile, holder)).toMatchObject({
    load: 450,
    armorName: 'Unknown',
    finalMove: undefined,
  });
  expect(parseCampaign(serializeCampaign(doc))).toEqual(doc);
});
