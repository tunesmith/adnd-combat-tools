import type { StrengthScore } from '../types/encumbrance';
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

  test('STR 15 carrying 900 gp uses its 200 gp allowance once', () => {
    const effectiveLoad = getEffectiveLoadGp(900, {
      score: 15,
      exceptional: 'none',
    });

    expect(effectiveLoad).toBe(700);
    expect(
      getStrengthCarryingCapacityGp({ score: 15, exceptional: 'none' })
    ).toBe(550);
    expect(getLoadBand(effectiveLoad)).toEqual({
      id: 'heavy',
      label: 'Heavy gear',
      movement: '9"',
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
    ).toBeCloseTo(102.01);
    expect(getTotalValueGp(character, encumbranceCatalogById)).toBeCloseTo(
      114.01
    );
    expect(
      getInventoryItemTotalKnownValueGp(
        'backpack-1',
        character.inventory,
        encumbranceCatalogById
      )
    ).toBeCloseTo(2.01);
    expect(getTotalKnownValueGp(character, encumbranceCatalogById)).toBeCloseTo(
      14.01
    );
  });

  test('uses per-item value overrides when totaling item and character value', () => {
    const character = createPlayerCharacter();
    character.inventory = [
      {
        id: 'luckstone-1',
        catalogId: 'diamond',
        quantity: 1,
        containerId: null,
        day: 64,
        playerNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'known-magical',
        name: 'Luckstone',
        valueGpOverride: 25000,
      },
    ];

    expect(
      getInventoryItemTotalValueGp(
        'luckstone-1',
        character.inventory,
        encumbranceCatalogById
      )
    ).toBe(25000);
    expect(getTotalValueGp(character, encumbranceCatalogById)).toBe(25000);
    expect(getTotalKnownValueGp(character, encumbranceCatalogById)).toBe(25000);
  });
});

// PHB pp. 101–102: inclusive 350/700/1050 bands, shifted only by strength allowance.
test.each<[number, StrengthScore['exceptional'], number, number]>([
  [3, 'none', 0, 350],
  [4, 'none', 100, 250],
  [6, 'none', 200, 150],
  [8, 'none', 350, 0],
  [15, 'none', 550, 0],
  [18, 'none', 1100, 0],
  [18, '01-50', 1350, 0],
  [18, '51-75', 1600, 0],
  [18, '76-90', 1850, 0],
  [18, '91-99', 2350, 0],
  [18, '00', 3350, 0],
])(
  'STR %s/%s applies the shifted inclusive boundaries once',
  (score, exceptional, capacity, emptyEffective) => {
    const strength = { score, exceptional };
    expect(getStrengthCarryingCapacityGp(strength)).toBe(capacity);
    expect(getEffectiveLoadGp(0, strength)).toBe(emptyEffective);
    expect(getLoadBand(getEffectiveLoadGp(0, strength)).id).toBe('normal');
    for (const [offset, band] of [
      [0, 'normal'],
      [0.01, 'heavy'],
      [1, 'heavy'],
      [350, 'heavy'],
      [350.01, 'very-heavy'],
      [351, 'very-heavy'],
      [700, 'very-heavy'],
      [700.01, 'encumbered'],
      [701, 'encumbered'],
      [1150, 'encumbered'],
      [1150.01, 'immobile'],
    ] as const) {
      const effective = getEffectiveLoadGp(capacity + offset, strength);
      expect(effective).toBeCloseTo(350 + offset);
      expect(getLoadBand(effective).id).toBe(band);
    }
  }
);
test('STR 8 carrying 436 gp is Heavy gear at 9 inches, not an extra base allowance', () => {
  const strength: StrengthScore = { score: 8, exceptional: 'none' };
  expect(getEffectiveLoadGp(436, strength)).toBe(436);
  expect(getStrengthCarryingCapacityGp(strength)).toBe(350);
  expect(getLoadBand(getEffectiveLoadGp(436, strength))).toEqual({
    id: 'heavy',
    label: 'Heavy gear',
    movement: '9"',
  });
});

test('five catalog sacks total eight silver and a saved explicit price still wins', () => {
  const character = createPlayerCharacter();
  character.inventory = Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    catalogId: 'sack-large',
    quantity: 1,
    day: 10,
    containerId: null,
    playerNotes: '',
    playerKnowsValue: true,
    playerMagicKnowledge: 'unknown',
  }));
  expect(getTotalValueGp(character, encumbranceCatalogById)).toBe(0.4);
  const first = character.inventory[0];
  if (!first) throw Error('Missing sack');
  first.valueGpOverride = 0.16;
  expect(
    getInventoryItemTotalValueGp(
      '0',
      character.inventory,
      encumbranceCatalogById
    )
  ).toBe(0.16);
});
