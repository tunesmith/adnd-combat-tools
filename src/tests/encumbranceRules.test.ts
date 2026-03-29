import { createEmptyEncumbranceDocument } from '../helpers/encumbranceDocument';
import {
  getContainerLoadSummary,
  getEffectiveLoadGp,
  getLoadBand,
  getStrengthWeightAllowanceGp,
  getTotalEncumbranceGp,
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
    ).toBe(750);

    expect(
      getStrengthWeightAllowanceGp({
        score: 18,
        exceptional: '00',
      })
    ).toBe(3000);
  });

  test('sums inventory encumbrance including nested contents', () => {
    const document = createEmptyEncumbranceDocument();
    document.inventory = [
      {
        id: 'backpack-1',
        catalogId: 'backpack',
        quantity: 1,
        containerId: null,
      },
      {
        id: 'torch-1',
        catalogId: 'torch',
        quantity: 2,
        containerId: 'backpack-1',
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 50,
        containerId: null,
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
      },
      {
        id: 'coin-1',
        catalogId: 'coin-gold',
        quantity: 450,
        containerId: 'sack-1',
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

    expect(effectiveLoad).toBe(550);
    expect(getLoadBand(effectiveLoad)).toEqual({
      id: 'heavy',
      label: 'Heavy gear',
      movement: '9"',
    });
  });
});
