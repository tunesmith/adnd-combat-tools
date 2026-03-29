import {
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
  redactEncumbranceDocument,
} from '../helpers/encumbranceDocument';

describe('encumbrance document helpers', () => {
  test('creates an empty DM document by default', () => {
    const document = createEmptyEncumbranceDocument();

    expect(document.kind).toBe('adnd-encumbrance-dm');
    expect(document.version).toBe(1);
    expect(document.character.name).toBe('');
    expect(document.character.strength.score).toBe(8);
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
    });
    if (document.dm) {
      document.dm.privateNotes = 'The ring is cursed.';
    }

    const redacted = redactEncumbranceDocument(document);

    expect(redacted.kind).toBe('adnd-encumbrance-player');
    expect(redacted.character.name).toBe('Falstaff');
    expect(redacted.inventory).toHaveLength(1);
    expect(redacted.dm).toBeUndefined();
  });

  test('parses a saved player document', () => {
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
    expect(parsed.character.strength.exceptional).toBe('51-75');
    expect(parsed.inventory[0]?.quantity).toBe(87);
  });

  test('rejects malformed files', () => {
    expect(() =>
      parseEncumbranceDocument(
        JSON.stringify({
          kind: 'adnd-encumbrance-player',
          version: 2,
        })
      )
    ).toThrow('File is not a supported encumbrance document.');
  });
});
