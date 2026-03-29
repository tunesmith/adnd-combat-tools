import { createEmptyEncumbranceDocument } from '../helpers/encumbranceDocument';
import {
  getContainerLoadSummary,
  getStrengthCarryingCapacityGp,
  getEffectiveLoadGp,
  getInventoryItemTotalValueGp,
  getLoadBand,
  getStrengthWeightAllowanceGp,
  getTotalEncumbranceGp,
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
        notes: '',
      },
      {
        id: 'torch-1',
        catalogId: 'torch',
        quantity: 2,
        containerId: 'backpack-1',
        notes: '',
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 50,
        containerId: null,
        notes: '',
      },
    ];

    expect(getTotalEncumbranceGp(document, encumbranceCatalogById)).toBe(120);
  });

  test('tracks container load and over-capacity warnings', () => {
    const document = createEmptyEncumbranceDocument();
    document.inventory = [
      {
        id: 'sack-1',
        catalogId: 'sack-large',
        quantity: 1,
        containerId: null,
        notes: '',
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 450,
        containerId: 'sack-1',
        notes: '',
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
        notes: '',
      },
      {
        id: 'diamond-1',
        catalogId: 'diamond',
        quantity: 1,
        containerId: 'backpack-1',
        notes: '',
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 12,
        containerId: null,
        notes: '',
      },
      {
        id: 'torch-1',
        catalogId: 'torch',
        quantity: 2,
        containerId: 'backpack-1',
        notes: '',
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
  });
});
