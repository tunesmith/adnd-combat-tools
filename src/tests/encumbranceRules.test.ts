import { createEmptyEncumbranceDocument } from '../helpers/encumbranceDocument';
import {
  getContainerLoadSummary,
  getEffectiveLoadGp,
  getInventoryItemTotalKnownValueGp,
  getInventoryItemTotalValueGp,
  getLoadBand,
  getStrengthCarryingCapacityGp,
  getStrengthWeightAllowanceGp,
  getTotalEncumbranceGp,
  getTotalKnownValueGp,
  getTotalValueGp,
} from '../helpers/encumbranceRules';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';

const createPlayerCharacter = () => {
  const document = createEmptyEncumbranceDocument('adnd-encumbrance-player');

  if (document.kind !== 'adnd-encumbrance-player') {
    throw new Error('Expected a player document.');
  }

  return document.character;
};

describe('encumbrance rules', () => {
  test('returns strength weight allowance for normal and exceptional strength', () => {
    expect(
      getStrengthWeightAllowanceGp({
        score: 8,
        exceptional: 'none',
      })
    ).toBe(0);

    expect(
      getStrengthWeightAllowanceGp({
        score: 17,
        exceptional: 'none',
      })
    ).toBe(500);

    expect(
      getStrengthWeightAllowanceGp({
        score: 18,
        exceptional: '00',
      })
    ).toBe(3000);
  });

  test('returns carrying capacity from the base 350 gp plus strength modifier', () => {
    expect(
      getStrengthCarryingCapacityGp({
        score: 8,
        exceptional: 'none',
      })
    ).toBe(350);

    expect(
      getStrengthCarryingCapacityGp({
        score: 18,
        exceptional: '01-50',
      })
    ).toBe(1350);
  });

  test('sums inventory encumbrance including nested contents', () => {
    const character = createPlayerCharacter();
    character.inventory = [
      {
        id: 'backpack-1',
        catalogId: 'backpack',
        quantity: 1,
        containerId: null,
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
      {
        id: 'torch-1',
        catalogId: 'torch',
        quantity: 2,
        containerId: 'backpack-1',
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 50,
        containerId: null,
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
    ];

    expect(getTotalEncumbranceGp(character, encumbranceCatalogById)).toBe(120);
  });

  test('uses per-item encumbrance overrides when totaling carried load', () => {
    const character = createPlayerCharacter();
    character.inventory = [
      {
        id: 'rations-1',
        catalogId: 'rations-iron',
        quantity: 1,
        containerId: null,
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
        name: 'Iron rations (half eaten)',
        encumbranceGpOverride: 37.5,
      },
    ];

    expect(getTotalEncumbranceGp(character, encumbranceCatalogById)).toBe(37.5);
  });

  test('tracks container load and over-capacity warnings', () => {
    const character = createPlayerCharacter();
    character.inventory = [
      {
        id: 'sack-1',
        catalogId: 'sack-large',
        quantity: 1,
        containerId: null,
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 450,
        containerId: 'sack-1',
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
    ];

    const summary = getContainerLoadSummary(
      'sack-1',
      character.inventory,
      encumbranceCatalogById
    );

    expect(summary).toEqual({
      used: 450,
      capacity: 400,
      unitLabel: 'gp',
      isOverCapacity: true,
      mismatchedItemIds: [],
    });
  });

  test('supports containers whose contents do not add to carried weight', () => {
    const catalogById = new Map(encumbranceCatalogById);
    catalogById.set('custom-backpack-of-holding', {
      id: 'custom-backpack-of-holding',
      name: 'Backpack of Holding',
      category: 'containers',
      encumbranceGp: 150,
      valueGp: 25000,
      isContainer: true,
      capacityGp: 5000,
      ignoresContentsWeightForEncumbrance: true,
    });

    const character = createPlayerCharacter();
    character.inventory = [
      {
        id: 'bag-1',
        catalogId: 'custom-backpack-of-holding',
        quantity: 1,
        containerId: null,
        day: 64,
        playerNotes: '',
        playerKnowsValue: false,
        playerMagicKnowledge: 'known-magical',
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 4000,
        containerId: 'bag-1',
        day: 64,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
    ];

    expect(getTotalEncumbranceGp(character, catalogById)).toBe(150);
    expect(
      getContainerLoadSummary('bag-1', character.inventory, catalogById)
    ).toEqual({
      used: 4000,
      capacity: 5000,
      unitLabel: 'gp',
      isOverCapacity: false,
      mismatchedItemIds: [],
    });
  });

  test('derives an encumbrance band from effective load', () => {
    const effectiveLoad = getEffectiveLoadGp(900, {
      score: 15,
      exceptional: 'none',
    });

    expect(effectiveLoad).toBe(350);
    expect(getLoadBand(effectiveLoad)).toEqual({
      id: 'normal',
      label: 'Unencumbered',
      movement: '12"',
    });
  });

  test('sums inventory value including nested contents', () => {
    const character = createPlayerCharacter();
    character.inventory = [
      {
        id: 'backpack-1',
        catalogId: 'backpack',
        quantity: 1,
        containerId: null,
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
      {
        id: 'diamond-1',
        catalogId: 'diamond',
        quantity: 1,
        containerId: 'backpack-1',
        day: 0,
        playerNotes: '',
        playerKnowsValue: false,
        playerMagicKnowledge: 'unknown',
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 12,
        containerId: null,
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
      {
        id: 'torch-1',
        catalogId: 'torch',
        quantity: 2,
        containerId: 'backpack-1',
        day: 0,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'unknown',
      },
    ];

    expect(
      getInventoryItemTotalValueGp(
        'backpack-1',
        character.inventory,
        encumbranceCatalogById
      )
    ).toBeCloseTo(102.02);
    expect(getTotalValueGp(character, encumbranceCatalogById)).toBeCloseTo(
      114.02
    );
    expect(
      getInventoryItemTotalKnownValueGp(
        'backpack-1',
        character.inventory,
        encumbranceCatalogById
      )
    ).toBeCloseTo(2.02);
    expect(getTotalKnownValueGp(character, encumbranceCatalogById)).toBeCloseTo(
      14.02
    );
  });
});
