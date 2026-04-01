import {
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
  redactEncumbranceDocument,
  stringifyEncumbranceDocument,
} from '../helpers/encumbranceDocument';

describe('encumbrance document helpers', () => {
  test('creates an empty DM party document by default', () => {
    const document = createEmptyEncumbranceDocument();

    expect(document.kind).toBe('adnd-encumbrance-dm');
    expect(document.version).toBe(8);
    expect('customItems' in document).toBe(false);

    if (document.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Expected a DM document.');
    }

    expect(document.characters).toHaveLength(1);
    expect(document.activeCharacterId).toBe(document.characters[0]?.id);
    expect(document.characters[0]?.name).toBe('');
    expect(document.characters[0]?.strength.score).toBe(8);
    expect(document.characters[0]?.dmNotes).toBe('');
  });

  test('redacts DM-only fields while preserving inline custom item data', () => {
    const document = createEmptyEncumbranceDocument();

    if (document.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Expected a DM document.');
    }

    const primaryCharacter = document.characters[0];
    if (!primaryCharacter) {
      throw new Error('Expected a primary character.');
    }

    primaryCharacter.name = 'Falstaff';
    primaryCharacter.dmNotes = 'The ring is cursed.';
    primaryCharacter.inventory.push({
      id: 'item-1',
      catalogId: 'custom-bag-of-holding',
      quantity: 1,
      containerId: null,
      day: 84,
      playerNotes: 'Worn and patched.',
      playerKnowsValue: false,
      name: 'Field pack',
      dmNotes: 'Actually an extradimensional satchel.',
      playerMagicKnowledge: 'known-magical',
      isMagical: true,
      fullyIdentified: true,
      encumbranceGpOverride: 18,
      customItem: {
        id: 'custom-bag-of-holding',
        name: 'Backpack of Holding',
        category: 'containers',
        encumbranceGp: 150,
        valueGp: 25000,
        isContainer: true,
        capacityGp: 5000,
        ignoresContentsWeightForEncumbrance: true,
      },
    });

    const redacted = redactEncumbranceDocument(document, primaryCharacter.id);

    expect(redacted.kind).toBe('adnd-encumbrance-player');
    expect(redacted.version).toBe(8);
    expect(redacted.character.id).toBe(primaryCharacter.id);
    expect(redacted.character.inventory).toHaveLength(1);
    expect(redacted.character.inventory[0]?.dmNotes).toBeUndefined();
    expect(redacted.character.inventory[0]?.isMagical).toBeUndefined();
    expect(redacted.character.inventory[0]?.fullyIdentified).toBeUndefined();
    expect(redacted.character.inventory[0]?.customItem?.name).toBe(
      'Backpack of Holding'
    );
    expect(
      redacted.character.inventory[0]?.customItem
        ?.ignoresContentsWeightForEncumbrance
    ).toBe(true);
    expect('customItems' in redacted).toBe(false);
  });

  test('parses and migrates a legacy player document', () => {
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        kind: 'adnd-encumbrance-player',
        version: 1,
        character: {
          name: 'Alya',
          strength: {
            score: 18,
            exceptional: '51-75',
          },
        },
        inventory: [
          {
            id: 'item-1',
            catalogId: 'coin-gold',
            quantity: 87,
            containerId: null,
          },
        ],
      })
    );

    expect(parsed.kind).toBe('adnd-encumbrance-player');
    expect(parsed.version).toBe(8);
    expect('customItems' in parsed).toBe(false);

    if (parsed.kind !== 'adnd-encumbrance-player') {
      throw new Error('Expected a player document.');
    }

    expect(parsed.character.name).toBe('Alya');
    expect(parsed.character.strength.exceptional).toBe('51-75');
    expect(parsed.character.inventory[0]?.quantity).toBe(87);
    expect(parsed.character.inventory[0]?.day).toBe(0);
    expect(parsed.character.inventory[0]?.playerNotes).toBe('');
    expect(parsed.character.inventory[0]?.playerKnowsValue).toBe(true);
    expect(parsed.character.inventory[0]?.playerMagicKnowledge).toBe('unknown');
    expect(parsed.character.inventory[0]?.customItem).toBeUndefined();
  });

  test('parses a legacy DM document and inlines custom item definitions onto rows', () => {
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        kind: 'adnd-encumbrance-dm',
        version: 7,
        activeCharacterId: 'character-1',
        characters: [
          {
            id: 'character-1',
            name: 'Marda',
            strength: {
              score: 16,
              exceptional: 'none',
            },
            dmNotes: 'Secret note.',
            inventory: [
              {
                id: 'item-1',
                catalogId: 'custom-charm',
                quantity: 1,
                containerId: null,
                day: 23,
                playerNotes: 'Packed for travel.',
                playerKnowsValue: false,
                name: 'Travel charm',
                dmNotes: 'False-bottom compartment.',
                playerMagicKnowledge: 'unknown',
                isMagical: true,
                fullyIdentified: true,
                encumbranceGpOverride: 17,
              },
            ],
          },
        ],
        customItems: [
          {
            id: 'custom-charm',
            name: 'Charm',
            category: 'treasure',
            encumbranceGp: 1,
            valueGp: 75,
          },
        ],
      })
    );

    expect(parsed.kind).toBe('adnd-encumbrance-dm');
    expect(parsed.version).toBe(8);
    expect('customItems' in parsed).toBe(false);

    if (parsed.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Expected a DM document.');
    }

    const item = parsed.characters[0]?.inventory[0];
    expect(parsed.characters[0]?.dmNotes).toBe('Secret note.');
    expect(item?.name).toBe('Travel charm');
    expect(item?.customItem?.id).toBe('custom-charm');
    expect(item?.customItem?.name).toBe('Charm');
    expect(item?.customItem?.valueGp).toBe(75);
    expect(item?.customItem?.category).toBe('treasure');
  });

  test('normalizes legacy custom item categories when they are inlined', () => {
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        kind: 'adnd-encumbrance-player',
        version: 6,
        character: {
          name: 'Alya',
          strength: {
            score: 12,
            exceptional: 'none',
          },
        },
        inventory: [
          {
            id: 'item-1',
            catalogId: 'custom-weapon',
            quantity: 1,
            containerId: null,
            day: 0,
            playerNotes: '',
            playerKnowsValue: true,
            playerMagicKnowledge: 'unknown',
          },
          {
            id: 'item-2',
            catalogId: 'custom-kit',
            quantity: 1,
            containerId: null,
            day: 0,
            playerNotes: '',
            playerKnowsValue: true,
            playerMagicKnowledge: 'unknown',
          },
        ],
        customItems: [
          {
            id: 'custom-weapon',
            name: 'Odd blade',
            category: 'weapons',
            encumbranceGp: 10,
            valueGp: 5,
          },
          {
            id: 'custom-kit',
            name: 'Odd kit',
            category: 'gear',
            encumbranceGp: 3,
            valueGp: 2,
          },
        ],
      })
    );

    if (parsed.kind !== 'adnd-encumbrance-player') {
      throw new Error('Expected a player document.');
    }

    expect(parsed.character.inventory[0]?.customItem?.category).toBe('arms');
    expect(parsed.character.inventory[1]?.customItem?.category).toBe(
      'adventuring-gear'
    );
  });

  test('preserves special encumbrance rules on inline custom containers', () => {
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        kind: 'adnd-encumbrance-player',
        version: 7,
        character: {
          id: 'character-1',
          name: 'Alya',
          strength: {
            score: 12,
            exceptional: 'none',
          },
          inventory: [
            {
              id: 'item-1',
              catalogId: 'custom-bag-of-holding',
              quantity: 1,
              containerId: null,
              day: 0,
              playerNotes: '',
              playerKnowsValue: false,
              playerMagicKnowledge: 'known-magical',
            },
          ],
        },
        customItems: [
          {
            id: 'custom-bag-of-holding',
            name: 'Backpack of Holding',
            category: 'containers',
            encumbranceGp: 150,
            valueGp: 25000,
            isContainer: true,
            capacityGp: 5000,
            ignoresContentsWeightForEncumbrance: true,
          },
        ],
      })
    );

    if (parsed.kind !== 'adnd-encumbrance-player') {
      throw new Error('Expected a player document.');
    }

    expect(
      parsed.character.inventory[0]?.customItem
        ?.ignoresContentsWeightForEncumbrance
    ).toBe(true);
  });

  test('rebuilds placeholder inline custom items for missing custom references on load', () => {
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        kind: 'adnd-encumbrance-dm',
        version: 7,
        activeCharacterId: 'character-1',
        characters: [
          {
            id: 'character-1',
            name: 'Alya',
            strength: {
              score: 12,
              exceptional: 'none',
            },
            dmNotes: '',
            inventory: [
              {
                id: 'item-1',
                catalogId:
                  'custom-ring-of-free-action-25ba5aac-75ef-436e-86c9-4ac505186e99',
                quantity: 1,
                containerId: null,
                day: 25,
                playerNotes: '',
                playerKnowsValue: false,
                playerMagicKnowledge: 'known-magical',
              },
              {
                id: 'item-2',
                catalogId:
                  'custom-mysterious-satchel-11111111-2222-3333-4444-555555555555',
                quantity: 1,
                containerId: null,
                day: 40,
                playerNotes: '',
                playerKnowsValue: true,
                playerMagicKnowledge: 'unknown',
              },
              {
                id: 'item-3',
                catalogId: 'coin-gold',
                quantity: 10,
                containerId: 'item-2',
                day: 40,
                playerNotes: '',
                playerKnowsValue: true,
                playerMagicKnowledge: 'unknown',
              },
            ],
          },
        ],
        customItems: [],
      })
    );

    if (parsed.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Expected a DM document.');
    }

    const recoveredRing = parsed.characters[0]?.inventory.find(
      (item) => item.id === 'item-1'
    )?.customItem;
    const recoveredSatchel = parsed.characters[0]?.inventory.find(
      (item) => item.id === 'item-2'
    )?.customItem;

    expect(recoveredRing?.name).toBe('Ring Of Free Action');
    expect(recoveredRing?.category).toBe('treasure');
    expect(recoveredRing?.valueGp).toBe(0);
    expect(recoveredSatchel?.name).toBe('Mysterious Satchel');
    expect(recoveredSatchel?.category).toBe('containers');
    expect(recoveredSatchel?.isContainer).toBe(true);
  });

  test('parses current documents with row-level value overrides', () => {
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        kind: 'adnd-encumbrance-dm',
        version: 8,
        activeCharacterId: 'character-1',
        characters: [
          {
            id: 'character-1',
            name: 'Alya',
            strength: {
              score: 12,
              exceptional: 'none',
            },
            dmNotes: '',
            inventory: [
              {
                id: 'item-1',
                catalogId: 'coin-gold',
                quantity: 10,
                containerId: null,
                day: 40,
                playerNotes: '',
                playerKnowsValue: true,
                valueGpOverride: 2,
                playerMagicKnowledge: 'unknown',
              },
            ],
          },
        ],
      })
    );

    if (parsed.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Expected a DM document.');
    }

    expect(parsed.characters[0]?.inventory[0]?.valueGpOverride).toBe(2);
  });

  test('stringifies current documents with a stable canonical field order', () => {
    const document = {
      version: 8,
      kind: 'adnd-encumbrance-dm',
      characters: [
        {
          strength: {
            exceptional: 'none',
            score: 12,
          },
          inventory: [
            {
              playerKnowsValue: false,
              playerMagicKnowledge: 'known-magical',
              day: 25,
              containerId: null,
              quantity: 1,
              catalogId: 'custom-ring-of-free-action',
              id: 'item-1',
              playerNotes: 'Worn on right hand.',
              dmNotes: 'Actually cursed.',
              name: 'Magic Ring',
              fullyIdentified: true,
              isMagical: true,
              valueGpOverride: 5000,
              encumbranceGpOverride: 1,
              customItem: {
                valueGp: 5000,
                encumbranceGp: 1,
                name: 'Ring of Free Action',
                id: 'custom-ring-of-free-action',
                category: 'treasure',
              },
            },
          ],
          id: 'character-1',
          name: 'Alya',
          dmNotes: 'Party treasurer.',
        },
      ],
      activeCharacterId: 'character-1',
    } as const;

    const stringified = stringifyEncumbranceDocument(
      document as unknown as ReturnType<typeof createEmptyEncumbranceDocument>
    );

    expect(stringified).toContain(`{
  "kind": "adnd-encumbrance-dm",
  "version": 8,
  "activeCharacterId": "character-1",
  "characters": [
    {
      "id": "character-1",
      "name": "Alya"`);
    expect(stringified).toContain(`{
          "id": "item-1",
          "catalogId": "custom-ring-of-free-action",
          "quantity": 1,
          "containerId": null,
          "day": 25,
          "playerNotes": "Worn on right hand.",
          "playerMagicKnowledge": "known-magical",
          "playerKnowsValue": false,
          "name": "Magic Ring",
          "encumbranceGpOverride": 1,
          "valueGpOverride": 5000,
          "dmNotes": "Actually cursed.",
          "isMagical": true,
          "fullyIdentified": true,
          "customItem": {
            "id": "custom-ring-of-free-action",
            "name": "Ring of Free Action",
            "category": "treasure",
            "encumbranceGp": 1,
            "valueGp": 5000
          }
        }`);
  });

  test('rejects malformed files', () => {
    expect(() =>
      parseEncumbranceDocument(
        JSON.stringify({
          kind: 'adnd-encumbrance-player',
          version: 99,
        })
      )
    ).toThrow('File is not a supported encumbrance document.');
  });
});
