import type {
  AmmoCapacityRule,
  AmmoKind,
  AnyEncumbranceDocument,
  EncumbranceCatalogItem,
  EncumbranceCustomItem,
  EncumbranceDmCharacter,
  EncumbranceDmDocumentV7,
  EncumbranceDocument,
  EncumbranceDocumentKind,
  EncumbranceDocumentV1,
  EncumbranceDocumentV2,
  EncumbranceDocumentV3,
  EncumbranceDocumentV4,
  EncumbranceDocumentV5,
  EncumbranceDocumentV6,
  EncumbranceInventoryItem,
  EncumbranceInventoryItemV4,
  EncumbranceInventoryItemV5,
  EncumbrancePlayerCharacter,
  EncumbrancePlayerDocumentV7,
  EquipmentCategory,
  ExceptionalStrengthTier,
  LegacyEncumbranceInventoryItem,
  MagicKnowledge,
  StrengthScore,
} from '../types/encumbrance';

const DOCUMENT_VERSION = 7;

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
  'arms',
  'clothing',
  'herbs',
  'adventuring-gear',
  'provisions',
  'religious-items',
  'treasure',
  'coins',
]);

const legacyEquipmentCategories = new Set(['weapons', 'ammunition', 'gear']);

const ammoKinds = new Set<AmmoKind>(['arrow', 'bolt']);
const magicKnowledgeStates = new Set<MagicKnowledge>([
  'unknown',
  'known-mundane',
  'known-magical',
]);

const createCharacterId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `enc-character-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const defaultStrengthScore = (): StrengthScore => ({
  score: 8,
  exceptional: 'none',
});

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

const isCharacterId = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

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

const isInventoryItemV5 = (
  value: unknown
): value is EncumbranceInventoryItemV5 => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncumbranceInventoryItemV5>;

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

const isInventoryItem = (value: unknown): value is EncumbranceInventoryItem => {
  if (!isInventoryItemV5(value)) {
    return false;
  }

  const candidate = value as Partial<EncumbranceInventoryItem>;
  return typeof candidate.playerKnowsValue === 'boolean';
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
  | EncumbranceDocumentV5['version']
  | EncumbranceDocumentV6['version']
  | EncumbrancePlayerDocumentV7['version']
  | EncumbranceDmDocumentV7['version'] =>
  value === 1 ||
  value === 2 ||
  value === 3 ||
  value === 4 ||
  value === 5 ||
  value === 6 ||
  value === 7;

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

const normalizeEquipmentCategory = (
  category: unknown
): EquipmentCategory | null => {
  if (typeof category !== 'string') {
    return null;
  }

  if (equipmentCategories.has(category as EquipmentCategory)) {
    return category as EquipmentCategory;
  }

  if (!legacyEquipmentCategories.has(category)) {
    return null;
  }

  if (category === 'weapons' || category === 'ammunition') {
    return 'arms';
  }

  return 'adventuring-gear';
};

const isCatalogItem = (value: unknown): value is EncumbranceCatalogItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncumbranceCatalogItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    normalizeEquipmentCategory(candidate.category) !== null &&
    isNonNegativeNumber(candidate.encumbranceGp) &&
    isNonNegativeNumber(candidate.valueGp) &&
    (candidate.isContainer === undefined ||
      typeof candidate.isContainer === 'boolean') &&
    (candidate.capacityGp === undefined ||
      isNonNegativeNumber(candidate.capacityGp)) &&
    (candidate.ignoresContentsWeightForEncumbrance === undefined ||
      typeof candidate.ignoresContentsWeightForEncumbrance === 'boolean') &&
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
  category:
    normalizeEquipmentCategory(candidate.category) || 'adventuring-gear',
  encumbranceGp: candidate.encumbranceGp,
  valueGp: candidate.valueGp,
  ...(candidate.isContainer ? { isContainer: true } : {}),
  ...(typeof candidate.capacityGp === 'number'
    ? {
        capacityGp: candidate.capacityGp,
      }
    : {}),
  ...(candidate.ignoresContentsWeightForEncumbrance
    ? {
        ignoresContentsWeightForEncumbrance: true,
      }
    : {}),
  ...(candidate.ammoKind ? { ammoKind: candidate.ammoKind } : {}),
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
    playerKnowsValue: true,
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
  item: EncumbranceInventoryItemV5 | EncumbranceInventoryItem,
  kind: EncumbranceDocumentKind
): EncumbranceInventoryItem => {
  const candidate = item as Partial<EncumbranceInventoryItem>;
  const sanitizedName =
    typeof item.name === 'string' && item.name.trim()
      ? item.name.trim()
      : undefined;
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
    playerNotes: item.playerNotes,
    playerMagicKnowledge: item.playerMagicKnowledge,
    playerKnowsValue:
      typeof candidate.playerKnowsValue === 'boolean'
        ? candidate.playerKnowsValue
        : true,
    ...(sanitizedName ? { name: sanitizedName } : {}),
    ...(typeof item.encumbranceGpOverride === 'number'
      ? {
          encumbranceGpOverride: item.encumbranceGpOverride,
        }
      : {}),
    ...(sanitizedDmNotes !== undefined ? { dmNotes: sanitizedDmNotes } : {}),
    ...(sanitizedIsMagical !== undefined
      ? { isMagical: sanitizedIsMagical }
      : {}),
    ...(sanitizedFullyIdentified ? { fullyIdentified: true } : {}),
  };
};

const sanitizeCustomItems = (
  candidate: AnyEncumbranceDocument
): EncumbranceCustomItem[] =>
  'customItems' in candidate && Array.isArray(candidate.customItems)
    ? candidate.customItems.map((item) => sanitizeCatalogItem(item))
    : [];

const sanitizeInventoryCollection = (
  inventory:
    | LegacyEncumbranceInventoryItem[]
    | EncumbranceInventoryItemV4[]
    | EncumbranceInventoryItemV5[]
    | EncumbranceInventoryItem[],
  version: AnyEncumbranceDocument['version'],
  kind: EncumbranceDocumentKind
): EncumbranceInventoryItem[] =>
  inventory.map((item) =>
    version === 5 || version === 6 || version === 7
      ? sanitizeInventoryItem(
          item as EncumbranceInventoryItemV5 | EncumbranceInventoryItem,
          kind
        )
      : sanitizeLegacyInventoryItem(
          item as LegacyEncumbranceInventoryItem | EncumbranceInventoryItemV4,
          kind
        )
  );

const sanitizePlayerCharacter = (
  candidate: EncumbrancePlayerCharacter
): EncumbrancePlayerCharacter => ({
  id: candidate.id,
  name: candidate.name,
  strength: candidate.strength,
  inventory: candidate.inventory.map((item) =>
    sanitizeInventoryItem(item, 'adnd-encumbrance-player')
  ),
});

const sanitizeDmCharacter = (
  candidate: EncumbranceDmCharacter
): EncumbranceDmCharacter => ({
  id: candidate.id,
  name: candidate.name,
  strength: candidate.strength,
  inventory: candidate.inventory.map((item) =>
    sanitizeInventoryItem(item, 'adnd-encumbrance-dm')
  ),
  dmNotes: candidate.dmNotes,
});

const isPlayerCharacter = (
  value: unknown
): value is EncumbrancePlayerCharacter => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncumbrancePlayerCharacter>;
  return (
    isCharacterId(candidate.id) &&
    typeof candidate.name === 'string' &&
    isStrengthScore(candidate.strength) &&
    Array.isArray(candidate.inventory) &&
    candidate.inventory.every((item) => isInventoryItem(item))
  );
};

const isDmCharacter = (value: unknown): value is EncumbranceDmCharacter => {
  if (!isPlayerCharacter(value)) {
    return false;
  }

  const candidate = value as Partial<EncumbranceDmCharacter>;
  return typeof candidate.dmNotes === 'string';
};

const sanitizeDocument = (
  candidate: AnyEncumbranceDocument
): EncumbranceDocument => {
  if (candidate.version === 7) {
    if (candidate.kind === 'adnd-encumbrance-player') {
      return {
        kind: 'adnd-encumbrance-player',
        version: DOCUMENT_VERSION,
        character: sanitizePlayerCharacter(candidate.character),
        customItems: sanitizeCustomItems(candidate),
      };
    }

    const sanitizedCharacters = candidate.characters.map((character) =>
      sanitizeDmCharacter(character)
    );
    const activeCharacterId = sanitizedCharacters.some(
      (character) => character.id === candidate.activeCharacterId
    )
      ? candidate.activeCharacterId
      : sanitizedCharacters[0]?.id || createCharacterId();

    return {
      kind: 'adnd-encumbrance-dm',
      version: DOCUMENT_VERSION,
      activeCharacterId,
      characters: sanitizedCharacters,
      customItems: sanitizeCustomItems(candidate),
    };
  }

  const migratedCharacterId = createCharacterId();
  const migratedInventory = sanitizeInventoryCollection(
    candidate.inventory,
    candidate.version,
    candidate.kind
  );
  const migratedCharacterBase = {
    id: migratedCharacterId,
    name: candidate.character.name,
    strength: candidate.character.strength,
  };

  if (candidate.kind === 'adnd-encumbrance-player') {
    return {
      kind: 'adnd-encumbrance-player',
      version: DOCUMENT_VERSION,
      character: {
        ...migratedCharacterBase,
        inventory: migratedInventory.map((item) =>
          sanitizeInventoryItem(item, 'adnd-encumbrance-player')
        ),
      },
      customItems: sanitizeCustomItems(candidate),
    };
  }

  return {
    kind: 'adnd-encumbrance-dm',
    version: DOCUMENT_VERSION,
    activeCharacterId: migratedCharacterId,
    characters: [
      {
        ...migratedCharacterBase,
        inventory: migratedInventory.map((item) =>
          sanitizeInventoryItem(item, 'adnd-encumbrance-dm')
        ),
        dmNotes: candidate.dm?.privateNotes || '',
      },
    ],
    customItems: sanitizeCustomItems(candidate),
  };
};

export const createEmptyEncumbranceDmCharacter = (
  name = ''
): EncumbranceDmCharacter => ({
  id: createCharacterId(),
  name,
  strength: defaultStrengthScore(),
  inventory: [],
  dmNotes: '',
});

const createEmptyEncumbrancePlayerCharacter =
  (): EncumbrancePlayerCharacter => ({
    id: createCharacterId(),
    name: '',
    strength: defaultStrengthScore(),
    inventory: [],
  });

export const createEmptyEncumbranceDocument = (
  kind: EncumbranceDocumentKind = 'adnd-encumbrance-dm'
): EncumbranceDocument => {
  if (kind === 'adnd-encumbrance-dm') {
    const character = createEmptyEncumbranceDmCharacter();
    return {
      kind,
      version: DOCUMENT_VERSION,
      activeCharacterId: character.id,
      characters: [character],
      customItems: [],
    };
  }

  return {
    kind,
    version: DOCUMENT_VERSION,
    character: createEmptyEncumbrancePlayerCharacter(),
    customItems: [],
  };
};

export const redactEncumbranceDocument = (
  document: EncumbranceDocument,
  characterId?: string
): EncumbrancePlayerDocumentV7 => {
  if (document.kind === 'adnd-encumbrance-player') {
    return {
      kind: 'adnd-encumbrance-player',
      version: DOCUMENT_VERSION,
      character: sanitizePlayerCharacter(document.character),
      customItems: document.customItems.map((item) =>
        sanitizeCatalogItem(item)
      ),
    };
  }

  const selectedCharacter =
    document.characters.find((character) => character.id === characterId) ||
    document.characters.find(
      (character) => character.id === document.activeCharacterId
    ) ||
    document.characters[0];

  if (!selectedCharacter) {
    return {
      kind: 'adnd-encumbrance-player',
      version: DOCUMENT_VERSION,
      character: createEmptyEncumbrancePlayerCharacter(),
      customItems: document.customItems.map((item) =>
        sanitizeCatalogItem(item)
      ),
    };
  }

  return {
    kind: 'adnd-encumbrance-player',
    version: DOCUMENT_VERSION,
    character: {
      id: selectedCharacter.id,
      name: selectedCharacter.name,
      strength: selectedCharacter.strength,
      inventory: selectedCharacter.inventory.map((item) =>
        sanitizeInventoryItem(item, 'adnd-encumbrance-player')
      ),
    },
    customItems: document.customItems.map((item) => sanitizeCatalogItem(item)),
  };
};

export const parseEncumbranceDocument = (text: string): EncumbranceDocument => {
  const rawValue = JSON.parse(text) as Partial<AnyEncumbranceDocument>;
  const rawCustomItems = (rawValue as { customItems?: unknown }).customItems;

  if (
    !isDocumentKind(rawValue.kind) ||
    !isSupportedDocumentVersion(rawValue.version)
  ) {
    throw new Error('File is not a supported encumbrance document.');
  }

  if (
    rawCustomItems !== undefined &&
    (!Array.isArray(rawCustomItems) ||
      !rawCustomItems.every((item: unknown) => isCatalogItem(item)))
  ) {
    throw new Error('Custom items are not valid.');
  }

  if (rawValue.version === 7) {
    if (rawValue.kind === 'adnd-encumbrance-player') {
      const playerValue = rawValue as Partial<EncumbrancePlayerDocumentV7>;

      if (!isPlayerCharacter(playerValue.character)) {
        throw new Error('File is not a supported encumbrance document.');
      }

      return sanitizeDocument(playerValue as EncumbrancePlayerDocumentV7);
    }

    const dmValue = rawValue as Partial<EncumbranceDmDocumentV7>;

    if (
      !Array.isArray(dmValue.characters) ||
      dmValue.characters.length === 0 ||
      !dmValue.characters.every((character: unknown) =>
        isDmCharacter(character)
      ) ||
      !isCharacterId(dmValue.activeCharacterId) ||
      !dmValue.characters.some(
        (character: EncumbranceDmCharacter) =>
          character.id === dmValue.activeCharacterId
      )
    ) {
      throw new Error('File is not a supported encumbrance document.');
    }

    return sanitizeDocument(dmValue as EncumbranceDmDocumentV7);
  }

  const legacyValue = rawValue as Partial<
    | EncumbranceDocumentV1
    | EncumbranceDocumentV2
    | EncumbranceDocumentV3
    | EncumbranceDocumentV4
    | EncumbranceDocumentV5
    | EncumbranceDocumentV6
  >;

  if (
    !legacyValue.character ||
    typeof legacyValue.character.name !== 'string' ||
    !isStrengthScore(legacyValue.character.strength) ||
    !Array.isArray(legacyValue.inventory) ||
    !legacyValue.inventory.every((item: unknown) =>
      rawValue.version === 5
        ? isInventoryItemV5(item)
        : rawValue.version === 6
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
    legacyValue.dm &&
    (typeof legacyValue.dm !== 'object' ||
      typeof legacyValue.dm.privateNotes !== 'string')
  ) {
    throw new Error('DM notes are not valid.');
  }

  return sanitizeDocument(
    legacyValue as
      | EncumbranceDocumentV1
      | EncumbranceDocumentV2
      | EncumbranceDocumentV3
      | EncumbranceDocumentV4
      | EncumbranceDocumentV5
      | EncumbranceDocumentV6
  );
};
