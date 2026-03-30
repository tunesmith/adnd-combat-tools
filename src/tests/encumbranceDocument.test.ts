import {
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
  redactEncumbranceDocument,
} from '../helpers/encumbranceDocument';

describe('encumbrance document helpers', () => {
  test('creates an empty DM document by default', () => {
    const document = createEmptyEncumbranceDocument();

    expect(document.kind).toBe('adnd-encumbrance-dm');
    expect(document.version).toBe(5);
    expect(document.character.name).toBe('');
    expect(document.character.strength.score).toBe(8);
    expect(document.customItems).toEqual([]);
    expect(document.dm?.privateNotes).toBe('');
  });

  test('redacts DM-only fields for player export', () => {
    const document = createEmptyEncumbranceDocument();
    document.character.name = 'Falstaff';
    document.inventory.push({
      id: 'item-1',
      catalogId: 'backpack',
      quantity: 1,
      containerId: null,
      day: 84,
      playerNotes: 'Worn and patched.',
      name: 'Field pack',
      dmNotes: 'Actually an extradimensional satchel.',
      playerMagicKnowledge: 'known-magical',
      isMagical: true,
      fullyIdentified: true,
      encumbranceGpOverride: 18,
    });
    document.customItems.push({
      id: 'custom-ledger',
      name: 'Ledger',
      category: 'gear',
      encumbranceGp: 5,
      valueGp: 12,
    });
    if (document.dm) {
      document.dm.privateNotes = 'The ring is cursed.';
    }

    const redacted = redactEncumbranceDocument(document);

    expect(redacted.kind).toBe('adnd-encumbrance-player');
    expect(redacted.character.name).toBe('Falstaff');
    expect(redacted.inventory).toHaveLength(1);
    expect(redacted.inventory[0]?.day).toBe(84);
    expect(redacted.inventory[0]?.playerNotes).toBe('Worn and patched.');
    expect(redacted.inventory[0]?.name).toBe('Field pack');
    expect(redacted.inventory[0]?.playerMagicKnowledge).toBe('known-magical');
    expect(redacted.inventory[0]?.dmNotes).toBeUndefined();
    expect(redacted.inventory[0]?.isMagical).toBeUndefined();
    expect(redacted.inventory[0]?.fullyIdentified).toBeUndefined();
    expect(redacted.inventory[0]?.encumbranceGpOverride).toBe(18);
    expect(redacted.customItems).toEqual(document.customItems);
    expect(redacted.dm).toBeUndefined();
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
    expect(parsed.version).toBe(5);
    expect(parsed.character.strength.exceptional).toBe('51-75');
    expect(parsed.inventory[0]?.quantity).toBe(87);
    expect(parsed.inventory[0]?.day).toBe(0);
    expect(parsed.inventory[0]?.playerNotes).toBe('');
    expect(parsed.inventory[0]?.playerMagicKnowledge).toBe('unknown');
    expect(parsed.customItems).toEqual([]);
  });

  test('parses a current DM document', () => {
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        kind: 'adnd-encumbrance-dm',
        version: 5,
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
    expect(parsed.version).toBe(5);
    expect(parsed.inventory[0]?.day).toBe(23);
    expect(parsed.inventory[0]?.playerNotes).toBe('Packed for travel.');
    expect(parsed.inventory[0]?.name).toBe('Travel pack');
    expect(parsed.inventory[0]?.dmNotes).toBe('False-bottom compartment.');
    expect(parsed.inventory[0]?.playerMagicKnowledge).toBe('unknown');
    expect(parsed.inventory[0]?.isMagical).toBe(true);
    expect(parsed.inventory[0]?.fullyIdentified).toBe(true);
    expect(parsed.inventory[0]?.encumbranceGpOverride).toBe(17.5);
    expect(parsed.customItems[0]?.name).toBe('Charm');
    expect(parsed.dm?.privateNotes).toBe('Secret note.');
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
