import type {
  AmmoCapacityRule,
  AmmoKind,
  AnyEncumbranceDocument,
  EncumbranceCatalogItem,
  EncumbranceCustomItem,
  EncumbranceDocument,
  EncumbranceDocumentKind,
  EncumbranceDocumentV1,
  EncumbranceDocumentV2,
  EncumbranceDocumentV3,
  EncumbranceInventoryItem,
  EquipmentCategory,
  ExceptionalStrengthTier,
  LegacyEncumbranceInventoryItem,
  StrengthScore,
} from '../types/encumbrance';

const DOCUMENT_VERSION = 3;

const exceptionalStrengthTiers = new Set<ExceptionalStrengthTier>([
  'none',
  '01-50',
  '51-75',
  '76-90',
  '91-99',
  '00',
]);

const equipmentCategories = new Set<EquipmentCategory>([
  'containers',
  'armor',
  'weapons',
  'ammunition',
  'gear',
  'provisions',
  'treasure',
  'coins',
]);

const ammoKinds = new Set<AmmoKind>(['arrow', 'bolt']);

const isStrengthScore = (value: unknown): value is StrengthScore => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StrengthScore>;
  return (
    typeof candidate.score === 'number' &&
    candidate.score >= 3 &&
    candidate.score <= 18 &&
    typeof candidate.exceptional === 'string' &&
    exceptionalStrengthTiers.has(candidate.exceptional)
  );
};

const isPositiveWholeNumber = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 1 &&
  Number.isInteger(value);

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isLegacyInventoryItem = (
  value: unknown
): value is LegacyEncumbranceInventoryItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LegacyEncumbranceInventoryItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.catalogId === 'string' &&
    isPositiveWholeNumber(candidate.quantity) &&
    (candidate.containerId === null ||
      typeof candidate.containerId === 'string')
  );
};

const isInventoryItem = (value: unknown): value is EncumbranceInventoryItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    isLegacyInventoryItem(value) &&
    typeof (value as { notes?: unknown }).notes === 'string'
  );
};

const isDocumentKind = (value: unknown): value is EncumbranceDocumentKind =>
  value === 'adnd-encumbrance-dm' || value === 'adnd-encumbrance-player';

const isSupportedDocumentVersion = (
  value: unknown
): value is
  | EncumbranceDocumentV1['version']
  | EncumbranceDocumentV2['version']
  | EncumbranceDocumentV3['version'] =>
  value === 1 || value === 2 || value === 3;

const isAmmoCapacityRule = (value: unknown): value is AmmoCapacityRule => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AmmoCapacityRule>;
  return (
    typeof candidate.ammoKind === 'string' &&
    ammoKinds.has(candidate.ammoKind) &&
    isPositiveWholeNumber(candidate.quantity)
  );
};

const isCatalogItem = (value: unknown): value is EncumbranceCatalogItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncumbranceCatalogItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.category === 'string' &&
    equipmentCategories.has(candidate.category) &&
    isNonNegativeNumber(candidate.encumbranceGp) &&
    isNonNegativeNumber(candidate.valueGp) &&
    (candidate.isContainer === undefined ||
      typeof candidate.isContainer === 'boolean') &&
    (candidate.capacityGp === undefined ||
      isNonNegativeNumber(candidate.capacityGp)) &&
    (candidate.ammoKind === undefined ||
      (typeof candidate.ammoKind === 'string' &&
        ammoKinds.has(candidate.ammoKind))) &&
    (candidate.ammoCapacity === undefined ||
      isAmmoCapacityRule(candidate.ammoCapacity))
  );
};

const sanitizeCatalogItem = (
  candidate: EncumbranceCatalogItem
): EncumbranceCustomItem => ({
  id: candidate.id,
  name: candidate.name,
  category: candidate.category,
  encumbranceGp: candidate.encumbranceGp,
  valueGp: candidate.valueGp,
  ...(candidate.isContainer
    ? {
        isContainer: true,
      }
    : {}),
  ...(typeof candidate.capacityGp === 'number'
    ? {
        capacityGp: candidate.capacityGp,
      }
    : {}),
  ...(candidate.ammoKind
    ? {
        ammoKind: candidate.ammoKind,
      }
    : {}),
  ...(candidate.ammoCapacity
    ? {
        ammoCapacity: {
          ammoKind: candidate.ammoCapacity.ammoKind,
          quantity: candidate.ammoCapacity.quantity,
        },
      }
    : {}),
});

const sanitizeInventoryItem = (
  item: LegacyEncumbranceInventoryItem | EncumbranceInventoryItem
): EncumbranceInventoryItem => ({
  id: item.id,
  catalogId: item.catalogId,
  quantity: item.quantity,
  containerId: item.containerId,
  notes:
    typeof (item as Partial<EncumbranceInventoryItem>).notes === 'string'
      ? (item as EncumbranceInventoryItem).notes
      : '',
});

const sanitizeDocument = (
  candidate: AnyEncumbranceDocument
): EncumbranceDocumentV3 => ({
  kind: candidate.kind,
  version: DOCUMENT_VERSION,
  character: {
    name: candidate.character.name,
    strength: candidate.character.strength,
  },
  inventory: candidate.inventory.map((item) => sanitizeInventoryItem(item)),
  customItems:
    'customItems' in candidate && Array.isArray(candidate.customItems)
      ? candidate.customItems.map((item) => sanitizeCatalogItem(item))
      : [],
  ...(candidate.kind === 'adnd-encumbrance-dm'
    ? {
        dm: {
          privateNotes: candidate.dm?.privateNotes || '',
        },
      }
    : {}),
});

export const createEmptyEncumbranceDocument = (
  kind: EncumbranceDocumentKind = 'adnd-encumbrance-dm'
): EncumbranceDocumentV3 => ({
  kind,
  version: DOCUMENT_VERSION,
  character: {
    name: '',
    strength: {
      score: 8,
      exceptional: 'none',
    },
  },
  inventory: [],
  customItems: [],
  ...(kind === 'adnd-encumbrance-dm'
    ? {
        dm: {
          privateNotes: '',
        },
      }
    : {}),
});

export const redactEncumbranceDocument = (
  document: EncumbranceDocument
): EncumbranceDocumentV3 => ({
  kind: 'adnd-encumbrance-player',
  version: DOCUMENT_VERSION,
  character: {
    name: document.character.name,
    strength: document.character.strength,
  },
  inventory: document.inventory.map((item) => sanitizeInventoryItem(item)),
  customItems:
    'customItems' in document && Array.isArray(document.customItems)
      ? document.customItems.map((item) => sanitizeCatalogItem(item))
      : [],
});

export const parseEncumbranceDocument = (
  text: string
): EncumbranceDocumentV3 => {
  const rawValue = JSON.parse(text) as Partial<AnyEncumbranceDocument>;

  if (
    !isDocumentKind(rawValue.kind) ||
    !isSupportedDocumentVersion(rawValue.version) ||
    !rawValue.character ||
    typeof rawValue.character.name !== 'string' ||
    !isStrengthScore(rawValue.character.strength) ||
    !Array.isArray(rawValue.inventory) ||
    !rawValue.inventory.every((item) =>
      rawValue.version === 3
        ? isInventoryItem(item)
        : isLegacyInventoryItem(item)
    )
  ) {
    throw new Error('File is not a supported encumbrance document.');
  }

  if (
    rawValue.kind === 'adnd-encumbrance-dm' &&
    rawValue.dm &&
    (typeof rawValue.dm !== 'object' ||
      typeof rawValue.dm.privateNotes !== 'string')
  ) {
    throw new Error('DM notes are not valid.');
  }

  if (
    rawValue.version === 3 &&
    rawValue.customItems !== undefined &&
    (!Array.isArray(rawValue.customItems) ||
      !rawValue.customItems.every((item) => isCatalogItem(item)))
  ) {
    throw new Error('Custom items are not valid.');
  }

  return sanitizeDocument(rawValue as AnyEncumbranceDocument);
};
