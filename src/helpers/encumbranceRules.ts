import type {
  ContainerLoadSummary,
  EncumbranceCatalogItem,
  EncumbranceCharacterSheet,
  EncumbranceInventoryItem,
  LoadBand,
  StrengthScore,
} from '../types/encumbrance';

import { encumbranceCatalogById } from '../tables/encumbranceCatalog';

export function inventoryCatalog(
  holders: readonly Pick<EncumbranceCharacterSheet, 'inventory'>[]
) {
  const catalog = new Map(encumbranceCatalogById);
  for (const holder of holders) {
    for (const item of holder.inventory) {
      if (item.customItem) catalog.set(item.catalogId, item.customItem);
    }
  }
  return catalog;
}

const defaultWeightAllowanceByScore = new Map<number, number>([
  [3, -350],
  [4, -250],
  [5, -250],
  [6, -150],
  [7, -150],
  [8, 0],
  [9, 0],
  [10, 0],
  [11, 0],
  [12, 100],
  [13, 100],
  [14, 200],
  [15, 200],
  [16, 350],
  [17, 500],
  [18, 750],
]);

const exceptionalWeightAllowance = new Map<string, number>([
  ['01-50', 1000],
  ['51-75', 1250],
  ['76-90', 1500],
  ['91-99', 2000],
  ['00', 3000],
]);

// Upper-inclusive limits before applying Strength; the last band is open-ended.
export const loadBands = [
  { id: 'normal', label: 'Unencumbered', movement: '12"', limit: 350 },
  { id: 'heavy', label: 'Heavy gear', movement: '9"', limit: 700 },
  { id: 'very-heavy', label: 'Very heavy gear', movement: '6"', limit: 1050 },
  { id: 'encumbered', label: 'Encumbered', movement: '3"-4"', limit: 1500 },
  { id: 'immobile', label: 'Immobile', movement: '0"', limit: Infinity },
] as const;

const getChildItems = (
  inventory: EncumbranceInventoryItem[],
  containerId: string | null
): EncumbranceInventoryItem[] =>
  inventory.filter((item) => item.containerId === containerId);

export const getInventoryItemInfo = (
  item: EncumbranceInventoryItem,
  catalogById: Map<string, EncumbranceCatalogItem>
): EncumbranceCatalogItem | undefined =>
  item.customItem || catalogById.get(item.catalogId);

const getOwnEncumbrance = (
  item: EncumbranceInventoryItem,
  catalogById: Map<string, EncumbranceCatalogItem>
): number =>
  (typeof item.encumbranceGpOverride === 'number'
    ? item.encumbranceGpOverride
    : getInventoryItemInfo(item, catalogById)?.encumbranceGp || 0) *
  item.quantity;

const getOwnValueGp = (
  item: EncumbranceInventoryItem,
  catalogById: Map<string, EncumbranceCatalogItem>
): number =>
  (typeof item.valueGpOverride === 'number'
    ? item.valueGpOverride
    : getInventoryItemInfo(item, catalogById)?.valueGp || 0) * item.quantity;

const getOwnKnownValueGp = (
  item: EncumbranceInventoryItem,
  catalogById: Map<string, EncumbranceCatalogItem>
): number => (item.playerKnowsValue ? getOwnValueGp(item, catalogById) : 0);

export const getStrengthWeightAllowanceGp = (
  strength: StrengthScore
): number => {
  if (strength.score === 18 && strength.exceptional !== 'none') {
    return exceptionalWeightAllowance.get(strength.exceptional) || 1000;
  }

  return defaultWeightAllowanceByScore.get(strength.score) || 0;
};

export const getStrengthCarryingCapacityGp = (
  strength: StrengthScore
): number => loadBands[0].limit + getStrengthWeightAllowanceGp(strength);

export const getEffectiveLoadGp = (
  totalEncumbranceGp: number,
  strength: StrengthScore
): number =>
  // The base 350 gp belongs to the band thresholds, not this adjustment.
  Math.max(0, totalEncumbranceGp - getStrengthWeightAllowanceGp(strength));

export const getLoadBand = (effectiveLoadGp: number): LoadBand => {
  const { id, label, movement } =
    loadBands.find((band) => effectiveLoadGp <= band.limit) ?? loadBands[4];
  return { id, label, movement };
};

export const getInventoryItemTotalGp = (
  itemId: string,
  inventory: EncumbranceInventoryItem[],
  catalogById: Map<string, EncumbranceCatalogItem>
): number => {
  const item = inventory.find((candidate) => candidate.id === itemId);
  if (!item) {
    return 0;
  }

  const children = getChildItems(inventory, itemId);
  const itemInfo = getInventoryItemInfo(item, catalogById);
  if (itemInfo?.ignoresContentsWeightForEncumbrance) {
    return getOwnEncumbrance(item, catalogById);
  }

  return (
    getOwnEncumbrance(item, catalogById) +
    children.reduce(
      (total, child) =>
        total + getInventoryItemTotalGp(child.id, inventory, catalogById),
      0
    )
  );
};

export const getTotalEncumbranceGp = (
  character: Pick<EncumbranceCharacterSheet, 'inventory'>,
  catalogById: Map<string, EncumbranceCatalogItem>,
  wornBodyArmorId?: string
): number =>
  getChildItems(character.inventory, null).reduce((total, item) => {
    const carried = getInventoryItemTotalGp(
      item.id,
      character.inventory,
      catalogById
    );
    // PHB p. 36 / DMG p. 164: exempt only the single magical suit being worn.
    // Other copies in the stack and any contents retain their normal load.
    const worn =
      item.id === wornBodyArmorId && item.isMagical && item.quantity > 0
        ? getOwnEncumbrance(item, catalogById) / item.quantity
        : 0;
    return total + carried - worn;
  }, 0);

export const getInventoryItemTotalValueGp = (
  itemId: string,
  inventory: EncumbranceInventoryItem[],
  catalogById: Map<string, EncumbranceCatalogItem>
): number => {
  const item = inventory.find((candidate) => candidate.id === itemId);
  if (!item) {
    return 0;
  }

  const children = getChildItems(inventory, itemId);
  return (
    getOwnValueGp(item, catalogById) +
    children.reduce(
      (total, child) =>
        total + getInventoryItemTotalValueGp(child.id, inventory, catalogById),
      0
    )
  );
};

export const getInventoryItemTotalKnownValueGp = (
  itemId: string,
  inventory: EncumbranceInventoryItem[],
  catalogById: Map<string, EncumbranceCatalogItem>
): number => {
  const item = inventory.find((candidate) => candidate.id === itemId);
  if (!item) {
    return 0;
  }

  const children = getChildItems(inventory, itemId);
  return (
    getOwnKnownValueGp(item, catalogById) +
    children.reduce(
      (total, child) =>
        total +
        getInventoryItemTotalKnownValueGp(child.id, inventory, catalogById),
      0
    )
  );
};

export const getTotalValueGp = (
  character: Pick<EncumbranceCharacterSheet, 'inventory'>,
  catalogById: Map<string, EncumbranceCatalogItem>
): number =>
  getChildItems(character.inventory, null).reduce(
    (total, item) =>
      total +
      getInventoryItemTotalValueGp(item.id, character.inventory, catalogById),
    0
  );

export const getTotalKnownValueGp = (
  character: Pick<EncumbranceCharacterSheet, 'inventory'>,
  catalogById: Map<string, EncumbranceCatalogItem>
): number =>
  getChildItems(character.inventory, null).reduce(
    (total, item) =>
      total +
      getInventoryItemTotalKnownValueGp(
        item.id,
        character.inventory,
        catalogById
      ),
    0
  );

export const getContainerLoadSummary = (
  containerId: string,
  inventory: EncumbranceInventoryItem[],
  catalogById: Map<string, EncumbranceCatalogItem>
): ContainerLoadSummary | undefined => {
  const containerItem = inventory.find((item) => item.id === containerId);
  if (!containerItem) {
    return undefined;
  }

  const containerInfo = getInventoryItemInfo(containerItem, catalogById);
  if (!containerInfo?.isContainer) {
    return undefined;
  }

  const children = getChildItems(inventory, containerId);

  if (containerInfo.ammoCapacity) {
    const matchingChildren = children.filter((child) => {
      const childInfo = getInventoryItemInfo(child, catalogById);
      return childInfo?.ammoKind === containerInfo.ammoCapacity?.ammoKind;
    });

    const mismatchedItemIds = children
      .filter((child) => {
        const childInfo = getInventoryItemInfo(child, catalogById);
        return childInfo?.ammoKind !== containerInfo.ammoCapacity?.ammoKind;
      })
      .map((child) => child.id);

    const used = matchingChildren.reduce(
      (total, child) => total + child.quantity,
      0
    );
    return {
      used,
      capacity: containerInfo.ammoCapacity.quantity,
      unitLabel: 'items',
      isOverCapacity:
        used > containerInfo.ammoCapacity.quantity ||
        mismatchedItemIds.length > 0,
      mismatchedItemIds,
    };
  }

  const used = children.reduce(
    (total, child) =>
      total + getInventoryItemTotalGp(child.id, inventory, catalogById),
    0
  );

  return {
    used,
    capacity: containerInfo.capacityGp || 0,
    unitLabel: 'gp',
    isOverCapacity:
      typeof containerInfo.capacityGp === 'number' &&
      used > containerInfo.capacityGp,
    mismatchedItemIds: [],
  };
};

export const getDescendantIds = (
  inventory: EncumbranceInventoryItem[],
  itemId: string
): string[] => {
  const directChildren = getChildItems(inventory, itemId);
  return directChildren.flatMap((child) => [
    child.id,
    ...getDescendantIds(inventory, child.id),
  ]);
};

export const getContainerWarningCount = (
  inventory: EncumbranceInventoryItem[],
  catalogById: Map<string, EncumbranceCatalogItem>
): number =>
  inventory.reduce((count, item) => {
    const info = getInventoryItemInfo(item, catalogById);
    if (!info?.isContainer) {
      return count;
    }

    const summary = getContainerLoadSummary(item.id, inventory, catalogById);
    return summary?.isOverCapacity ? count + 1 : count;
  }, 0);
