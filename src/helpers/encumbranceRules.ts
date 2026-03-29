import type {
  ContainerLoadSummary,
  EncumbranceCatalogItem,
  EncumbranceDocument,
  EncumbranceInventoryItem,
  LoadBand,
  StrengthScore,
} from '../types/encumbrance';

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

const unencumberedBaseCapacityGp = 350;

const normalLoadBand: LoadBand = {
  id: 'normal',
  label: 'Unencumbered',
  movement: '12"',
};

const heavyLoadBand: LoadBand = {
  id: 'heavy',
  label: 'Heavy gear',
  movement: '9"',
};

const veryHeavyLoadBand: LoadBand = {
  id: 'very-heavy',
  label: 'Very heavy gear',
  movement: '6"',
};

const encumberedLoadBand: LoadBand = {
  id: 'encumbered',
  label: 'Encumbered',
  movement: '3"-4"',
};

const getChildItems = (
  inventory: EncumbranceInventoryItem[],
  containerId: string | null
): EncumbranceInventoryItem[] =>
  inventory.filter((item) => item.containerId === containerId);

const getOwnEncumbrance = (
  item: EncumbranceInventoryItem,
  catalogById: Map<string, EncumbranceCatalogItem>
): number =>
  (typeof item.encumbranceGpOverride === 'number'
    ? item.encumbranceGpOverride
    : catalogById.get(item.catalogId)?.encumbranceGp || 0) * item.quantity;

const getOwnValueGp = (
  item: EncumbranceInventoryItem,
  catalogById: Map<string, EncumbranceCatalogItem>
): number => (catalogById.get(item.catalogId)?.valueGp || 0) * item.quantity;

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
): number =>
  unencumberedBaseCapacityGp + getStrengthWeightAllowanceGp(strength);

export const getEffectiveLoadGp = (
  totalEncumbranceGp: number,
  strength: StrengthScore
): number =>
  Math.max(0, totalEncumbranceGp - getStrengthCarryingCapacityGp(strength));

export const getLoadBand = (effectiveLoadGp: number): LoadBand => {
  if (effectiveLoadGp <= 350) {
    return normalLoadBand;
  }

  if (effectiveLoadGp <= 700) {
    return heavyLoadBand;
  }

  if (effectiveLoadGp <= 1050) {
    return veryHeavyLoadBand;
  }

  return encumberedLoadBand;
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
  document: EncumbranceDocument,
  catalogById: Map<string, EncumbranceCatalogItem>
): number =>
  getChildItems(document.inventory, null).reduce(
    (total, item) =>
      total + getInventoryItemTotalGp(item.id, document.inventory, catalogById),
    0
  );

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

export const getTotalValueGp = (
  document: EncumbranceDocument,
  catalogById: Map<string, EncumbranceCatalogItem>
): number =>
  getChildItems(document.inventory, null).reduce(
    (total, item) =>
      total +
      getInventoryItemTotalValueGp(item.id, document.inventory, catalogById),
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

  const containerInfo = catalogById.get(containerItem.catalogId);
  if (!containerInfo?.isContainer) {
    return undefined;
  }

  const children = getChildItems(inventory, containerId);

  if (containerInfo.ammoCapacity) {
    const matchingChildren = children.filter((child) => {
      const childInfo = catalogById.get(child.catalogId);
      return childInfo?.ammoKind === containerInfo.ammoCapacity?.ammoKind;
    });

    const mismatchedItemIds = children
      .filter((child) => {
        const childInfo = catalogById.get(child.catalogId);
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
    const info = catalogById.get(item.catalogId);
    if (!info?.isContainer) {
      return count;
    }

    const summary = getContainerLoadSummary(item.id, inventory, catalogById);
    return summary?.isOverCapacity ? count + 1 : count;
  }, 0);
