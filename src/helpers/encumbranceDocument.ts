import type {
  AmmoCapacityRule,
  AmmoKind,
  AnyEncumbranceDocument,
  EncumbranceCatalogItem,
  EncumbranceCustomItem,
  EncumbranceDmCharacter,
  EncumbranceDmDocumentV7,
  EncumbranceDmDocumentV8,
  EncumbranceDmDocumentV9,
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
  EncumbrancePlayerDocumentV8,
  EncumbrancePlayerDocumentV9,
  EquipmentCategory,
  ExceptionalStrengthTier,
  LegacyEncumbranceInventoryItem,
  MagicKnowledge,
  StrengthScore,
} from '../types/encumbrance';

const DOCUMENT_VERSION = 9;

type PlayerMergePrimitiveValue = string | number | boolean | null;
export type PlayerMergeChoiceSource = 'player' | 'dm';
export type PlayerMergeRemovalChoice = 'keep' | 'remove';

export interface PlayerMergeFieldReview {
  key: string;
  label: string;
  playerValue: PlayerMergePrimitiveValue;
  playerDisplay: string;
  dmValue: PlayerMergePrimitiveValue;
  dmDisplay: string;
  isConflict: boolean;
  selectedSource: PlayerMergeChoiceSource;
  conflictMessage?: string;
}

interface PlayerMergeUpdatedItemReview {
  kind: 'updated';
  itemId: string;
  itemName: string;
  ownerName: string;
  fields: PlayerMergeFieldReview[];
  notes: string[];
}

interface PlayerMergeAddedItemReview {
  kind: 'added';
  itemId: string;
  itemName: string;
  ownerName: string;
  fields: PlayerMergeFieldReview[];
  notes: string[];
  playerItem: EncumbranceInventoryItem;
}

interface PlayerMergeRemovedItemReview {
  kind: 'removed';
  itemId: string;
  itemName: string;
  ownerName: string;
  fields: PlayerMergeFieldReview[];
  notes: string[];
  selectedAction: PlayerMergeRemovalChoice;
}

interface PlayerMergeIssueReview {
  kind: 'issue';
  itemId: string;
  itemName: string;
  ownerName: string;
  message: string;
}

export type PlayerMergeItemReview =
  | PlayerMergeUpdatedItemReview
  | PlayerMergeAddedItemReview
  | PlayerMergeRemovedItemReview
  | PlayerMergeIssueReview;

export interface PlayerMergePlan {
  characterId: string;
  characterName: string;
  characterFields: PlayerMergeFieldReview[];
  items: PlayerMergeItemReview[];
}

interface PlayerMergeResult {
  mergedDocument: Extract<EncumbranceDocument, { kind: 'adnd-encumbrance-dm' }>;
  characterId: string;
  characterName: string;
  appliedCharacterFieldCount: number;
  updatedItemCount: number;
  addedItemCount: number;
  skippedRemovalCount: number;
  conflictMessages: string[];
}

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
      isNonNegativeNumber(candidate.encumbranceGpOverride)) &&
    (candidate.valueGpOverride === undefined ||
      isNonNegativeNumber(candidate.valueGpOverride))
  );
};

const isInventoryItem = (value: unknown): value is EncumbranceInventoryItem => {
  if (!isInventoryItemV5(value)) {
    return false;
  }

  const candidate = value as Partial<EncumbranceInventoryItem>;
  return (
    typeof candidate.playerKnowsValue === 'boolean' &&
    (candidate.customItem === undefined || isCatalogItem(candidate.customItem))
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
  | EncumbranceDocumentV5['version']
  | EncumbranceDocumentV6['version']
  | EncumbrancePlayerDocumentV7['version']
  | EncumbranceDmDocumentV7['version']
  | EncumbrancePlayerDocumentV8['version']
  | EncumbranceDmDocumentV8['version']
  | EncumbrancePlayerDocumentV9['version']
  | EncumbranceDmDocumentV9['version'] =>
  value === 1 ||
  value === 2 ||
  value === 3 ||
  value === 4 ||
  value === 5 ||
  value === 6 ||
  value === 7 ||
  value === 8 ||
  value === 9;

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
  const sanitizedCustomItem = isCatalogItem(candidate.customItem)
    ? {
        ...sanitizeCatalogItem(candidate.customItem),
        id: item.catalogId,
      }
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
    ...(typeof item.valueGpOverride === 'number'
      ? {
          valueGpOverride: item.valueGpOverride,
        }
      : {}),
    ...(sanitizedDmNotes !== undefined ? { dmNotes: sanitizedDmNotes } : {}),
    ...(sanitizedIsMagical !== undefined
      ? { isMagical: sanitizedIsMagical }
      : {}),
    ...(sanitizedFullyIdentified ? { fullyIdentified: true } : {}),
    ...(sanitizedCustomItem ? { customItem: sanitizedCustomItem } : {}),
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

const sanitizeOptionalMergeBaseCharacter = (
  candidate: EncumbrancePlayerCharacter | undefined,
  characterId: string
): EncumbrancePlayerCharacter | undefined => {
  if (!candidate) {
    return undefined;
  }

  const sanitized = sanitizePlayerCharacter(candidate);
  return sanitized.id === characterId ? sanitized : undefined;
};

const getAllInventoryItems = (
  document: EncumbranceDocument
): EncumbranceInventoryItem[] =>
  document.kind === 'adnd-encumbrance-dm'
    ? document.characters.flatMap((character) => character.inventory)
    : document.character.inventory;

const toFallbackCustomItemName = (catalogId: string): string => {
  const strippedId = catalogId
    .replace(/^custom-/, '')
    .replace(
      /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      ''
    )
    .replace(/-/g, ' ')
    .trim();

  if (!strippedId) {
    return 'Missing custom item';
  }

  return strippedId.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const createPlaceholderCustomItem = (
  item: EncumbranceInventoryItem,
  allInventory: EncumbranceInventoryItem[]
): EncumbranceCustomItem => {
  const hasChildren = allInventory.some(
    (candidate) => candidate.containerId === item.id
  );
  const inferredName =
    item.name?.trim() || toFallbackCustomItemName(item.catalogId);

  return {
    id: item.catalogId,
    name: inferredName,
    category: hasChildren
      ? 'containers'
      : item.playerMagicKnowledge === 'known-magical'
      ? 'treasure'
      : 'adventuring-gear',
    encumbranceGp:
      typeof item.encumbranceGpOverride === 'number'
        ? item.encumbranceGpOverride
        : 0,
    valueGp: 0,
    ...(hasChildren ? { isContainer: true } : {}),
  };
};

const mapInventoryItems = (
  document: EncumbranceDocument,
  mapper: (item: EncumbranceInventoryItem) => EncumbranceInventoryItem
): EncumbranceDocument =>
  document.kind === 'adnd-encumbrance-dm'
    ? {
        ...document,
        characters: document.characters.map((character) => ({
          ...character,
          inventory: character.inventory.map(mapper),
        })),
      }
    : {
        ...document,
        character: {
          ...document.character,
          inventory: document.character.inventory.map(mapper),
        },
      };

const inlineLegacyCustomItems = (
  document: EncumbranceDocument,
  customItems: EncumbranceCustomItem[]
): EncumbranceDocument => {
  const allInventory = getAllInventoryItems(document);
  const customItemById = new Map(
    customItems.map((item) => [item.id, sanitizeCatalogItem(item)])
  );

  return mapInventoryItems(document, (item) => {
    if (!item.catalogId.startsWith('custom-')) {
      return item.customItem
        ? {
            ...item,
            customItem: {
              ...sanitizeCatalogItem(item.customItem),
              id: item.catalogId,
            },
          }
        : item;
    }

    const inlineCustomItem = item.customItem
      ? {
          ...sanitizeCatalogItem(item.customItem),
          id: item.catalogId,
        }
      : customItemById.get(item.catalogId) ||
        createPlaceholderCustomItem(item, allInventory);

    return {
      ...item,
      customItem: inlineCustomItem,
    };
  });
};

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
  const legacyCustomItems = sanitizeCustomItems(candidate);

  if (
    candidate.version === 7 ||
    candidate.version === 8 ||
    candidate.version === 9
  ) {
    if (candidate.kind === 'adnd-encumbrance-player') {
      const sanitizedCharacter = sanitizePlayerCharacter(candidate.character);
      const sanitizedMergeBase =
        candidate.version === 9
          ? sanitizeOptionalMergeBaseCharacter(
              'mergeBaseCharacter' in candidate
                ? candidate.mergeBaseCharacter
                : undefined,
              sanitizedCharacter.id
            )
          : undefined;

      return inlineLegacyCustomItems(
        {
          kind: 'adnd-encumbrance-player',
          version: DOCUMENT_VERSION,
          character: sanitizedCharacter,
          ...(sanitizedMergeBase
            ? { mergeBaseCharacter: sanitizedMergeBase }
            : {}),
        },
        legacyCustomItems
      );
    }

    const sanitizedCharacters = candidate.characters.map((character) =>
      sanitizeDmCharacter(character)
    );
    const activeCharacterId = sanitizedCharacters.some(
      (character) => character.id === candidate.activeCharacterId
    )
      ? candidate.activeCharacterId
      : sanitizedCharacters[0]?.id || createCharacterId();

    return inlineLegacyCustomItems(
      {
        kind: 'adnd-encumbrance-dm',
        version: DOCUMENT_VERSION,
        activeCharacterId,
        characters: sanitizedCharacters,
      },
      legacyCustomItems
    );
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
    return inlineLegacyCustomItems(
      {
        kind: 'adnd-encumbrance-player',
        version: DOCUMENT_VERSION,
        character: {
          ...migratedCharacterBase,
          inventory: migratedInventory.map((item) =>
            sanitizeInventoryItem(item, 'adnd-encumbrance-player')
          ),
        },
      },
      legacyCustomItems
    );
  }

  return inlineLegacyCustomItems(
    {
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
    },
    legacyCustomItems
  );
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
    };
  }

  return {
    kind,
    version: DOCUMENT_VERSION,
    character: createEmptyEncumbrancePlayerCharacter(),
  };
};

export const redactEncumbranceDocument = (
  document: EncumbranceDocument,
  characterId?: string
): EncumbrancePlayerDocumentV9 => {
  if (document.kind === 'adnd-encumbrance-player') {
    const sanitizedCharacter = sanitizePlayerCharacter(document.character);
    const sanitizedMergeBase = sanitizeOptionalMergeBaseCharacter(
      document.mergeBaseCharacter,
      sanitizedCharacter.id
    );

    return {
      kind: 'adnd-encumbrance-player',
      version: DOCUMENT_VERSION,
      character: sanitizedCharacter,
      ...(sanitizedMergeBase ? { mergeBaseCharacter: sanitizedMergeBase } : {}),
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
    };
  }

  const sanitizedCharacter = {
    id: selectedCharacter.id,
    name: selectedCharacter.name,
    strength: selectedCharacter.strength,
    inventory: selectedCharacter.inventory.map((item) =>
      sanitizeInventoryItem(item, 'adnd-encumbrance-player')
    ),
  };

  return {
    kind: 'adnd-encumbrance-player',
    version: DOCUMENT_VERSION,
    character: sanitizedCharacter,
    mergeBaseCharacter: sanitizePlayerCharacter(sanitizedCharacter),
  };
};

const normalizeOptionalName = (value: string | undefined): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeOptionalNumber = (value: number | undefined): number | null =>
  typeof value === 'number' ? value : null;

const getEditableItemSnapshot = (item: EncumbranceInventoryItem) => ({
  name: normalizeOptionalName(item.name),
  quantity: item.quantity,
  containerId: item.containerId,
  playerNotes: item.playerNotes,
  encumbranceGpOverride: normalizeOptionalNumber(item.encumbranceGpOverride),
});

const getEditableCharacterSnapshot = (
  character: EncumbrancePlayerCharacter
) => ({
  name: character.name,
  strengthScore: character.strength.score,
  exceptional: character.strength.exceptional,
});

const getMergeItemDisplayName = (item: EncumbranceInventoryItem): string =>
  normalizeOptionalName(item.name) ||
  item.customItem?.name ||
  toFallbackCustomItemName(item.catalogId);

const areEqual = (left: unknown, right: unknown): boolean => left === right;

const buildDmInventoryItemIndex = (
  document: Extract<EncumbranceDocument, { kind: 'adnd-encumbrance-dm' }>
): Map<string, { characterId: string; item: EncumbranceInventoryItem }> => {
  const index = new Map<
    string,
    { characterId: string; item: EncumbranceInventoryItem }
  >();

  document.characters.forEach((character) => {
    character.inventory.forEach((item) => {
      index.set(item.id, {
        characterId: character.id,
        item,
      });
    });
  });

  return index;
};

const getCharacterMergeDisplayName = (name: string): string =>
  name.trim() || 'Unnamed adventurer';

const buildInventoryItemNameIndex = (
  inventory: EncumbranceInventoryItem[]
): Map<string, string> =>
  new Map(inventory.map((item) => [item.id, getMergeItemDisplayName(item)]));

const formatMergeFieldDisplay = (
  key: string,
  value: PlayerMergePrimitiveValue,
  inventoryItemNames: Map<string, string>
): string => {
  if (key === 'containerId') {
    if (!value) {
      return 'On person';
    }

    if (typeof value === 'string') {
      return inventoryItemNames.get(value) || value;
    }
  }

  if (key === 'playerNotes') {
    return typeof value === 'string' && value.trim() ? value : 'No notes';
  }

  if (key === 'encumbranceGpOverride') {
    return typeof value === 'number' ? `${value} gp` : 'Catalog weight';
  }

  if (key === 'valueGpOverride') {
    return typeof value === 'number' ? `${value} gp` : 'Catalog value';
  }

  if (key === 'encumbranceGp') {
    return typeof value === 'number' ? `${value} gp` : 'None';
  }

  if (key === 'capacityGp') {
    return typeof value === 'number' ? `${value} gp` : 'None';
  }

  if (key === 'playerKnowsValue') {
    return value ? 'Known' : 'Unknown';
  }

  if (key === 'playerMagicKnowledge') {
    if (value === 'known-mundane') {
      return 'Known mundane';
    }

    if (value === 'known-magical') {
      return 'Known magical';
    }

    return 'Unknown';
  }

  if (key === 'isMagical') {
    return value ? 'Magical' : 'Mundane';
  }

  if (key === 'fullyIdentified') {
    return value ? 'Fully identified' : 'Not fully identified';
  }

  if (key === 'category') {
    if (typeof value !== 'string') {
      return 'Unknown';
    }

    return (
      {
        containers: 'Containers',
        armor: 'Armor',
        arms: 'Arms',
        clothing: 'Clothing',
        herbs: 'Herbs',
        'adventuring-gear': 'Adventuring Gear',
        provisions: 'Provisions',
        'religious-items': 'Religious Items',
        treasure: 'Treasure',
        coins: 'Coins',
      }[value] || value
    );
  }

  if (key === 'ignoresContentsWeightForEncumbrance') {
    return value ? 'Own weight only' : 'Count contents';
  }

  if (key === 'name') {
    return typeof value === 'string' && value.trim() ? value : 'Catalog name';
  }

  if (value === null) {
    return 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return `${value}`;
  }

  if (typeof value === 'string') {
    return value.trim() ? value : 'None';
  }

  return 'None';
};

const createMergeFieldReview = ({
  key,
  label,
  playerValue,
  dmValue,
  playerInventoryNames,
  dmInventoryNames,
  isConflict,
  selectedSource,
  conflictMessage,
}: {
  key: string;
  label: string;
  playerValue: PlayerMergePrimitiveValue;
  dmValue: PlayerMergePrimitiveValue;
  playerInventoryNames: Map<string, string>;
  dmInventoryNames: Map<string, string>;
  isConflict: boolean;
  selectedSource: PlayerMergeChoiceSource;
  conflictMessage?: string;
}): PlayerMergeFieldReview => ({
  key,
  label,
  playerValue,
  dmValue,
  playerDisplay: formatMergeFieldDisplay(
    key,
    playerValue,
    playerInventoryNames
  ),
  dmDisplay: formatMergeFieldDisplay(key, dmValue, dmInventoryNames),
  isConflict,
  selectedSource,
  ...(conflictMessage ? { conflictMessage } : {}),
});

const buildAddedItemFields = (
  playerItem: EncumbranceInventoryItem,
  playerCharacterInventoryNames: Map<string, string>
): PlayerMergeFieldReview[] => {
  const fields: PlayerMergeFieldReview[] = [
    createMergeFieldReview({
      key: 'quantity',
      label: 'Quantity',
      playerValue: playerItem.quantity,
      dmValue: 'Not in DM file',
      playerInventoryNames: playerCharacterInventoryNames,
      dmInventoryNames: new Map(),
      isConflict: false,
      selectedSource: 'player',
    }),
    createMergeFieldReview({
      key: 'day',
      label: 'Day',
      playerValue: playerItem.day,
      dmValue: 'Not in DM file',
      playerInventoryNames: playerCharacterInventoryNames,
      dmInventoryNames: new Map(),
      isConflict: false,
      selectedSource: 'player',
    }),
    createMergeFieldReview({
      key: 'containerId',
      label: 'Stored in',
      playerValue: playerItem.containerId,
      dmValue: 'Not in DM file',
      playerInventoryNames: playerCharacterInventoryNames,
      dmInventoryNames: new Map(),
      isConflict: false,
      selectedSource: 'player',
    }),
  ];

  if (playerItem.playerNotes.trim()) {
    fields.push(
      createMergeFieldReview({
        key: 'playerNotes',
        label: 'Player notes',
        playerValue: playerItem.playerNotes,
        dmValue: 'Not in DM file',
        playerInventoryNames: playerCharacterInventoryNames,
        dmInventoryNames: new Map(),
        isConflict: false,
        selectedSource: 'player',
      })
    );
  }

  if (typeof playerItem.encumbranceGpOverride === 'number') {
    fields.push(
      createMergeFieldReview({
        key: 'encumbranceGpOverride',
        label: 'Weight per item',
        playerValue: playerItem.encumbranceGpOverride,
        dmValue: 'Not in DM file',
        playerInventoryNames: playerCharacterInventoryNames,
        dmInventoryNames: new Map(),
        isConflict: false,
        selectedSource: 'player',
      })
    );
  }

  if (playerItem.customItem) {
    fields.push(
      createMergeFieldReview({
        key: 'category',
        label: 'Category',
        playerValue: playerItem.customItem.category,
        dmValue: 'Not in DM file',
        playerInventoryNames: playerCharacterInventoryNames,
        dmInventoryNames: new Map(),
        isConflict: false,
        selectedSource: 'player',
      }),
      createMergeFieldReview({
        key: 'valueGpOverride',
        label: 'Monetary value',
        playerValue: playerItem.customItem.valueGp,
        dmValue: 'Not in DM file',
        playerInventoryNames: playerCharacterInventoryNames,
        dmInventoryNames: new Map(),
        isConflict: false,
        selectedSource: 'player',
      }),
      createMergeFieldReview({
        key: 'encumbranceGp',
        label: 'Weight per item',
        playerValue: playerItem.customItem.encumbranceGp,
        dmValue: 'Not in DM file',
        playerInventoryNames: playerCharacterInventoryNames,
        dmInventoryNames: new Map(),
        isConflict: false,
        selectedSource: 'player',
      })
    );

    if (playerItem.customItem.isContainer) {
      fields.push(
        createMergeFieldReview({
          key: 'capacityGp',
          label: 'Capacity',
          playerValue: playerItem.customItem.capacityGp ?? null,
          dmValue: 'Not in DM file',
          playerInventoryNames: playerCharacterInventoryNames,
          dmInventoryNames: new Map(),
          isConflict: false,
          selectedSource: 'player',
        }),
        createMergeFieldReview({
          key: 'ignoresContentsWeightForEncumbrance',
          label: 'Carried weight',
          playerValue: Boolean(
            playerItem.customItem.ignoresContentsWeightForEncumbrance
          ),
          dmValue: 'Not in DM file',
          playerInventoryNames: playerCharacterInventoryNames,
          dmInventoryNames: new Map(),
          isConflict: false,
          selectedSource: 'player',
        })
      );
    }
  }

  return fields;
};

const buildRemovedItemFields = (
  dmItem: EncumbranceInventoryItem,
  dmCharacterInventoryNames: Map<string, string>
): PlayerMergeFieldReview[] => {
  const fields: PlayerMergeFieldReview[] = [
    createMergeFieldReview({
      key: 'quantity',
      label: 'Quantity',
      playerValue: 'Removed from player file',
      dmValue: dmItem.quantity,
      playerInventoryNames: new Map(),
      dmInventoryNames: dmCharacterInventoryNames,
      isConflict: false,
      selectedSource: 'dm',
    }),
    createMergeFieldReview({
      key: 'day',
      label: 'Day',
      playerValue: 'Removed from player file',
      dmValue: dmItem.day,
      playerInventoryNames: new Map(),
      dmInventoryNames: dmCharacterInventoryNames,
      isConflict: false,
      selectedSource: 'dm',
    }),
    createMergeFieldReview({
      key: 'containerId',
      label: 'Stored in',
      playerValue: 'Removed from player file',
      dmValue: dmItem.containerId,
      playerInventoryNames: new Map(),
      dmInventoryNames: dmCharacterInventoryNames,
      isConflict: false,
      selectedSource: 'dm',
    }),
  ];

  if (dmItem.playerNotes.trim()) {
    fields.push(
      createMergeFieldReview({
        key: 'playerNotes',
        label: 'Player notes',
        playerValue: 'Removed from player file',
        dmValue: dmItem.playerNotes,
        playerInventoryNames: new Map(),
        dmInventoryNames: dmCharacterInventoryNames,
        isConflict: false,
        selectedSource: 'dm',
      })
    );
  }

  return fields;
};

const countAppliedCharacterFields = (plan: PlayerMergePlan): number =>
  plan.characterFields.filter((field) => field.selectedSource === 'player')
    .length;

const countAppliedItemUpdates = (plan: PlayerMergePlan): number =>
  plan.items.filter(
    (item) =>
      item.kind === 'updated' &&
      item.fields.some((field) => field.selectedSource === 'player')
  ).length;

const countSkippedRemovals = (plan: PlayerMergePlan): number =>
  plan.items.filter(
    (item) => item.kind === 'removed' && item.selectedAction === 'keep'
  ).length;

const summarizePlayerMergePlanMessages = (plan: PlayerMergePlan): string[] => {
  const conflictMessages = plan.characterFields
    .filter((field) => field.isConflict && field.conflictMessage)
    .map((field) => field.conflictMessage as string);
  const itemConflictMessages = plan.items.flatMap((item) => {
    if (item.kind === 'issue') {
      return [item.message];
    }

    if (item.kind === 'removed') {
      return item.selectedAction === 'keep'
        ? [
            `${item.itemName} was removed in the player file and needs DM review before deleting it from the party file.`,
          ]
        : [];
    }

    return item.fields
      .filter((field) => field.isConflict && field.conflictMessage)
      .map((field) => field.conflictMessage as string);
  });

  return [...conflictMessages, ...itemConflictMessages];
};

export const buildPlayerMergePlan = (
  dmDocument: Extract<EncumbranceDocument, { kind: 'adnd-encumbrance-dm' }>,
  playerDocument: Extract<
    EncumbranceDocument,
    { kind: 'adnd-encumbrance-player' }
  >
): PlayerMergePlan => {
  if (!playerDocument.mergeBaseCharacter) {
    throw new Error(
      'Player file does not contain merge metadata. Ask the DM to export a new player copy first.'
    );
  }

  const sanitizedDocument = sanitizeDocument(dmDocument);

  if (sanitizedDocument.kind !== 'adnd-encumbrance-dm') {
    throw new Error('Current document is not a DM document.');
  }

  const workingDocument = sanitizedDocument;
  const playerCharacter = sanitizePlayerCharacter(playerDocument.character);
  const mergeBaseCharacter = sanitizePlayerCharacter(
    playerDocument.mergeBaseCharacter
  );

  if (playerCharacter.id !== mergeBaseCharacter.id) {
    throw new Error('Player file merge base does not match the player file.');
  }

  const targetCharacterIndex = workingDocument.characters.findIndex(
    (character) => character.id === playerCharacter.id
  );

  if (targetCharacterIndex === -1) {
    throw new Error(
      'Player file does not match any character in the current DM document.'
    );
  }

  const currentCharacter = workingDocument.characters[targetCharacterIndex];

  if (!currentCharacter) {
    throw new Error('Player file does not match any character in the DM file.');
  }

  const nextCharacter: EncumbranceDmCharacter = {
    ...currentCharacter,
    inventory: currentCharacter.inventory.map((item) =>
      sanitizeInventoryItem(item, 'adnd-encumbrance-dm')
    ),
  };

  const playerCharacterInventoryNames = buildInventoryItemNameIndex(
    playerCharacter.inventory
  );
  const dmCharacterInventoryNames = buildInventoryItemNameIndex(
    currentCharacter.inventory
  );
  const characterFields: PlayerMergeFieldReview[] = [];
  const itemReviews: PlayerMergeItemReview[] = [];

  const baseCharacterSnapshot =
    getEditableCharacterSnapshot(mergeBaseCharacter);
  const playerCharacterSnapshot = getEditableCharacterSnapshot(playerCharacter);
  const dmCharacterSnapshot = getEditableCharacterSnapshot(currentCharacter);

  if (!areEqual(playerCharacterSnapshot.name, baseCharacterSnapshot.name)) {
    const isConflict =
      !areEqual(dmCharacterSnapshot.name, baseCharacterSnapshot.name) &&
      !areEqual(dmCharacterSnapshot.name, playerCharacterSnapshot.name);

    characterFields.push(
      createMergeFieldReview({
        key: 'name',
        label: 'Name',
        playerValue: playerCharacterSnapshot.name,
        dmValue: dmCharacterSnapshot.name,
        playerInventoryNames: new Map(),
        dmInventoryNames: new Map(),
        isConflict,
        selectedSource: isConflict ? 'dm' : 'player',
        conflictMessage: 'Character name was changed by both DM and player.',
      })
    );
  }

  if (
    !areEqual(
      playerCharacterSnapshot.strengthScore,
      baseCharacterSnapshot.strengthScore
    )
  ) {
    const isConflict =
      !areEqual(
        dmCharacterSnapshot.strengthScore,
        baseCharacterSnapshot.strengthScore
      ) &&
      !areEqual(
        dmCharacterSnapshot.strengthScore,
        playerCharacterSnapshot.strengthScore
      );

    characterFields.push(
      createMergeFieldReview({
        key: 'strengthScore',
        label: 'Strength',
        playerValue: playerCharacterSnapshot.strengthScore,
        dmValue: dmCharacterSnapshot.strengthScore,
        playerInventoryNames: new Map(),
        dmInventoryNames: new Map(),
        isConflict,
        selectedSource: isConflict ? 'dm' : 'player',
        conflictMessage:
          'Character strength score was changed by both DM and player.',
      })
    );
  }

  if (
    !areEqual(
      playerCharacterSnapshot.exceptional,
      baseCharacterSnapshot.exceptional
    )
  ) {
    const isConflict =
      !areEqual(
        dmCharacterSnapshot.exceptional,
        baseCharacterSnapshot.exceptional
      ) &&
      !areEqual(
        dmCharacterSnapshot.exceptional,
        playerCharacterSnapshot.exceptional
      );

    characterFields.push(
      createMergeFieldReview({
        key: 'exceptional',
        label: 'Exceptional strength',
        playerValue: playerCharacterSnapshot.exceptional,
        dmValue: dmCharacterSnapshot.exceptional,
        playerInventoryNames: new Map(),
        dmInventoryNames: new Map(),
        isConflict,
        selectedSource: isConflict ? 'dm' : 'player',
        conflictMessage:
          'Exceptional strength was changed by both DM and player.',
      })
    );
  }

  const baseItemsById = new Map(
    mergeBaseCharacter.inventory.map((item) => [item.id, item])
  );
  const playerItemsById = new Map(
    playerCharacter.inventory.map((item) => [item.id, item])
  );
  const nextItemIndexById = new Map(
    nextCharacter.inventory.map((item, index) => [item.id, index])
  );
  const dmItemIndex = buildDmInventoryItemIndex(workingDocument);

  mergeBaseCharacter.inventory.forEach((baseItem) => {
    const playerItem = playerItemsById.get(baseItem.id);
    const dmEntry = dmItemIndex.get(baseItem.id);
    const baseItemName = getMergeItemDisplayName(baseItem);
    const ownerName = getCharacterMergeDisplayName(currentCharacter.name);

    if (!playerItem) {
      if (dmEntry?.characterId === currentCharacter.id) {
        itemReviews.push({
          kind: 'removed',
          itemId: baseItem.id,
          itemName: baseItemName,
          ownerName,
          fields: buildRemovedItemFields(
            sanitizeInventoryItem(dmEntry.item, 'adnd-encumbrance-dm'),
            dmCharacterInventoryNames
          ),
          notes: [],
          selectedAction: 'keep',
        });
      }
      return;
    }

    if (!dmEntry) {
      if (
        JSON.stringify(getEditableItemSnapshot(playerItem)) !==
        JSON.stringify(getEditableItemSnapshot(baseItem))
      ) {
        itemReviews.push({
          kind: 'issue',
          itemId: baseItem.id,
          itemName: baseItemName,
          ownerName,
          message: `${baseItemName} no longer exists in the DM file.`,
        });
      }
      return;
    }

    if (dmEntry.characterId !== currentCharacter.id) {
      itemReviews.push({
        kind: 'issue',
        itemId: baseItem.id,
        itemName: baseItemName,
        ownerName,
        message: `${baseItemName} is now held by another character in the DM file.`,
      });
      return;
    }

    const nextItemIndex = nextItemIndexById.get(baseItem.id);

    if (typeof nextItemIndex !== 'number') {
      return;
    }

    const nextItem = nextCharacter.inventory[nextItemIndex];

    if (!nextItem) {
      return;
    }

    const baseSnapshot = getEditableItemSnapshot(baseItem);
    const playerSnapshot = getEditableItemSnapshot(playerItem);
    const dmSnapshot = getEditableItemSnapshot(dmEntry.item);
    const itemFieldReviews: PlayerMergeFieldReview[] = [];

    const applyField = <K extends keyof typeof baseSnapshot>(
      field: K,
      label: string,
      conflictMessage: string
    ) => {
      const baseValue = baseSnapshot[field];
      const playerValue = playerSnapshot[field];
      const dmValue = dmSnapshot[field];

      if (areEqual(playerValue, baseValue)) {
        return;
      }

      const isConflict =
        !areEqual(dmValue, baseValue) && !areEqual(dmValue, playerValue);

      itemFieldReviews.push(
        createMergeFieldReview({
          key: field,
          label,
          playerValue,
          dmValue,
          playerInventoryNames: playerCharacterInventoryNames,
          dmInventoryNames: dmCharacterInventoryNames,
          isConflict,
          selectedSource: isConflict ? 'dm' : 'player',
          conflictMessage,
        })
      );
    };

    applyField(
      'name',
      'Name',
      `${baseItemName} name was changed by both DM and player.`
    );
    applyField(
      'quantity',
      'Quantity',
      `${baseItemName} quantity was changed by both DM and player.`
    );
    applyField(
      'containerId',
      'Stored in',
      `${baseItemName} location was changed by both DM and player.`
    );
    applyField(
      'playerNotes',
      'Player notes',
      `${baseItemName} notes were changed by both DM and player.`
    );
    applyField(
      'encumbranceGpOverride',
      'Weight per item',
      `${baseItemName} weight was changed by both DM and player.`
    );

    if (itemFieldReviews.length > 0) {
      itemReviews.push({
        kind: 'updated',
        itemId: baseItem.id,
        itemName: baseItemName,
        ownerName,
        fields: itemFieldReviews,
        notes: [],
      });
    }
  });

  playerCharacter.inventory.forEach((playerItem) => {
    if (baseItemsById.has(playerItem.id)) {
      return;
    }

    if (
      dmItemIndex.has(playerItem.id) ||
      nextItemIndexById.has(playerItem.id)
    ) {
      itemReviews.push({
        kind: 'issue',
        itemId: playerItem.id,
        itemName: getMergeItemDisplayName(playerItem),
        ownerName: getCharacterMergeDisplayName(currentCharacter.name),
        message: `${getMergeItemDisplayName(
          playerItem
        )} could not be added because an item with the same id already exists in the DM file.`,
      });
      return;
    }

    itemReviews.push({
      kind: 'added',
      itemId: playerItem.id,
      itemName: getMergeItemDisplayName(playerItem),
      ownerName: getCharacterMergeDisplayName(currentCharacter.name),
      fields: buildAddedItemFields(playerItem, playerCharacterInventoryNames),
      notes: [],
      playerItem: sanitizeInventoryItem(playerItem, 'adnd-encumbrance-dm'),
    });
  });

  return {
    characterId: currentCharacter.id,
    characterName: getCharacterMergeDisplayName(
      playerCharacter.name || currentCharacter.name
    ),
    characterFields,
    items: itemReviews,
  };
};

export const applyPlayerMergePlan = (
  dmDocument: Extract<EncumbranceDocument, { kind: 'adnd-encumbrance-dm' }>,
  plan: PlayerMergePlan
): Extract<EncumbranceDocument, { kind: 'adnd-encumbrance-dm' }> => {
  const sanitizedDocument = sanitizeDocument(dmDocument);

  if (sanitizedDocument.kind !== 'adnd-encumbrance-dm') {
    throw new Error('Current document is not a DM document.');
  }

  const targetCharacterIndex = sanitizedDocument.characters.findIndex(
    (character) => character.id === plan.characterId
  );

  if (targetCharacterIndex === -1) {
    throw new Error(
      'Player merge plan does not match any character in the DM file.'
    );
  }

  const currentCharacter = sanitizedDocument.characters[targetCharacterIndex];

  if (!currentCharacter) {
    throw new Error('Player merge plan does not match any DM character.');
  }

  const nextCharacter: EncumbranceDmCharacter = {
    ...currentCharacter,
    inventory: currentCharacter.inventory.map((item) =>
      sanitizeInventoryItem(item, 'adnd-encumbrance-dm')
    ),
  };
  const nextItemIndexById = new Map(
    nextCharacter.inventory.map((item, index) => [item.id, index])
  );

  plan.characterFields.forEach((field) => {
    if (field.selectedSource !== 'player') {
      return;
    }

    if (field.key === 'name' && typeof field.playerValue === 'string') {
      nextCharacter.name = field.playerValue;
    }

    if (
      field.key === 'strengthScore' &&
      typeof field.playerValue === 'number'
    ) {
      nextCharacter.strength = {
        ...nextCharacter.strength,
        score: field.playerValue,
      };
    }

    if (
      field.key === 'exceptional' &&
      typeof field.playerValue === 'string' &&
      exceptionalStrengthTiers.has(field.playerValue as ExceptionalStrengthTier)
    ) {
      nextCharacter.strength = {
        ...nextCharacter.strength,
        exceptional: field.playerValue as ExceptionalStrengthTier,
      };
    }
  });

  plan.items.forEach((itemReview) => {
    if (itemReview.kind === 'issue') {
      return;
    }

    if (itemReview.kind === 'added') {
      if (nextItemIndexById.has(itemReview.itemId)) {
        return;
      }

      nextCharacter.inventory.push(
        sanitizeInventoryItem(itemReview.playerItem, 'adnd-encumbrance-dm')
      );
      nextItemIndexById.set(
        itemReview.itemId,
        nextCharacter.inventory.length - 1
      );
      return;
    }

    if (itemReview.kind === 'removed') {
      if (itemReview.selectedAction !== 'remove') {
        return;
      }

      const itemIndex = nextItemIndexById.get(itemReview.itemId);

      if (typeof itemIndex !== 'number') {
        return;
      }

      nextCharacter.inventory.splice(itemIndex, 1);
      nextItemIndexById.clear();
      nextCharacter.inventory.forEach((item, index) => {
        nextItemIndexById.set(item.id, index);
      });
      return;
    }

    const itemIndex = nextItemIndexById.get(itemReview.itemId);

    if (typeof itemIndex !== 'number') {
      return;
    }

    const nextItem = nextCharacter.inventory[itemIndex];

    if (!nextItem) {
      return;
    }

    itemReview.fields.forEach((field) => {
      if (field.selectedSource !== 'player') {
        return;
      }

      if (field.key === 'name') {
        if (typeof field.playerValue === 'string' && field.playerValue.trim()) {
          nextItem.name = field.playerValue;
        } else {
          delete nextItem.name;
        }
      }

      if (field.key === 'quantity' && typeof field.playerValue === 'number') {
        nextItem.quantity = field.playerValue;
      }

      if (field.key === 'containerId') {
        nextItem.containerId =
          typeof field.playerValue === 'string' ? field.playerValue : null;
      }

      if (
        field.key === 'playerNotes' &&
        typeof field.playerValue === 'string'
      ) {
        nextItem.playerNotes = field.playerValue;
      }

      if (field.key === 'encumbranceGpOverride') {
        if (typeof field.playerValue === 'number') {
          nextItem.encumbranceGpOverride = field.playerValue;
        } else {
          delete nextItem.encumbranceGpOverride;
        }
      }
    });
  });

  const validContainerIds = new Set(
    nextCharacter.inventory.map((item) => item.id)
  );

  nextCharacter.inventory.forEach((item) => {
    if (item.containerId === null) {
      return;
    }

    if (
      !validContainerIds.has(item.containerId) ||
      item.containerId === item.id
    ) {
      item.containerId = null;
    }
  });

  sanitizedDocument.characters[targetCharacterIndex] = nextCharacter;
  sanitizedDocument.activeCharacterId = nextCharacter.id;

  return sanitizedDocument;
};

export const mergePlayerChangesIntoDmDocument = (
  dmDocument: Extract<EncumbranceDocument, { kind: 'adnd-encumbrance-dm' }>,
  playerDocument: Extract<
    EncumbranceDocument,
    { kind: 'adnd-encumbrance-player' }
  >
): PlayerMergeResult => {
  const plan = buildPlayerMergePlan(dmDocument, playerDocument);
  const mergedDocument = applyPlayerMergePlan(dmDocument, plan);

  return {
    mergedDocument,
    characterId: plan.characterId,
    characterName: plan.characterName,
    appliedCharacterFieldCount: countAppliedCharacterFields(plan),
    updatedItemCount: countAppliedItemUpdates(plan),
    addedItemCount: plan.items.filter((item) => item.kind === 'added').length,
    skippedRemovalCount: countSkippedRemovals(plan),
    conflictMessages: summarizePlayerMergePlanMessages(plan),
  };
};

export const stringifyEncumbranceDocument = (
  document: EncumbranceDocument
): string => JSON.stringify(sanitizeDocument(document), null, 2);

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

  if (
    rawValue.version === 7 ||
    rawValue.version === 8 ||
    rawValue.version === 9
  ) {
    if (rawValue.kind === 'adnd-encumbrance-player') {
      const playerValue = rawValue as Partial<
        | EncumbrancePlayerDocumentV7
        | EncumbrancePlayerDocumentV8
        | EncumbrancePlayerDocumentV9
      >;
      const playerMergeBase = (
        playerValue as Partial<EncumbrancePlayerDocumentV9>
      ).mergeBaseCharacter;

      if (!isPlayerCharacter(playerValue.character)) {
        throw new Error('File is not a supported encumbrance document.');
      }

      if (
        playerMergeBase !== undefined &&
        (!isPlayerCharacter(playerMergeBase) ||
          playerMergeBase.id !== playerValue.character.id)
      ) {
        throw new Error('Player merge base is not valid.');
      }

      return sanitizeDocument(
        playerValue as
          | EncumbrancePlayerDocumentV7
          | EncumbrancePlayerDocumentV8
          | EncumbrancePlayerDocumentV9
      );
    }

    const dmValue = rawValue as Partial<
      | EncumbranceDmDocumentV7
      | EncumbranceDmDocumentV8
      | EncumbranceDmDocumentV9
    >;

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

    return sanitizeDocument(
      dmValue as
        | EncumbranceDmDocumentV7
        | EncumbranceDmDocumentV8
        | EncumbranceDmDocumentV9
    );
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
