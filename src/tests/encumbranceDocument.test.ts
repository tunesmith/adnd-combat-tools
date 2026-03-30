import {
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
  redactEncumbranceDocument,
} from '../helpers/encumbranceDocument';

describe('encumbrance document helpers', () => {
  test('creates an empty DM party document by default', () => {
    const document = createEmptyEncumbranceDocument();

    expect(document.kind).toBe('adnd-encumbrance-dm');
    expect(document.version).toBe(7);

    if (document.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Expected a DM document.');
    }

    expect(document.characters).toHaveLength(1);
    expect(document.activeCharacterId).toBe(document.characters[0]?.id);
    expect(document.characters[0]?.name).toBe('');
    expect(document.characters[0]?.strength.score).toBe(8);
    expect(document.characters[0]?.dmNotes).toBe('');
    expect(document.customItems).toEqual([]);
  });

  test('redacts DM-only fields for the active player export', () => {
    const document = createEmptyEncumbranceDocument();

    if (document.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Expected a DM document.');
    }

    const primaryCharacter = document.characters[0];
    if (!primaryCharacter) {
      throw new Error('Expected a primary character.');
    }
    const otherCharacter = {
      ...primaryCharacter,
      id: 'character-2',
      name: 'Mira',
      inventory: [],
      dmNotes: 'Ignore me.',
    };

    primaryCharacter.name = 'Falstaff';
    primaryCharacter.dmNotes = 'The ring is cursed.';
    primaryCharacter.inventory.push({
      id: 'item-1',
      catalogId: 'backpack',
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
    });
    document.characters.push(otherCharacter);
    document.customItems.push({
      id: 'custom-ledger',
      name: 'Ledger',
      category: 'adventuring-gear',
      encumbranceGp: 5,
      valueGp: 12,
    });
    document.customItems.push({
      id: 'custom-bag-of-holding',
      name: 'Backpack of Holding',
      category: 'containers',
      encumbranceGp: 150,
      valueGp: 25000,
      isContainer: true,
      capacityGp: 5000,
      ignoresContentsWeightForEncumbrance: true,
    });

    const redacted = redactEncumbranceDocument(document, primaryCharacter.id);

    expect(redacted.kind).toBe('adnd-encumbrance-player');
    expect(redacted.character.id).toBe(primaryCharacter.id);
    expect(redacted.character.name).toBe('Falstaff');
    expect(redacted.character.inventory).toHaveLength(1);
    expect(redacted.character.inventory[0]?.day).toBe(84);
    expect(redacted.character.inventory[0]?.playerNotes).toBe(
      'Worn and patched.'
    );
    expect(redacted.character.inventory[0]?.playerKnowsValue).toBe(false);
    expect(redacted.character.inventory[0]?.name).toBe('Field pack');
    expect(redacted.character.inventory[0]?.playerMagicKnowledge).toBe(
      'known-magical'
    );
    expect(redacted.character.inventory[0]?.dmNotes).toBeUndefined();
    expect(redacted.character.inventory[0]?.isMagical).toBeUndefined();
    expect(redacted.character.inventory[0]?.fullyIdentified).toBeUndefined();
    expect(redacted.character.inventory[0]?.encumbranceGpOverride).toBe(18);
    expect(redacted.customItems).toEqual(document.customItems);
    expect(
      redacted.customItems.find((item) => item.id === 'custom-bag-of-holding')
        ?.ignoresContentsWeightForEncumbrance
    ).toBe(true);
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
    expect(parsed.version).toBe(7);

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
    expect(parsed.customItems).toEqual([]);
  });

  test('parses and migrates a legacy DM document into a party file', () => {
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        kind: 'adnd-encumbrance-dm',
        version: 6,
        character: {
          name: 'Marda',
          strength: {
            score: 16,
            exceptional: 'none',
          },
        },
        inventory: [
          {
            id: 'item-1',
            catalogId: 'backpack',
            quantity: 1,
            containerId: null,
            day: 23,
            playerNotes: 'Packed for travel.',
            playerKnowsValue: false,
            name: 'Travel pack',
            dmNotes: 'False-bottom compartment.',
            playerMagicKnowledge: 'unknown',
            isMagical: true,
            fullyIdentified: true,
            encumbranceGpOverride: 17.5,
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
        dm: {
          privateNotes: 'Secret note.',
        },
      })
    );

    expect(parsed.kind).toBe('adnd-encumbrance-dm');
    expect(parsed.version).toBe(7);

    if (parsed.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Expected a DM document.');
    }

    expect(parsed.characters).toHaveLength(1);
    expect(parsed.activeCharacterId).toBe(parsed.characters[0]?.id);
    expect(parsed.characters[0]?.name).toBe('Marda');
    expect(parsed.characters[0]?.inventory[0]?.day).toBe(23);
    expect(parsed.characters[0]?.inventory[0]?.playerNotes).toBe(
      'Packed for travel.'
    );
    expect(parsed.characters[0]?.inventory[0]?.playerKnowsValue).toBe(false);
    expect(parsed.characters[0]?.inventory[0]?.name).toBe('Travel pack');
    expect(parsed.characters[0]?.inventory[0]?.dmNotes).toBe(
      'False-bottom compartment.'
    );
    expect(parsed.characters[0]?.inventory[0]?.playerMagicKnowledge).toBe(
      'unknown'
    );
    expect(parsed.characters[0]?.inventory[0]?.isMagical).toBe(true);
    expect(parsed.characters[0]?.inventory[0]?.fullyIdentified).toBe(true);
    expect(parsed.characters[0]?.inventory[0]?.encumbranceGpOverride).toBe(
      17.5
    );
    expect(parsed.characters[0]?.dmNotes).toBe('Secret note.');
    expect(parsed.customItems[0]?.name).toBe('Charm');
  });

  test('normalizes legacy custom item categories on load', () => {
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
        inventory: [],
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

    expect(parsed.customItems[0]?.category).toBe('arms');
    expect(parsed.customItems[1]?.category).toBe('adventuring-gear');
  });

  test('preserves special encumbrance rules on custom containers', () => {
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
          inventory: [],
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

    expect(
      parsed.customItems.find((item) => item.id === 'custom-bag-of-holding')
        ?.ignoresContentsWeightForEncumbrance
    ).toBe(true);
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
