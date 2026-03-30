import { createEmptyEncumbranceDocument } from '../helpers/encumbranceDocument';
import {
  getContainerLoadSummary,
  getStrengthCarryingCapacityGp,
  getEffectiveLoadGp,
  getInventoryItemTotalKnownValueGp,
  getInventoryItemTotalValueGp,
  getLoadBand,
  getStrengthWeightAllowanceGp,
  getTotalEncumbranceGp,
  getTotalKnownValueGp,
  getTotalValueGp,
} from '../helpers/encumbranceRules';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';

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
    const document = createEmptyEncumbranceDocument();
    document.inventory = [
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

    expect(getTotalEncumbranceGp(document, encumbranceCatalogById)).toBe(120);
  });

  test('uses per-item encumbrance overrides when totaling carried load', () => {
    const document = createEmptyEncumbranceDocument();
    document.inventory = [
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

    expect(getTotalEncumbranceGp(document, encumbranceCatalogById)).toBe(37.5);
  });

  test('tracks container load and over-capacity warnings', () => {
    const document = createEmptyEncumbranceDocument();
    document.inventory = [
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
      document.inventory,
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
    const document = createEmptyEncumbranceDocument();
    document.inventory = [
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
        document.inventory,
        encumbranceCatalogById
      )
    ).toBeCloseTo(102.02);
    expect(getTotalValueGp(document, encumbranceCatalogById)).toBeCloseTo(
      114.02
    );
    expect(
      getInventoryItemTotalKnownValueGp(
        'backpack-1',
        document.inventory,
        encumbranceCatalogById
      )
    ).toBeCloseTo(2.02);
    expect(getTotalKnownValueGp(document, encumbranceCatalogById)).toBeCloseTo(
      14.02
    );
  });
});
