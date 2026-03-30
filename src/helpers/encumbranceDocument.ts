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
  EncumbranceDocumentV4,
  EncumbranceDocumentV5,
  EncumbranceInventoryItem,
  EncumbranceInventoryItemV4,
  EquipmentCategory,
  ExceptionalStrengthTier,
  LegacyEncumbranceInventoryItem,
  MagicKnowledge,
  StrengthScore,
} from '../types/encumbrance';

const DOCUMENT_VERSION = 5;

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
const magicKnowledgeStates = new Set<MagicKnowledge>([
  'unknown',
  'known-mundane',
  'known-magical',
]);

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

const isInventoryItemV4 = (
  value: unknown
): value is EncumbranceInventoryItemV4 => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncumbranceInventoryItemV4>;

  return (
    isLegacyInventoryItem(value) &&
    typeof candidate.notes === 'string' &&
    (candidate.nameOverride === undefined ||
      typeof candidate.nameOverride === 'string') &&
    (candidate.encumbranceGpOverride === undefined ||
      isNonNegativeNumber(candidate.encumbranceGpOverride))
  );
};

const isInventoryItem = (value: unknown): value is EncumbranceInventoryItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncumbranceInventoryItem>;

  return (
    isLegacyInventoryItem(value) &&
    typeof candidate.day === 'number' &&
    Number.isInteger(candidate.day) &&
    candidate.day >= 0 &&
    typeof candidate.playerNotes === 'string' &&
    typeof candidate.playerMagicKnowledge === 'string' &&
    magicKnowledgeStates.has(candidate.playerMagicKnowledge) &&
    (candidate.name === undefined || typeof candidate.name === 'string') &&
    (candidate.dmNotes === undefined ||
      typeof candidate.dmNotes === 'string') &&
    (candidate.isMagical === undefined ||
      typeof candidate.isMagical === 'boolean') &&
    (candidate.fullyIdentified === undefined ||
      typeof candidate.fullyIdentified === 'boolean') &&
    (candidate.encumbranceGpOverride === undefined ||
      isNonNegativeNumber(candidate.encumbranceGpOverride))
  );
};

const isDocumentKind = (value: unknown): value is EncumbranceDocumentKind =>
  value === 'adnd-encumbrance-dm' || value === 'adnd-encumbrance-player';

const isSupportedDocumentVersion = (
  value: unknown
): value is
  | EncumbranceDocumentV1['version']
  | EncumbranceDocumentV2['version']
  | EncumbranceDocumentV3['version']
  | EncumbranceDocumentV4['version']
  | EncumbranceDocumentV5['version'] =>
  value === 1 || value === 2 || value === 3 || value === 4 || value === 5;

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

const sanitizeLegacyInventoryItem = (
  item: LegacyEncumbranceInventoryItem | EncumbranceInventoryItemV4,
  kind: EncumbranceDocumentKind
): EncumbranceInventoryItem => {
  const legacyItem = item as Partial<EncumbranceInventoryItemV4>;
  const migratedName =
    typeof legacyItem.nameOverride === 'string' &&
    legacyItem.nameOverride.trim()
      ? legacyItem.nameOverride.trim()
      : undefined;

  return {
    id: item.id,
    catalogId: item.catalogId,
    quantity: item.quantity,
    containerId: item.containerId,
    day: 0,
    playerNotes: typeof legacyItem.notes === 'string' ? legacyItem.notes : '',
    playerMagicKnowledge: 'unknown',
    ...(migratedName
      ? {
          name: migratedName,
        }
      : {}),
    ...(typeof legacyItem.encumbranceGpOverride === 'number'
      ? {
          encumbranceGpOverride: legacyItem.encumbranceGpOverride,
        }
      : {}),
    ...(kind === 'adnd-encumbrance-dm'
      ? {
          dmNotes: '',
        }
      : {}),
  };
};

const sanitizeInventoryItem = (
  item: EncumbranceInventoryItem,
  kind: EncumbranceDocumentKind
): EncumbranceInventoryItem => {
  const sanitizedName =
    typeof item.name === 'string' && item.name.trim()
      ? item.name.trim()
      : undefined;
  const sanitizedPlayerNotes = item.playerNotes;
  const sanitizedDmNotes =
    kind === 'adnd-encumbrance-dm' && typeof item.dmNotes === 'string'
      ? item.dmNotes
      : undefined;
  const sanitizedIsMagical =
    kind === 'adnd-encumbrance-dm' && typeof item.isMagical === 'boolean'
      ? item.isMagical
      : undefined;
  const sanitizedFullyIdentified =
    kind === 'adnd-encumbrance-dm' &&
    sanitizedIsMagical &&
    item.fullyIdentified === true
      ? true
      : undefined;

  return {
    id: item.id,
    catalogId: item.catalogId,
    quantity: item.quantity,
    containerId: item.containerId,
    day: item.day,
    playerNotes: sanitizedPlayerNotes,
    playerMagicKnowledge: item.playerMagicKnowledge,
    ...(sanitizedName
      ? {
          name: sanitizedName,
        }
      : {}),
    ...(typeof item.encumbranceGpOverride === 'number'
      ? {
          encumbranceGpOverride: item.encumbranceGpOverride,
        }
      : {}),
    ...(sanitizedDmNotes !== undefined
      ? {
          dmNotes: sanitizedDmNotes,
        }
      : {}),
    ...(sanitizedIsMagical !== undefined
      ? {
          isMagical: sanitizedIsMagical,
        }
      : {}),
    ...(sanitizedFullyIdentified
      ? {
          fullyIdentified: true,
        }
      : {}),
  };
};

const sanitizeDocument = (
  candidate: AnyEncumbranceDocument
): EncumbranceDocumentV5 => ({
  kind: candidate.kind,
  version: DOCUMENT_VERSION,
  character: {
    name: candidate.character.name,
    strength: candidate.character.strength,
  },
  inventory: candidate.inventory.map((item) =>
    candidate.version === 5
      ? sanitizeInventoryItem(item as EncumbranceInventoryItem, candidate.kind)
      : sanitizeLegacyInventoryItem(
          item as LegacyEncumbranceInventoryItem | EncumbranceInventoryItemV4,
          candidate.kind
        )
  ),
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
): EncumbranceDocumentV5 => ({
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
): EncumbranceDocumentV5 => ({
  kind: 'adnd-encumbrance-player',
  version: DOCUMENT_VERSION,
  character: {
    name: document.character.name,
    strength: document.character.strength,
  },
  inventory: document.inventory.map((item) =>
    sanitizeInventoryItem(item, 'adnd-encumbrance-player')
  ),
  customItems:
    'customItems' in document && Array.isArray(document.customItems)
      ? document.customItems.map((item) => sanitizeCatalogItem(item))
      : [],
});

export const parseEncumbranceDocument = (
  text: string
): EncumbranceDocumentV5 => {
  const rawValue = JSON.parse(text) as Partial<AnyEncumbranceDocument>;

  if (
    !isDocumentKind(rawValue.kind) ||
    !isSupportedDocumentVersion(rawValue.version) ||
    !rawValue.character ||
    typeof rawValue.character.name !== 'string' ||
    !isStrengthScore(rawValue.character.strength) ||
    !Array.isArray(rawValue.inventory) ||
    !rawValue.inventory.every((item) =>
      rawValue.version === 5
        ? isInventoryItem(item)
        : rawValue.version === 3 || rawValue.version === 4
        ? isInventoryItemV4(item)
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
    (rawValue.version === 3 ||
      rawValue.version === 4 ||
      rawValue.version === 5) &&
    rawValue.customItems !== undefined &&
    (!Array.isArray(rawValue.customItems) ||
      !rawValue.customItems.every((item) => isCatalogItem(item)))
  ) {
    throw new Error('Custom items are not valid.');
  }

  return sanitizeDocument(rawValue as AnyEncumbranceDocument);
};
