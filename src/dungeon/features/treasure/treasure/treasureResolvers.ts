import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import {
  treasureWithoutMonster,
  treasureWithMonster,
  TreasureWithoutMonster,
} from './treasureTable';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  TreasureEntry,
  TreasureGemCategory,
  TreasureGemCategoryId,
  TreasureGemKind,
  TreasureGemLot,
  TreasureGemValueAdjustment,
  TreasureJewelryPiece,
} from '../../../domain/outcome';

export function resolveTreasure(options?: {
  roll?: number;
  level?: number;
  withMonster?: boolean;
  rollIndex?: number;
  totalRolls?: number;
}): DungeonOutcomeNode {
  const level = options?.level ?? 1;
  const withMonster = options?.withMonster ?? false;
  const table = withMonster ? treasureWithMonster : treasureWithoutMonster;
  const sides = table.sides;

  const usedRoll = options?.roll ?? rollDice(sides);
  const command = getTableEntry(usedRoll, table);
  const entry: TreasureEntry = { roll: usedRoll, command };
  enrichTreasureEntry(entry, level);

  const event: OutcomeEvent = {
    kind: 'treasure',
    level,
    withMonster,
    entries: [entry],
    rollIndex: options?.rollIndex,
    totalRolls: options?.totalRolls,
  } as OutcomeEvent;

  const children: DungeonOutcomeNode[] = [];
  if (entry.command === TreasureWithoutMonster.Magic) {
    children.push({
      type: 'pending-roll',
      table: 'treasureMagicCategory',
      id: options?.rollIndex
        ? `treasureMagicCategory:${options.rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level,
        treasureRoll: usedRoll,
        rollIndex: options?.rollIndex,
      },
    });
  }

  children.push(
    {
      type: 'pending-roll',
      table: 'treasureContainer',
      context: {
        kind: 'treasureContainer',
      },
    },
    {
      type: 'pending-roll',
      table: 'treasureProtectionType',
      context: {
        kind: 'treasureProtection',
        treasureRoll: usedRoll,
      },
    }
  );

  const node: OutcomeEventNode = {
    type: 'event',
    roll: usedRoll,
    event,
    children,
  };

  return node;
}

function enrichTreasureEntry(entry: TreasureEntry, level: number): void {
  switch (entry.command) {
    case TreasureWithoutMonster.CopperPerLevel:
      setCoinEntry(entry, 1000 * level, 'copper piece', 'copper pieces');
      break;
    case TreasureWithoutMonster.SilverPerLevel:
      setCoinEntry(entry, 1000 * level, 'silver piece', 'silver pieces');
      break;
    case TreasureWithoutMonster.ElectrumPerLevel:
      setCoinEntry(entry, 750 * level, 'electrum piece', 'electrum pieces');
      break;
    case TreasureWithoutMonster.GoldPerLevel:
      setCoinEntry(entry, 250 * level, 'gold piece', 'gold pieces');
      break;
    case TreasureWithoutMonster.PlatinumPerLevel:
      setCoinEntry(entry, 100 * level, 'platinum piece', 'platinum pieces');
      break;
    case TreasureWithoutMonster.GemsPerLevel: {
      const quantity = rollDice(4, level);
      entry.gems = quantity > 0 ? generateGemLots(quantity) : [];
      setCountEntry(entry, quantity, 'gem', 'gems');
      break;
    }
    case TreasureWithoutMonster.JewelryPerLevel: {
      entry.jewelry = generateJewelryPieces(level);
      setCountEntry(entry, level, 'piece of jewelry', 'pieces of jewelry');
      break;
    }
    case TreasureWithoutMonster.Magic:
      entry.magicCategory = undefined;
      break;
    default:
      break;
  }
}

function setCoinEntry(
  entry: TreasureEntry,
  quantity: number,
  singular: string,
  plural: string
): void {
  entry.quantity = quantity;
  entry.display = formatQuantity(quantity, singular, plural);
}

function setCountEntry(
  entry: TreasureEntry,
  quantity: number,
  singular: string,
  plural: string
): void {
  entry.quantity = quantity;
  entry.display = formatQuantity(quantity, singular, plural);
}

function formatQuantity(
  quantity: number,
  singular: string,
  plural: string
): string {
  const unit = quantity === 1 ? singular : plural;
  return `${quantity.toLocaleString()} ${unit}`;
}

type GemValueStep = {
  value: number;
};

const GEM_VALUE_STEPS: GemValueStep[] = [
  { value: 0.1 }, // 1 sp
  { value: 0.5 }, // 5 sp
  { value: 1 },
  { value: 5 },
  { value: 10 },
  { value: 50 },
  { value: 100 },
  { value: 500 },
  { value: 1000 },
  { value: 5000 },
  { value: 10000 },
  { value: 25000 },
  { value: 50000 },
  { value: 100000 },
  { value: 250000 },
  { value: 500000 },
  { value: 1000000 },
];

const GEM_SIZE_THRESHOLDS: { maxValue: number; label: string }[] = [
  { maxValue: 10, label: 'very small' },
  { maxValue: 50, label: 'small' },
  { maxValue: 100, label: 'average' },
  { maxValue: 500, label: 'large' },
  { maxValue: 1000, label: 'very large' },
  { maxValue: Number.POSITIVE_INFINITY, label: 'huge' },
];

type GemBaseTableEntry = {
  range: [number, number];
  category: TreasureGemCategory;
  baseValueStep: number;
};

const gemValueStepIndex = (value: number): number => {
  const index = GEM_VALUE_STEPS.findIndex((step) => step.value === value);
  if (index === -1) {
    throw new Error(`Unknown gem value step for ${value}`);
  }
  return index;
};

const GEM_BASE_TABLE: GemBaseTableEntry[] = [
  {
    range: [1, 25],
    category: {
      id: 'ornamental',
      description: 'Ornamental Stones',
      typicalSize: 'very small',
    },
    baseValueStep: gemValueStepIndex(10),
  },
  {
    range: [26, 50],
    category: {
      id: 'semiPrecious',
      description: 'Semi-precious Stones',
      typicalSize: 'small',
    },
    baseValueStep: gemValueStepIndex(50),
  },
  {
    range: [51, 70],
    category: {
      id: 'fancy',
      description: 'Fancy Stones',
      typicalSize: 'average',
    },
    baseValueStep: gemValueStepIndex(100),
  },
  {
    range: [71, 90],
    category: {
      id: 'fancyPrecious',
      description: 'Fancy Stones (Precious)',
      typicalSize: 'large',
    },
    baseValueStep: gemValueStepIndex(500),
  },
  {
    range: [91, 99],
    category: {
      id: 'gem',
      description: 'Gem Stones',
      typicalSize: 'very large',
    },
    baseValueStep: gemValueStepIndex(1000),
  },
  {
    range: [100, 100],
    category: {
      id: 'jewel',
      description: 'Gem Stones (Jewels)',
      typicalSize: 'huge',
    },
    baseValueStep: gemValueStepIndex(5000),
  },
];

type GemKindTableEntry = {
  range: [number, number];
  kind: TreasureGemKind;
};

const ORNAMENTAL_STONE_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Azurite',
      description: 'mottled deep blue',
      property: 'opaque',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Banded Agate',
      description: 'striped brown and blue and white and reddish',
      property: 'translucent',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Blue Quartz',
      description: 'pale blue',
      property: 'transparent',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Eye Agate',
      description: 'circles of gray, white, brown, blue and/or green',
      property: 'translucent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Hematite',
      description: 'gray-black',
      property: 'opaque',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Lapis Lazuli',
      description: 'light and dark blue with yellow flecks',
      property: 'opaque',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Malachite',
      description: 'striated light and dark green',
      property: 'opaque',
    },
  },
  {
    range: [8, 8],
    kind: {
      name: 'Moss Agate',
      description:
        'pink or yellow-white with grayish or greenish "moss" markings',
      property: 'translucent',
    },
  },
  {
    range: [9, 9],
    kind: {
      name: 'Obsidian',
      description: 'black',
      property: 'opaque',
    },
  },
  {
    range: [10, 10],
    kind: {
      name: 'Rhodochrosite',
      description: 'light pink',
      property: 'opaque',
    },
  },
  {
    range: [11, 11],
    kind: {
      name: 'Tiger Eye',
      description: 'rich brown with golden center under-hue',
      property: 'translucent',
    },
  },
  {
    range: [12, 12],
    kind: {
      name: 'Turquoise',
      description: 'light blue-green',
      property: 'opaque',
    },
  },
];

const SEMI_PRECIOUS_STONE_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Bloodstone',
      description: 'dark gray with red flecks',
      property: 'opaque',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Carnelian',
      description: 'orange to reddish brown (also called Sard)',
      property: 'opaque',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Chalcedony',
      description: 'white',
      property: 'opaque',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Chrysoprase',
      description: 'apple green to emerald green',
      property: 'translucent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Citrine',
      description: 'pale yellow brown',
      property: 'transparent',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Jasper',
      description: 'blue, black to brown',
      property: 'opaque',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Moonstone',
      description: 'white with pale blue glow',
      property: 'translucent',
    },
  },
  {
    range: [8, 8],
    kind: {
      name: 'Onyx',
      description: 'bands of black and white or pure black or white',
      property: 'opaque',
    },
  },
  {
    range: [9, 9],
    kind: {
      name: 'Rock Crystal',
      description: 'clear',
      property: 'transparent',
    },
  },
  {
    range: [10, 10],
    kind: {
      name: 'Sardonyx',
      description: 'bands of sard (red) and onyx (white) or sard',
      property: 'opaque',
    },
  },
  {
    range: [11, 11],
    kind: {
      name: 'Smoky Quartz',
      description: 'gray, yellow, or blue (Cairngorm), all light',
      property: 'transparent',
    },
  },
  {
    range: [12, 12],
    kind: {
      name: 'Star Rose Quartz',
      description: 'translucent rosy stone with white "star" center',
      property: 'translucent',
    },
  },
  {
    range: [13, 13],
    kind: {
      name: 'Zircon',
      description: 'clear pale blue-green',
      property: 'transparent',
    },
  },
];

const FANCY_STONE_100_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Amber',
      description: 'watery gold to rich gold',
      property: 'translucent',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Alexandrite',
      description: 'dark green',
      property: 'transparent',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Amethyst',
      description: 'deep purple',
      property: 'transparent',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Chrysoberyl',
      description: 'yellow green to green',
      property: 'transparent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Coral',
      description: 'crimson',
      property: 'opaque',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Garnet',
      description: 'red, brown-green, or violet (common varieties)',
      property: 'transparent',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Jade',
      description: 'light green, deep green, green and white, or white',
      property: 'translucent',
    },
  },
  {
    range: [8, 8],
    kind: {
      name: 'Jet',
      description: 'deep black',
      property: 'opaque',
    },
  },
  {
    range: [9, 9],
    kind: {
      name: 'Pearl',
      description: 'lustrous white, yellowish, pinkish, etc.',
      property: 'opaque',
    },
  },
  {
    range: [10, 10],
    kind: {
      name: 'Spinel',
      description: 'red, red-brown, deep green, or very deep blue',
      property: 'transparent',
    },
  },
  {
    range: [11, 11],
    kind: {
      name: 'Tourmaline',
      description: 'pale green, blue, brown, or reddish stones',
      property: 'transparent',
    },
  },
];

const FANCY_STONE_500_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Aquamarine',
      description: 'pale blue green',
      property: 'transparent',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Garnet',
      description: 'rare brilliant red, brown-green, or violet varieties',
      property: 'transparent',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Pearl',
      description: 'exceptional stones including pure black pearls',
      property: 'opaque',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Peridot',
      description: 'rich olive green (chrysolite)',
      property: 'transparent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Spinel',
      description: 'rare red, deep green, or very deep blue stones',
      property: 'transparent',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Topaz',
      description: 'golden yellow',
      property: 'transparent',
    },
  },
];

const GEM_STONE_1000_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Black Opal',
      description: 'dark green with black mottling and golden flecks',
      property: 'translucent',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Emerald',
      description: 'deep bright green',
      property: 'transparent',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Fire Opal',
      description: 'fiery red',
      property: 'translucent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Opal',
      description: 'pale blue with green and golden mottling',
      property: 'translucent',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Oriental Amethyst',
      description: 'rich purple (Corundum)',
      property: 'transparent',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Oriental Topaz',
      description: 'fiery yellow (Corundum)',
      property: 'transparent',
    },
  },
  {
    range: [8, 8],
    kind: {
      name: 'Sapphire',
      description: 'clear to medium blue (Corundum)',
      property: 'transparent',
    },
  },
];

const GEM_STONE_5000_KINDS: GemKindTableEntry[] = [
  {
    range: [1, 1],
    kind: {
      name: 'Black Sapphire',
      description: 'lustrous black with glowing highlights',
      property: 'transparent',
    },
  },
  {
    range: [2, 2],
    kind: {
      name: 'Diamond',
      description: 'clear blue-white or brilliant tinted stones',
      property: 'transparent',
    },
  },
  {
    range: [3, 3],
    kind: {
      name: 'Jacinth',
      description: 'fiery orange (corundum)',
      property: 'transparent',
    },
  },
  {
    range: [4, 4],
    kind: {
      name: 'Oriental Emerald',
      description: 'clear bright green corundum',
      property: 'transparent',
    },
  },
  {
    range: [5, 5],
    kind: {
      name: 'Ruby',
      description: 'clear red to deep crimson corundum',
      property: 'transparent',
    },
  },
  {
    range: [6, 6],
    kind: {
      name: 'Star Ruby',
      description: 'translucent ruby with white star center',
      property: 'translucent',
    },
  },
  {
    range: [7, 7],
    kind: {
      name: 'Star Sapphire',
      description: 'translucent sapphire with white star center',
      property: 'translucent',
    },
  },
];

type GemKindTable =
  | GemKindTableEntry[]
  | {
      default: GemKindTableEntry[];
      highValue?: GemKindTableEntry[];
      highValueThreshold?: number;
    };

const GEM_KIND_TABLES: Partial<Record<TreasureGemCategoryId, GemKindTable>> = {
  ornamental: ORNAMENTAL_STONE_KINDS,
  semiPrecious: SEMI_PRECIOUS_STONE_KINDS,
  fancy: {
    default: FANCY_STONE_100_KINDS,
    highValue: FANCY_STONE_500_KINDS,
    highValueThreshold: 500,
  },
  fancyPrecious: {
    default: FANCY_STONE_500_KINDS,
    highValue: FANCY_STONE_500_KINDS,
  },
  gem: {
    default: GEM_STONE_1000_KINDS,
    highValue: GEM_STONE_5000_KINDS,
    highValueThreshold: 5000,
  },
  jewel: { default: GEM_STONE_5000_KINDS, highValue: GEM_STONE_5000_KINDS },
};

function getGemValueByStep(step: number): number {
  const entry = GEM_VALUE_STEPS[step];
  if (!entry) {
    throw new Error(`No gem value step for index ${step}`);
  }
  return entry.value;
}

type GemVariationResult = {
  finalBaseStep: number;
  value: number;
  adjustment: TreasureGemValueAdjustment;
};

function generateGemLots(totalGems: number): TreasureGemLot[] {
  if (totalGems <= 0) {
    return [];
  }
  const lotSizes = convertToGemLots(totalGems);
  return lotSizes.map((count) => rollGemLot(count));
}

function convertToGemLots(total: number): number[] {
  const lots: number[] = [];
  let remaining = total;
  const denominations = [10, 5, 1];
  for (const size of denominations) {
    const batches = Math.floor(remaining / size);
    for (let i = 0; i < batches; i++) {
      lots.push(size);
    }
    remaining -= batches * size;
  }
  return lots;
}

function rollGemLot(count: number): TreasureGemLot {
  const baseRoll = rollDice(100);
  const baseEntry = findGemBaseEntry(baseRoll);
  const differentialRoll = rollDice(100);
  const differential = getGemDifferential(differentialRoll);
  const adjustedStep = clampGemValueStep(
    baseEntry.baseValueStep + differential
  );
  const kind = rollGemKind(baseEntry.category.id, adjustedStep);
  const baseValue = getGemValueByStep(adjustedStep);
  const variation = applyGemValueVariation(adjustedStep);
  const size = gemSizeForStep(variation.finalBaseStep);

  return {
    count,
    category: baseEntry.category,
    baseValue,
    baseValueStep: adjustedStep,
    finalBaseStep: variation.finalBaseStep,
    size,
    value: variation.value,
    adjustment: variation.adjustment,
    kind,
  };
}

function findGemBaseEntry(roll: number): GemBaseTableEntry {
  const entry = GEM_BASE_TABLE.find(
    (candidate) => roll >= candidate.range[0] && roll <= candidate.range[1]
  );
  if (!entry) {
    throw new Error(`Gem base roll ${roll} out of range`);
  }
  return entry;
}

function getGemDifferential(roll: number): number {
  if (roll <= 25) return -2;
  if (roll <= 50) return -1;
  if (roll <= 70) return 0;
  if (roll <= 90) return 1;
  if (roll <= 99) return 2;
  return 3;
}

function rollGemKind(
  categoryId: TreasureGemCategoryId,
  valueStep: number
): TreasureGemKind | undefined {
  const rawTable = GEM_KIND_TABLES[categoryId];
  if (!rawTable) {
    return undefined;
  }
  let table: GemKindTableEntry[] | undefined;
  if (Array.isArray(rawTable)) {
    table = rawTable;
  } else {
    const thresholdValue = rawTable.highValueThreshold;
    const thresholdStep =
      thresholdValue !== undefined
        ? gemValueStepIndex(thresholdValue)
        : undefined;
    const isHighValue =
      thresholdStep !== undefined &&
      rawTable.highValue &&
      valueStep >= thresholdStep;
    table =
      isHighValue && rawTable.highValue ? rawTable.highValue : rawTable.default;
  }
  if (!table || table.length === 0) {
    return undefined;
  }
  const max = table[table.length - 1]?.range[1] ?? 0;
  if (max <= 0) return undefined;
  const roll = rollDice(max);
  const entry = table.find(
    (candidate) => roll >= candidate.range[0] && roll <= candidate.range[1]
  );
  return entry?.kind;
}

function clampGemValueStep(step: number): number {
  if (step < 0) return 0;
  const maxIndex = GEM_VALUE_STEPS.length - 1;
  if (step > maxIndex) return maxIndex;
  return step;
}

function applyGemValueVariation(baseStep: number): GemVariationResult {
  const maxStep = Math.min(baseStep + 7, GEM_VALUE_STEPS.length - 1);
  const minStep = Math.max(baseStep - 5, 0);
  let currentStep = baseStep;
  let netStepChange = 0;
  let rerollMode: 'increase' | 'decrease' | undefined;

  while (true) {
    const roll = rollD10Digit();
    if (rerollMode === 'increase' && roll > 8) {
      continue;
    }
    if (rerollMode === 'decrease' && roll < 2) {
      continue;
    }

    if (roll === 1) {
      if (currentStep >= maxStep) {
        rerollMode = undefined;
        continue;
      }
      currentStep += 1;
      netStepChange += 1;
      rerollMode = 'increase';
      continue;
    }

    if (roll === 0) {
      if (currentStep <= minStep) {
        rerollMode = undefined;
        continue;
      }
      currentStep -= 1;
      netStepChange -= 1;
      rerollMode = 'decrease';
      continue;
    }

    const baseValue = getGemValueByStep(currentStep);

    switch (roll) {
      case 2:
        return {
          finalBaseStep: currentStep,
          value: baseValue * 2,
          adjustment: { type: 'double' },
        };
      case 3: {
        const percent = rollDice(6) * 10;
        return {
          finalBaseStep: currentStep,
          value: baseValue * (1 + percent / 100),
          adjustment: { type: 'increasePercent', percent },
        };
      }
      case 4:
      case 5:
      case 6:
      case 7:
      case 8: {
        let adjustment: TreasureGemValueAdjustment = { type: 'unchanged' };
        if (netStepChange > 0) {
          adjustment = { type: 'stepIncrease', steps: netStepChange };
        } else if (netStepChange < 0) {
          adjustment = {
            type: 'stepDecrease',
            steps: Math.abs(netStepChange),
          };
        }
        return {
          finalBaseStep: currentStep,
          value: baseValue,
          adjustment,
        };
      }
      case 9: {
        const percent = rollDice(4) * 10;
        return {
          finalBaseStep: currentStep,
          value: baseValue * (1 - percent / 100),
          adjustment: { type: 'decreasePercent', percent },
        };
      }
      default:
        break;
    }
  }
}

function rollD10Digit(): number {
  const roll = rollDice(10);
  return roll === 10 ? 0 : roll;
}

function gemSizeForStep(step: number): string {
  const clampedStep = clampGemValueStep(step);
  const value = getGemValueByStep(clampedStep);
  const match = GEM_SIZE_THRESHOLDS.find((entry) => value <= entry.maxValue);
  return match ? match.label : 'huge';
}

type JewelryValueClass = {
  range: [number, number];
  material: string;
  hasGems: boolean;
  dice: { count: number; sides: number; multiplier: number };
  maxValue: number;
};

type JewelryTypeEntry = {
  range: [number, number];
  type: string;
};

const JEWELRY_VALUE_CLASSES: JewelryValueClass[] = [
  {
    range: [1, 10],
    material: 'ivory or wrought silver',
    hasGems: false,
    dice: { count: 1, sides: 10, multiplier: 100 },
    maxValue: 1000,
  },
  {
    range: [11, 20],
    material: 'wrought silver and gold',
    hasGems: false,
    dice: { count: 2, sides: 6, multiplier: 100 },
    maxValue: 1200,
  },
  {
    range: [21, 40],
    material: 'wrought gold',
    hasGems: false,
    dice: { count: 3, sides: 6, multiplier: 100 },
    maxValue: 1800,
  },
  {
    range: [41, 50],
    material: 'jade, coral, or wrought platinum',
    hasGems: false,
    dice: { count: 5, sides: 6, multiplier: 100 },
    maxValue: 3000,
  },
  {
    range: [51, 70],
    material: 'silver with gems',
    hasGems: true,
    dice: { count: 1, sides: 6, multiplier: 1000 },
    maxValue: 6000,
  },
  {
    range: [71, 90],
    material: 'gold with gems',
    hasGems: true,
    dice: { count: 2, sides: 4, multiplier: 1000 },
    maxValue: 8000,
  },
  {
    range: [91, 100],
    material: 'platinum with gems',
    hasGems: true,
    dice: { count: 2, sides: 6, multiplier: 1000 },
    maxValue: 12000,
  },
];

const JEWELRY_TYPE_TABLE: JewelryTypeEntry[] = [
  { range: [1, 2], type: 'anklet' },
  { range: [3, 6], type: 'arm band' },
  { range: [7, 9], type: 'belt' },
  { range: [10, 12], type: 'box (small)' },
  { range: [13, 16], type: 'bracelet' },
  { range: [17, 19], type: 'brooch' },
  { range: [20, 21], type: 'buckle' },
  { range: [22, 25], type: 'chain' },
  { range: [26, 26], type: 'chalice' },
  { range: [27, 27], type: 'choker' },
  { range: [28, 30], type: 'clasp' },
  { range: [31, 32], type: 'coffer' },
  { range: [33, 33], type: 'collar' },
  { range: [34, 35], type: 'comb' },
  { range: [36, 36], type: 'coronet' },
  { range: [37, 37], type: 'crown' },
  { range: [38, 39], type: 'decanter' },
  { range: [40, 40], type: 'diadem' },
  { range: [41, 45], type: 'earring' },
  { range: [46, 47], type: 'fob' },
  { range: [48, 52], type: 'goblet' },
  { range: [53, 54], type: 'headband (fillet)' },
  { range: [55, 57], type: 'idol' },
  { range: [58, 59], type: 'locket' },
  { range: [60, 62], type: 'medal' },
  { range: [63, 68], type: 'medallion' },
  { range: [69, 75], type: 'necklace' },
  { range: [76, 78], type: 'pendant' },
  { range: [79, 83], type: 'pin' },
  { range: [84, 84], type: 'orb' },
  { range: [85, 93], type: 'ring' },
  { range: [94, 94], type: 'sceptre' },
  { range: [95, 96], type: 'seal' },
  { range: [97, 99], type: 'statuette' },
  { range: [100, 100], type: 'tiara' },
];

function generateJewelryPieces(count: number): TreasureJewelryPiece[] {
  const pieces: TreasureJewelryPiece[] = [];
  for (let i = 0; i < count; i++) {
    let classIndex = findJewelryValueClass(rollDice(100));
    let classInfo = getJewelryValueClass(classIndex);
    let value = rollJewelryValue(classInfo);
    let exceptionalQuality = false;

    while (rollDice(10) === 1) {
      exceptionalQuality = true;
      if (classIndex >= JEWELRY_VALUE_CLASSES.length - 1) {
        value = classInfo.maxValue;
        break;
      }
      classIndex += 1;
      classInfo = getJewelryValueClass(classIndex);
      value = rollJewelryValue(classInfo);
    }

    let exceptionalStone = false;
    if (classInfo.hasGems && rollDice(8) === 1) {
      exceptionalStone = true;
      let bonus = 5000;
      while (bonus < 640000 && rollDice(6) === 1) {
        bonus = Math.min(bonus * 2, 640000);
      }
      value += bonus;
    }

    pieces.push({
      type: rollJewelryType(),
      material: resolveMaterialVariant(classInfo.material),
      value,
      exceptionalQuality,
      exceptionalStone,
    });
  }
  return pieces;
}

function resolveMaterialVariant(material: string): string {
  if (material === 'ivory or wrought silver') {
    return rollDice(2) === 1 ? 'ivory' : 'wrought silver';
  }
  if (material === 'jade, coral, or wrought platinum') {
    const roll = rollDice(3);
    if (roll === 1) return 'jade';
    if (roll === 2) return 'coral';
    return 'wrought platinum';
  }
  return material;
}

function rollJewelryValue(info: JewelryValueClass): number {
  const base = rollDice(info.dice.sides, info.dice.count);
  return base * info.dice.multiplier;
}

function rollJewelryType(): string {
  const roll = rollDice(100);
  const entry = findByRange(JEWELRY_TYPE_TABLE, roll);
  return entry.type;
}

function findJewelryValueClass(roll: number): number {
  const index = JEWELRY_VALUE_CLASSES.findIndex((entry) =>
    isWithinRange(entry.range, roll)
  );
  if (index === -1) return JEWELRY_VALUE_CLASSES.length - 1;
  return index;
}

function getJewelryValueClass(index: number): JewelryValueClass {
  const length = JEWELRY_VALUE_CLASSES.length;
  if (length === 0) {
    throw new Error('No jewelry value classes configured');
  }
  const clamped = Math.min(Math.max(index, 0), length - 1);
  const result = JEWELRY_VALUE_CLASSES[clamped];
  if (!result) {
    throw new Error('Unable to resolve jewelry value class');
  }
  return result;
}

function findByRange<T extends { range: [number, number] }>(
  entries: T[],
  roll: number
): T {
  if (entries.length === 0) {
    throw new Error('No entries defined for jewelry lookup');
  }
  const found = entries.find((entry) => isWithinRange(entry.range, roll));
  const fallback = entries[entries.length - 1];
  if (!fallback) {
    throw new Error('Unable to resolve fallback jewelry entry');
  }
  return found ?? fallback;
}

function isWithinRange(range: [number, number], roll: number): boolean {
  return roll >= range[0] && roll <= range[1];
}
