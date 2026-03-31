import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './encumbrance.module.css';
import type {
  EncumbranceCatalogItem,
  EncumbranceCharacterSheet,
  EncumbranceCustomItem,
  EncumbranceDocument,
  EncumbranceInventoryItem,
  EncumbranceMode,
  EquipmentCategory,
  ExceptionalStrengthTier,
  MagicKnowledge,
} from '../../types/encumbrance';
import {
  createEmptyEncumbranceDmCharacter,
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
  redactEncumbranceDocument,
} from '../../helpers/encumbranceDocument';
import {
  getContainerLoadSummary,
  getContainerWarningCount,
  getDescendantIds,
  getEffectiveLoadGp,
  getInventoryItemInfo,
  getInventoryItemTotalGp,
  getInventoryItemTotalKnownValueGp,
  getInventoryItemTotalValueGp,
  getLoadBand,
  getStrengthCarryingCapacityGp,
  getTotalEncumbranceGp,
  getTotalKnownValueGp,
  getTotalValueGp,
} from '../../helpers/encumbranceRules';
import {
  encumbranceCatalog,
  encumbranceCatalogById,
} from '../../tables/encumbranceCatalog';

interface EncumbranceAppProps {
  mode: EncumbranceMode;
}

type AddMode = 'catalog' | 'custom';
type CustomCategory = Extract<
  EquipmentCategory,
  | 'containers'
  | 'armor'
  | 'arms'
  | 'clothing'
  | 'herbs'
  | 'adventuring-gear'
  | 'provisions'
  | 'religious-items'
  | 'treasure'
>;

interface CustomItemDraft {
  name: string;
  category: CustomCategory;
  encumbranceGp: number;
  valueGp: number;
  capacityGp: number;
  ignoresContentsWeightForEncumbrance: boolean;
}

interface InventoryEditDraft {
  characterId: string;
  itemId: string;
  name: string;
  day: number;
  quantity: number;
  containerId: string;
  playerNotes: string;
  dmNotes: string;
  playerKnowsValue: boolean;
  playerMagicKnowledge: MagicKnowledge;
  isMagical: boolean;
  fullyIdentified: boolean;
  encumbranceGp: number;
}

interface CharacterEditDraft {
  characterId: string;
  name: string;
  strengthScore: number;
  exceptional: ExceptionalStrengthTier;
  dmNotes: string;
}

interface ActiveCharacterState extends EncumbranceCharacterSheet {
  dmNotes: string;
}

interface PendingRemovalState {
  characterId: string;
  itemId: string;
}

const categoryLabels: Record<EquipmentCategory, string> = {
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
};

const customCategoryOptions: CustomCategory[] = [
  'containers',
  'armor',
  'arms',
  'clothing',
  'herbs',
  'adventuring-gear',
  'provisions',
  'religious-items',
  'treasure',
];

const defaultCustomItemDraft = (): CustomItemDraft => ({
  name: '',
  category: 'adventuring-gear',
  encumbranceGp: 1,
  valueGp: 0,
  capacityGp: 100,
  ignoresContentsWeightForEncumbrance: false,
});

interface AddItemDetailsDraft {
  day: number;
  playerNotes: string;
  dmNotes: string;
  playerKnowsValue: boolean;
  playerMagicKnowledge: MagicKnowledge;
  isMagical: boolean;
  fullyIdentified: boolean;
}

const defaultAddItemDetailsDraft = (): AddItemDetailsDraft => ({
  day: 0,
  playerNotes: '',
  dmNotes: '',
  playerKnowsValue: true,
  playerMagicKnowledge: 'unknown',
  isMagical: false,
  fullyIdentified: false,
});

const magicKnowledgeLabels: Record<MagicKnowledge, string> = {
  unknown: 'Unknown',
  'known-mundane': 'Known mundane',
  'known-magical': 'Known magical',
};

const carriedWeightRuleOptions = {
  count: 'Count contents',
  own: 'Own weight only',
} as const;

const createInventoryItemId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `enc-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createCustomCatalogId = (name: string): string => {
  const base = slugify(name);

  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `custom-${base}-${crypto.randomUUID()}`;
  }

  return `custom-${base}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'character';

const getDocumentKindForMode = (
  mode: EncumbranceMode
): EncumbranceDocument['kind'] =>
  mode === 'dm' ? 'adnd-encumbrance-dm' : 'adnd-encumbrance-player';

const isDmDocument = (
  document: EncumbranceDocument
): document is Extract<EncumbranceDocument, { kind: 'adnd-encumbrance-dm' }> =>
  document.kind === 'adnd-encumbrance-dm';

const getActiveCharacterState = (
  document: EncumbranceDocument
): ActiveCharacterState => {
  if (document.kind === 'adnd-encumbrance-dm') {
    const activeCharacter =
      document.characters.find(
        (character) => character.id === document.activeCharacterId
      ) || document.characters[0];

    if (activeCharacter) {
      return activeCharacter;
    }

    return {
      id: '',
      name: '',
      strength: {
        score: 8,
        exceptional: 'none',
      },
      inventory: [],
      dmNotes: '',
    };
  }

  return {
    ...document.character,
    dmNotes: '',
  };
};

const canStoreItemInContainer = (
  itemInfo: EncumbranceCatalogItem,
  containerInfo: EncumbranceCatalogItem
): boolean => {
  if (!containerInfo.isContainer) {
    return false;
  }

  if (containerInfo.ammoCapacity) {
    return itemInfo.ammoKind === containerInfo.ammoCapacity.ammoKind;
  }

  return true;
};

const formatContainerUsage = (
  summary: ReturnType<typeof getContainerLoadSummary>
): string | undefined => {
  if (!summary) {
    return undefined;
  }

  const suffix = summary.unitLabel === 'gp' ? ' gp' : '';
  return `${summary.used}${suffix} / ${summary.capacity}${suffix}`;
};

const formatGpValue = (value: number): string =>
  value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

const getCharacterDisplayName = (name: string): string =>
  name.trim() || 'Unnamed adventurer';

const getCharacterOwnerLabel = (name: string): string => {
  const displayName = getCharacterDisplayName(name);
  return displayName.split(/\s+/)[0] || displayName;
};

const formatStrengthSummary = (
  score: number,
  exceptional: ExceptionalStrengthTier
): string =>
  score === 18 && exceptional !== 'none' ? `18/${exceptional}` : `${score}`;

const getInventoryItemDisplayName = (
  item: EncumbranceInventoryItem,
  itemInfo: EncumbranceCatalogItem
): string => item.name?.trim() || itemInfo.name;

const getInventoryItemOwnEncumbranceGp = (
  item: EncumbranceInventoryItem,
  itemInfo: EncumbranceCatalogItem
): number =>
  typeof item.encumbranceGpOverride === 'number'
    ? item.encumbranceGpOverride
    : itemInfo.encumbranceGp;

const getInventoryItemOwnValueGp = (
  item: EncumbranceInventoryItem,
  itemInfo: EncumbranceCatalogItem
): number => itemInfo.valueGp * item.quantity;

const getPlayerVisibleItemValueGp = (
  item: EncumbranceInventoryItem,
  itemInfo: EncumbranceCatalogItem
): number | null =>
  item.playerKnowsValue ? getInventoryItemOwnValueGp(item, itemInfo) : null;

const formatOptionalGpValue = (value: number | null): string =>
  value === null ? 'Unknown' : `${formatGpValue(value)} gp`;

interface RowNoteLine {
  text: string;
  tone: 'public' | 'dm';
}

const getRowNoteLines = (
  item: EncumbranceInventoryItem,
  mode: EncumbranceMode
): RowNoteLine[] => {
  const lines: RowNoteLine[] = [];
  const publicNotes = item.playerNotes.trim();
  const dmNotes = item.dmNotes?.trim();

  if (publicNotes) {
    lines.push({
      text: publicNotes,
      tone: 'public',
    });
  }

  if (mode === 'dm' && dmNotes) {
    lines.push({
      text: `DM: ${dmNotes}`,
      tone: 'dm',
    });
  }

  return lines;
};

const getTextareaMinHeight = (textarea: HTMLTextAreaElement): number => {
  const computedStyle = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 0;
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;
  const explicitMinHeight = Number.parseFloat(computedStyle.minHeight) || 0;

  return Math.ceil(
    Math.max(
      explicitMinHeight,
      lineHeight + paddingTop + paddingBottom + borderTop + borderBottom
    )
  );
};

const resizeTextarea = (textarea: HTMLTextAreaElement | null) => {
  if (!textarea) {
    return;
  }

  textarea.style.height = '0px';
  textarea.style.height = `${Math.max(
    textarea.scrollHeight,
    getTextareaMinHeight(textarea)
  )}px`;
};

const EncumbranceApp = ({ mode }: EncumbranceAppProps) => {
  const [document, setDocument] = useState<EncumbranceDocument>(
    createEmptyEncumbranceDocument(getDocumentKindForMode(mode))
  );
  const [addMode, setAddMode] = useState<AddMode>('catalog');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(
    encumbranceCatalog[0]?.id || ''
  );
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');
  const [addItemDetailsDraft, setAddItemDetailsDraft] =
    useState<AddItemDetailsDraft>(defaultAddItemDetailsDraft());
  const [customItemDraft, setCustomItemDraft] = useState<CustomItemDraft>(
    defaultCustomItemDraft()
  );
  const [characterEditDraft, setCharacterEditDraft] =
    useState<CharacterEditDraft | null>(null);
  const [showAllCharacters, setShowAllCharacters] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItemDraft, setEditingItemDraft] =
    useState<InventoryEditDraft | null>(null);
  const [pendingRemovalState, setPendingRemovalState] =
    useState<PendingRemovalState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeCharacter = useMemo(
    () => getActiveCharacterState(document),
    [document]
  );
  const dmCharacters = useMemo(
    () => (isDmDocument(document) ? document.characters : []),
    [document]
  );
  const isAllCharactersView = mode === 'dm' && showAllCharacters;
  const visibleCharacters = isAllCharactersView
    ? dmCharacters
    : [activeCharacter];
  const visibleCharacterCount = visibleCharacters.length;

  useEffect(() => {
    if (
      !pendingRemovalState &&
      !editingItemDraft &&
      !showAddModal &&
      !characterEditDraft
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (pendingRemovalState) {
          setPendingRemovalState(null);
          return;
        }

        if (editingItemDraft) {
          setEditingItemDraft(null);
          return;
        }

        if (showAddModal) {
          setShowAddModal(false);
          return;
        }

        if (characterEditDraft) {
          setCharacterEditDraft(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [characterEditDraft, editingItemDraft, pendingRemovalState, showAddModal]);

  useEffect(() => {
    if (!editingItemDraft) {
      return;
    }

    const ownerInventory =
      mode === 'dm'
        ? (
            dmCharacters.find(
              (character) => character.id === editingItemDraft.characterId
            ) || activeCharacter
          ).inventory
        : activeCharacter.inventory;
    const stillExists = ownerInventory.some(
      (item) => item.id === editingItemDraft.itemId
    );

    if (!stillExists) {
      setEditingItemDraft(null);
    }
  }, [activeCharacter, dmCharacters, editingItemDraft, mode]);

  const catalogById = useMemo(() => {
    const nextCatalogById = new Map(encumbranceCatalogById);
    const allInventory =
      document.kind === 'adnd-encumbrance-dm'
        ? document.characters.flatMap((character) => character.inventory)
        : document.character.inventory;

    allInventory.forEach((item) => {
      if (item.customItem) {
        nextCatalogById.set(item.catalogId, item.customItem);
      }
    });

    return nextCatalogById;
  }, [document]);

  const selectableCatalogGroups = useMemo(() => {
    const coinSortOrder = new Map<string, number>([
      ['Copper piece', 0],
      ['Silver piece', 1],
      ['Electrum piece', 2],
      ['Gold piece', 3],
      ['Platinum piece', 4],
    ]);

    const groups = encumbranceCatalog.reduce<
      Record<EquipmentCategory, EncumbranceCatalogItem[]>
    >(
      (groups, item) => {
        groups[item.category].push(item);
        return groups;
      },
      {
        containers: [],
        armor: [],
        arms: [],
        clothing: [],
        herbs: [],
        'adventuring-gear': [],
        provisions: [],
        'religious-items': [],
        treasure: [],
        coins: [],
      }
    );

    (Object.keys(groups) as EquipmentCategory[]).forEach((category) => {
      groups[category].sort((left, right) => {
        if (category === 'coins') {
          const leftOrder =
            coinSortOrder.get(left.name) ?? Number.MAX_SAFE_INTEGER;
          const rightOrder =
            coinSortOrder.get(right.name) ?? Number.MAX_SAFE_INTEGER;

          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
          }
        }

        return left.name.localeCompare(right.name, undefined, {
          sensitivity: 'base',
        });
      });
    });

    return groups;
  }, []);

  const containerItems = useMemo(
    () =>
      activeCharacter.inventory.filter((item) => {
        const itemInfo = getInventoryItemInfo(item, catalogById);
        return Boolean(itemInfo?.isContainer);
      }),
    [activeCharacter.inventory, catalogById]
  );

  const selectedCatalogItem = encumbranceCatalogById.get(selectedCatalogId);
  const customPreviewItem: EncumbranceCatalogItem = {
    id: '__custom-preview__',
    name: customItemDraft.name.trim() || 'Custom item',
    category: customItemDraft.category,
    encumbranceGp: Math.max(0, customItemDraft.encumbranceGp),
    valueGp: Math.max(0, customItemDraft.valueGp),
    ...(customItemDraft.category === 'containers'
      ? {
          isContainer: true,
          capacityGp: Math.max(1, customItemDraft.capacityGp),
          ...(customItemDraft.ignoresContentsWeightForEncumbrance
            ? {
                ignoresContentsWeightForEncumbrance: true,
              }
            : {}),
        }
      : {}),
  };
  const addPreviewItem =
    addMode === 'catalog' ? selectedCatalogItem : customPreviewItem;
  const addPreviewQuantity =
    addMode === 'catalog'
      ? selectedCatalogItem?.isContainer
        ? 1
        : selectedQuantity
      : customItemDraft.category === 'containers'
      ? 1
      : selectedQuantity;
  const addPreviewWeightPerItemGp = addPreviewItem?.encumbranceGp || 0;
  const addPreviewCurrentWeightGp =
    addPreviewWeightPerItemGp * addPreviewQuantity;
  const addPreviewValuePerItemGp = addPreviewItem?.valueGp || 0;
  const addPreviewCurrentValueGp =
    addPreviewValuePerItemGp * addPreviewQuantity;
  const totalEncumbranceGp = getTotalEncumbranceGp(
    activeCharacter,
    catalogById
  );
  const totalValueGp =
    mode === 'dm'
      ? getTotalValueGp(activeCharacter, catalogById)
      : getTotalKnownValueGp(activeCharacter, catalogById);
  const carryingCapacityGp = getStrengthCarryingCapacityGp(
    activeCharacter.strength
  );
  const effectiveLoadGp = getEffectiveLoadGp(
    totalEncumbranceGp,
    activeCharacter.strength
  );
  const loadBand = getLoadBand(effectiveLoadGp);
  const containerWarningCount = getContainerWarningCount(
    activeCharacter.inventory,
    catalogById
  );
  const pendingRemovalOwner =
    mode === 'dm' && pendingRemovalState
      ? dmCharacters.find(
          (character) => character.id === pendingRemovalState.characterId
        )
      : activeCharacter;
  const pendingRemovalItem = pendingRemovalState
    ? pendingRemovalOwner?.inventory.find(
        (item) => item.id === pendingRemovalState.itemId
      )
    : undefined;
  const pendingRemovalItemInfo = pendingRemovalItem
    ? getInventoryItemInfo(pendingRemovalItem, catalogById)
    : undefined;
  const pendingRemovalDescendantCount = pendingRemovalItem
    ? getDescendantIds(
        pendingRemovalOwner?.inventory || [],
        pendingRemovalItem.id
      ).length
    : 0;
  const editingItemOwner =
    mode === 'dm' && editingItemDraft
      ? dmCharacters.find(
          (character) => character.id === editingItemDraft.characterId
        )
      : activeCharacter;
  const editingOwnerContainerItems =
    editingItemOwner?.inventory.filter((item) => {
      const itemInfo = getInventoryItemInfo(item, catalogById);
      return Boolean(itemInfo?.isContainer);
    }) || [];
  const editingItem = editingItemDraft
    ? editingItemOwner?.inventory.find(
        (item) => item.id === editingItemDraft.itemId
      )
    : undefined;
  const editingItemInfo = editingItem
    ? getInventoryItemInfo(editingItem, catalogById)
    : undefined;
  const editingItemDescendantIds =
    editingItem && editingItemInfo
      ? getDescendantIds(editingItemOwner?.inventory || [], editingItem.id)
      : [];
  const editingContainerSummary =
    editingItem && editingItemInfo?.isContainer
      ? getContainerLoadSummary(
          editingItem.id,
          editingItemOwner?.inventory || [],
          catalogById
        )
      : undefined;
  const editingItemTotalEncumbranceGp =
    editingItem && editingItemInfo
      ? getInventoryItemTotalGp(
          editingItem.id,
          editingItemOwner?.inventory || [],
          catalogById
        )
      : 0;
  const editingItemTotalValueGp =
    editingItem && editingItemInfo
      ? mode === 'dm'
        ? getInventoryItemTotalValueGp(
            editingItem.id,
            editingItemOwner?.inventory || [],
            catalogById
          )
        : getInventoryItemTotalKnownValueGp(
            editingItem.id,
            editingItemOwner?.inventory || [],
            catalogById
          )
      : 0;
  const editingParentOptions =
    editingItem && editingItemInfo
      ? editingOwnerContainerItems.filter((containerItem) => {
          if (
            containerItem.id === editingItem.id ||
            editingItemDescendantIds.includes(containerItem.id)
          ) {
            return false;
          }

          const containerInfo = getInventoryItemInfo(
            containerItem,
            catalogById
          );
          return Boolean(
            containerInfo &&
              canStoreItemInContainer(editingItemInfo, containerInfo)
          );
        })
      : [];
  const editingCustomItemInfo = editingItem?.customItem;

  const openCharacterModal = () => {
    setCharacterEditDraft({
      characterId: activeCharacter.id,
      name: activeCharacter.name,
      strengthScore: activeCharacter.strength.score,
      exceptional: activeCharacter.strength.exceptional,
      dmNotes: activeCharacter.dmNotes,
    });
  };

  const closeCharacterModal = () => {
    setCharacterEditDraft(null);
  };

  const applyCharacterDraft = (nextDraft: CharacterEditDraft) => {
    setDocument((currentDocument) => {
      if (currentDocument.kind === 'adnd-encumbrance-dm') {
        return {
          ...currentDocument,
          characters: currentDocument.characters.map((character) =>
            character.id === nextDraft.characterId
              ? {
                  ...character,
                  name: nextDraft.name,
                  strength: {
                    score: nextDraft.strengthScore,
                    exceptional:
                      nextDraft.strengthScore === 18
                        ? nextDraft.exceptional
                        : 'none',
                  },
                  dmNotes: nextDraft.dmNotes,
                }
              : character
          ),
        };
      }

      return {
        ...currentDocument,
        character: {
          ...currentDocument.character,
          name: nextDraft.name,
          strength: {
            score: nextDraft.strengthScore,
            exceptional:
              nextDraft.strengthScore === 18 ? nextDraft.exceptional : 'none',
          },
        },
      };
    });
  };

  const updateCharacterEditDraft = (
    updater: (draft: CharacterEditDraft) => CharacterEditDraft
  ) => {
    setCharacterEditDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const nextDraft = updater(currentDraft);
      applyCharacterDraft(nextDraft);
      return nextDraft;
    });
  };

  const updateInventoryItem = (
    characterId: string,
    itemId: string,
    updater: (item: EncumbranceInventoryItem) => EncumbranceInventoryItem
  ) => {
    setDocument((currentDocument) => {
      if (currentDocument.kind === 'adnd-encumbrance-dm') {
        return {
          ...currentDocument,
          characters: currentDocument.characters.map((character) =>
            character.id === characterId
              ? {
                  ...character,
                  inventory: character.inventory.map((item) =>
                    item.id === itemId ? updater(item) : item
                  ),
                }
              : character
          ),
        };
      }

      return {
        ...currentDocument,
        character: {
          ...currentDocument.character,
          inventory: currentDocument.character.inventory.map((item) =>
            item.id === itemId ? updater(item) : item
          ),
        },
      };
    });
  };

  const openEditItem = (itemId: string, characterId = activeCharacter.id) => {
    const ownerCharacter =
      mode === 'dm'
        ? dmCharacters.find((character) => character.id === characterId)
        : activeCharacter;
    const item = ownerCharacter?.inventory.find(
      (candidate) => candidate.id === itemId
    );
    if (!item) {
      return;
    }

    const itemInfo = getInventoryItemInfo(item, catalogById);
    if (!itemInfo) {
      return;
    }

    setEditingItemDraft({
      characterId,
      itemId: item.id,
      name: item.name || '',
      day: item.day,
      quantity: item.quantity,
      containerId: item.containerId || '',
      playerNotes: item.playerNotes,
      dmNotes: item.dmNotes || '',
      playerKnowsValue: item.playerKnowsValue,
      playerMagicKnowledge: item.playerMagicKnowledge,
      isMagical: item.isMagical === true,
      fullyIdentified: item.fullyIdentified === true,
      encumbranceGp: getInventoryItemOwnEncumbranceGp(item, itemInfo),
    });
  };

  const closeEditModal = () => {
    setEditingItemDraft(null);
  };

  const openAddModal = () => {
    setAddItemDetailsDraft(defaultAddItemDetailsDraft());
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setAddItemDetailsDraft(defaultAddItemDetailsDraft());
    setShowAddModal(false);
  };

  const applyEditingItemDraft = (
    characterId: string,
    itemId: string,
    itemInfo: EncumbranceCatalogItem,
    draft: InventoryEditDraft
  ) => {
    const normalizedLoad = Math.max(
      0,
      Math.floor(Number(draft.encumbranceGp) || 0)
    );
    const normalizedDay = Math.max(0, Math.floor(Number(draft.day) || 0));
    const normalizedName = draft.name.trim();

    updateInventoryItem(characterId, itemId, (currentItem) => ({
      ...currentItem,
      quantity: itemInfo.isContainer
        ? 1
        : Math.max(1, Math.floor(Number(draft.quantity) || 1)),
      day: normalizedDay,
      containerId: draft.containerId || null,
      playerNotes: draft.playerNotes,
      playerKnowsValue:
        mode === 'dm' ? draft.playerKnowsValue : currentItem.playerKnowsValue,
      ...(mode === 'dm'
        ? {
            dmNotes: draft.dmNotes,
            isMagical: draft.isMagical,
            fullyIdentified:
              draft.isMagical &&
              draft.fullyIdentified &&
              draft.playerMagicKnowledge === 'known-magical'
                ? true
                : undefined,
          }
        : {}),
      playerMagicKnowledge:
        mode === 'dm'
          ? draft.playerMagicKnowledge
          : currentItem.playerMagicKnowledge,
      name:
        normalizedName && normalizedName !== itemInfo.name
          ? normalizedName
          : undefined,
      encumbranceGpOverride:
        normalizedLoad !== itemInfo.encumbranceGp ? normalizedLoad : undefined,
    }));
  };

  const updateEditingItemDraft = (
    updater: (draft: InventoryEditDraft) => InventoryEditDraft
  ) => {
    setEditingItemDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const nextDraft = updater(currentDraft);

      if (editingItemInfo) {
        applyEditingItemDraft(
          nextDraft.characterId,
          nextDraft.itemId,
          editingItemInfo,
          nextDraft
        );
      }

      return nextDraft;
    });
  };

  const removeInventoryItem = (
    itemId: string,
    characterId = activeCharacter.id
  ) => {
    setDocument((currentDocument) => {
      const inventory =
        currentDocument.kind === 'adnd-encumbrance-dm'
          ? (
              currentDocument.characters.find(
                (character) => character.id === characterId
              ) || currentDocument.characters[0]
            )?.inventory || []
          : currentDocument.character.inventory;
      const descendantIds = getDescendantIds(inventory, itemId);
      const blockedIds = new Set([itemId, ...descendantIds]);
      const nextInventory = inventory.filter(
        (item) => !blockedIds.has(item.id)
      );

      if (currentDocument.kind === 'adnd-encumbrance-dm') {
        return {
          ...currentDocument,
          characters: currentDocument.characters.map((character) =>
            character.id === characterId
              ? {
                  ...character,
                  inventory: nextInventory,
                }
              : character
          ),
        };
      }

      return {
        ...currentDocument,
        character: {
          ...currentDocument.character,
          inventory: nextInventory,
        },
      };
    });
  };

  const updateCustomItemDraft = <K extends keyof CustomItemDraft>(
    key: K,
    value: CustomItemDraft[K]
  ) => {
    setCustomItemDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  };

  const updateCustomInventoryItem = (
    characterId: string,
    itemId: string,
    updater: (item: EncumbranceCustomItem) => EncumbranceCustomItem
  ) => {
    updateInventoryItem(characterId, itemId, (currentItem) =>
      currentItem.customItem
        ? {
            ...currentItem,
            customItem: {
              ...updater(currentItem.customItem),
              id: currentItem.catalogId,
            },
          }
        : currentItem
    );
  };

  const selectActiveCharacter = (characterId: string) => {
    if (!isDmDocument(document) || characterId === document.activeCharacterId) {
      setShowAllCharacters(false);
      return;
    }

    setDocument((currentDocument) =>
      currentDocument.kind === 'adnd-encumbrance-dm'
        ? {
            ...currentDocument,
            activeCharacterId: characterId,
          }
        : currentDocument
    );
    setShowAllCharacters(false);
    setCharacterEditDraft(null);
    setEditingItemDraft(null);
    setPendingRemovalState(null);
    setSelectedContainerId('');
    setShowAddModal(false);
  };

  const selectAllCharacters = () => {
    if (mode !== 'dm') {
      return;
    }

    setShowAllCharacters(true);
    setCharacterEditDraft(null);
    setEditingItemDraft(null);
    setPendingRemovalState(null);
    setSelectedContainerId('');
    setShowAddModal(false);
  };

  const addCharacter = () => {
    if (!isDmDocument(document)) {
      return;
    }

    const nextCharacter = createEmptyEncumbranceDmCharacter(
      `Character ${document.characters.length + 1}`
    );

    setDocument((currentDocument) =>
      currentDocument.kind === 'adnd-encumbrance-dm'
        ? {
            ...currentDocument,
            activeCharacterId: nextCharacter.id,
            characters: [...currentDocument.characters, nextCharacter],
          }
        : currentDocument
    );
    setShowAllCharacters(false);
    setSelectedContainerId('');
    setShowAddModal(false);
    setEditingItemDraft(null);
    setPendingRemovalState(null);
    setCharacterEditDraft({
      characterId: nextCharacter.id,
      name: nextCharacter.name,
      strengthScore: nextCharacter.strength.score,
      exceptional: nextCharacter.strength.exceptional,
      dmNotes: nextCharacter.dmNotes,
    });
  };

  const requestRemoveInventoryItem = (itemId: string) => {
    setPendingRemovalState({
      itemId,
      characterId: editingItemDraft?.characterId || activeCharacter.id,
    });
  };

  const closeRemoveModal = () => {
    setPendingRemovalState(null);
  };

  const confirmRemoveInventoryItem = () => {
    if (!pendingRemovalItem || !pendingRemovalItemInfo) {
      setPendingRemovalState(null);
      return;
    }

    removeInventoryItem(
      pendingRemovalItem.id,
      pendingRemovalState?.characterId || activeCharacter.id
    );
    setEditingItemDraft(null);
    setPendingRemovalState(null);
  };

  const addInventoryEntry = (
    currentDocument: EncumbranceDocument,
    itemInfo: EncumbranceCatalogItem,
    quantity: number,
    customItemToPersist?: EncumbranceCustomItem
  ): EncumbranceDocument => {
    const currentInventory =
      currentDocument.kind === 'adnd-encumbrance-dm'
        ? (
            currentDocument.characters.find(
              (character) => character.id === currentDocument.activeCharacterId
            ) || currentDocument.characters[0]
          )?.inventory || []
        : currentDocument.character.inventory;
    const effectiveCatalogById = new Map(encumbranceCatalogById);
    currentInventory.forEach((item) => {
      if (item.customItem) {
        effectiveCatalogById.set(item.catalogId, item.customItem);
      }
    });
    if (customItemToPersist) {
      effectiveCatalogById.set(customItemToPersist.id, customItemToPersist);
    }
    const targetContainer = selectedContainerId
      ? currentInventory.find((item) => item.id === selectedContainerId)
      : undefined;
    const targetContainerInfo = targetContainer
      ? getInventoryItemInfo(targetContainer, effectiveCatalogById)
      : undefined;
    const nextContainerId =
      targetContainerInfo &&
      canStoreItemInContainer(itemInfo, targetContainerInfo)
        ? selectedContainerId
        : '';
    const nextItem: EncumbranceInventoryItem = {
      id: createInventoryItemId(),
      catalogId: itemInfo.id,
      quantity: itemInfo.isContainer ? 1 : quantity,
      containerId: nextContainerId || null,
      day: addItemDetailsDraft.day,
      playerNotes: addItemDetailsDraft.playerNotes,
      playerKnowsValue:
        mode === 'dm' ? addItemDetailsDraft.playerKnowsValue : true,
      playerMagicKnowledge:
        mode === 'dm' ? addItemDetailsDraft.playerMagicKnowledge : 'unknown',
      ...(mode === 'dm'
        ? {
            dmNotes: addItemDetailsDraft.dmNotes,
            isMagical: addItemDetailsDraft.isMagical,
            fullyIdentified:
              addItemDetailsDraft.isMagical &&
              addItemDetailsDraft.fullyIdentified &&
              addItemDetailsDraft.playerMagicKnowledge === 'known-magical'
                ? true
                : undefined,
          }
        : {}),
      ...(customItemToPersist ? { customItem: customItemToPersist } : {}),
    };

    if (currentDocument.kind === 'adnd-encumbrance-dm') {
      return {
        ...currentDocument,
        characters: currentDocument.characters.map((character) =>
          character.id === currentDocument.activeCharacterId
            ? {
                ...character,
                inventory: [...character.inventory, nextItem],
              }
            : character
        ),
      };
    }

    return {
      ...currentDocument,
      character: {
        ...currentDocument.character,
        inventory: [...currentDocument.character.inventory, nextItem],
      },
    };
  };

  const handleAddItem = () => {
    const normalizedQuantity = Math.max(1, Math.floor(selectedQuantity));

    if (addMode === 'catalog') {
      if (!selectedCatalogItem) {
        return;
      }

      setDocument((currentDocument) =>
        addInventoryEntry(
          currentDocument,
          selectedCatalogItem,
          normalizedQuantity
        )
      );
      setSelectedContainerId('');
      setSelectedQuantity(1);
      setAddItemDetailsDraft(defaultAddItemDetailsDraft());
      setShowAddModal(false);
      return;
    }

    if (!customItemDraft.name.trim()) {
      return;
    }

    const customItem: EncumbranceCustomItem = {
      id: createCustomCatalogId(customItemDraft.name),
      name: customItemDraft.name.trim(),
      category: customItemDraft.category,
      encumbranceGp: Math.max(0, customItemDraft.encumbranceGp),
      valueGp: Math.max(0, customItemDraft.valueGp),
      ...(customItemDraft.category === 'containers'
        ? {
            isContainer: true,
            capacityGp: Math.max(1, customItemDraft.capacityGp),
            ...(customItemDraft.ignoresContentsWeightForEncumbrance
              ? {
                  ignoresContentsWeightForEncumbrance: true,
                }
              : {}),
          }
        : {}),
    };

    setDocument((currentDocument) =>
      addInventoryEntry(
        currentDocument,
        customItem,
        normalizedQuantity,
        customItem
      )
    );
    setSelectedContainerId('');
    setSelectedQuantity(1);
    setCustomItemDraft(defaultCustomItemDraft());
    setAddItemDetailsDraft(defaultAddItemDetailsDraft());
    setShowAddModal(false);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseEncumbranceDocument(text);
      const expectedKind = getDocumentKindForMode(mode);

      if (parsed.kind !== expectedKind) {
        throw new Error(
          mode === 'dm'
            ? 'Dungeon Master View can only load DM files.'
            : 'Player View can only load player files.'
        );
      }

      setDocument(parsed);
      setShowAllCharacters(false);
      setCharacterEditDraft(null);
      setShowAddModal(false);
      setEditingItemDraft(null);
      setPendingRemovalState(null);
      setSelectedContainerId('');
      setSelectedQuantity(1);
      setAddItemDetailsDraft(defaultAddItemDetailsDraft());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load the file.';

      console.error(message);
      window.alert(message);
    } finally {
      event.target.value = '';
    }
  };

  const downloadDocument = (nextDocument: EncumbranceDocument) => {
    const blob = new Blob([JSON.stringify(nextDocument, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    const kindLabel =
      nextDocument.kind === 'adnd-encumbrance-dm' ? 'dm' : 'player';
    const baseName =
      nextDocument.kind === 'adnd-encumbrance-dm'
        ? nextDocument.characters.length > 1
          ? 'party'
          : nextDocument.characters[0]?.name || 'character'
        : nextDocument.character.name || 'character';

    anchor.href = url;
    anchor.download = `${slugify(baseName)}-encumbrance-${kindLabel}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportCurrentDocument = () => {
    downloadDocument(document);
  };

  const exportPlayerCopy = () => {
    downloadDocument(redactEncumbranceDocument(document, activeCharacter.id));
  };

  const resetDocument = () => {
    setDocument(createEmptyEncumbranceDocument(getDocumentKindForMode(mode)));
    setShowAllCharacters(false);
    setCharacterEditDraft(null);
    setShowAddModal(false);
    setEditingItemDraft(null);
    setPendingRemovalState(null);
    setCustomItemDraft(defaultCustomItemDraft());
    setAddItemDetailsDraft(defaultAddItemDetailsDraft());
    setSelectedContainerId('');
    setSelectedQuantity(1);
  };

  const visibleTotalEncumbranceGp = visibleCharacters.reduce(
    (total, character) => total + getTotalEncumbranceGp(character, catalogById),
    0
  );
  const visibleTotalValueGp = visibleCharacters.reduce(
    (total, character) =>
      total +
      (mode === 'dm'
        ? getTotalValueGp(character, catalogById)
        : getTotalKnownValueGp(character, catalogById)),
    0
  );
  const visibleContainerWarningCount = visibleCharacters.reduce(
    (count, character) =>
      count + getContainerWarningCount(character.inventory, catalogById),
    0
  );
  const visibleItemCount = visibleCharacters.reduce(
    (count, character) => count + character.inventory.length,
    0
  );
  const visibleContainerCount = visibleCharacters.reduce(
    (count, character) =>
      count +
      character.inventory.filter((item) =>
        Boolean(getInventoryItemInfo(item, catalogById)?.isContainer)
      ).length,
    0
  );

  const renderInventoryRows = (
    character: EncumbranceCharacterSheet,
    containerId: string | null,
    depth = 0
  ): JSX.Element[] =>
    character.inventory
      .filter((item) => item.containerId === containerId)
      .map((item) => {
        const itemInfo = getInventoryItemInfo(item, catalogById);
        if (!itemInfo) {
          return <div key={item.id} />;
        }

        const containerSummary = itemInfo.isContainer
          ? getContainerLoadSummary(item.id, character.inventory, catalogById)
          : undefined;
        const containerUsage = formatContainerUsage(containerSummary);
        const itemOwnEncumbranceGp = getInventoryItemOwnEncumbranceGp(
          item,
          itemInfo
        );
        const itemOwnLoadGp = itemOwnEncumbranceGp * item.quantity;
        const itemOwnValueGp = getInventoryItemOwnValueGp(item, itemInfo);
        const itemVisibleValueGp =
          mode === 'dm'
            ? itemOwnValueGp
            : getPlayerVisibleItemValueGp(item, itemInfo);
        const displayName = getInventoryItemDisplayName(item, itemInfo);
        const noteLines = getRowNoteLines(item, mode);
        let containerStatusLabel: string | undefined;

        if (containerSummary) {
          if (containerSummary.mismatchedItemIds.length > 0) {
            containerStatusLabel = 'Check';
          } else if (containerSummary.isOverCapacity) {
            containerStatusLabel = 'Overfull';
          } else if (
            containerSummary.capacity > 0 &&
            containerSummary.used >= containerSummary.capacity
          ) {
            containerStatusLabel = 'Full';
          }
        }

        return (
          <div
            key={`${character.id}-${item.id}`}
            className={styles['inventoryRowShell']}
          >
            <button
              type="button"
              className={`${styles['inventoryRowButton']} ${
                isAllCharactersView ? styles['inventoryRowButtonParty'] : ''
              } ${
                containerSummary?.isOverCapacity
                  ? styles['inventoryRowWarning']
                  : ''
              }`}
              onClick={() => openEditItem(item.id, character.id)}
              aria-label={`Edit ${displayName}${
                isAllCharactersView
                  ? ` for ${getCharacterDisplayName(character.name)}`
                  : ''
              }`}
              aria-haspopup="dialog"
            >
              {isAllCharactersView && (
                <div className={styles['inventoryCellSummary']}>
                  <span className={styles['inventoryLabel']}>Owner</span>
                  <span className={styles['inventorySummaryValue']}>
                    {getCharacterOwnerLabel(character.name)}
                  </span>
                </div>
              )}
              <div
                className={styles['inventoryCellPrimary']}
                style={{ paddingLeft: `calc(0.3rem + ${depth * 0.9}rem)` }}
              >
                <span className={styles['inventoryLabel']}>Item</span>
                <div className={styles['inventoryNameRow']}>
                  <span className={styles['inventoryName']}>{displayName}</span>
                  {itemInfo.isContainer && (
                    <span className={styles['inventoryBadge']}>Container</span>
                  )}
                  {containerStatusLabel && (
                    <span
                      className={`${styles['inventoryBadge']} ${
                        containerSummary?.isOverCapacity
                          ? styles['inventoryBadgeWarning']
                          : ''
                      }`}
                    >
                      {containerStatusLabel}
                    </span>
                  )}
                </div>
                {containerSummary && containerStatusLabel && containerUsage && (
                  <div className={styles['inventoryStatusText']}>
                    {containerStatusLabel === 'Full'
                      ? `At capacity: ${containerUsage}`
                      : `Container status: ${containerUsage}`}
                  </div>
                )}
              </div>
              <div className={styles['inventoryCellSummary']}>
                <span className={styles['inventoryLabel']}>Day</span>
                <span className={styles['inventorySummaryValue']}>
                  {item.day}
                </span>
              </div>
              <div className={styles['inventoryCellSummary']}>
                <span className={styles['inventoryLabel']}>Qty</span>
                <span className={styles['inventorySummaryValue']}>
                  {item.quantity}
                </span>
              </div>
              <div className={styles['inventoryCellSummary']}>
                <span className={styles['inventoryLabel']}>Load</span>
                <span className={styles['inventorySummaryValue']}>
                  {itemOwnLoadGp} gp
                </span>
              </div>
              <div className={styles['inventoryCellSummary']}>
                <span className={styles['inventoryLabel']}>Value</span>
                <span className={styles['inventorySummaryValue']}>
                  {formatOptionalGpValue(itemVisibleValueGp)}
                </span>
              </div>
              <div
                className={`${styles['inventoryCellSummary']} ${styles['inventoryNotesCell']}`}
              >
                <span className={styles['inventoryLabel']}>Notes</span>
                {noteLines.length > 0 ? (
                  <span className={styles['inventoryNotesPreview']}>
                    {noteLines.map((noteLine, index) => (
                      <span
                        key={`${item.id}-note-${index}`}
                        className={`${styles['inventoryNoteLine']} ${
                          noteLine.tone === 'dm'
                            ? styles['inventoryNoteLineDm']
                            : ''
                        }`}
                      >
                        {noteLine.text}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className={styles['inventoryNotesPreview']} />
                )}
              </div>
            </button>
            {renderInventoryRows(character, item.id, depth + 1)}
          </div>
        );
      });

  const rootItemRows = visibleCharacters.flatMap((character) =>
    renderInventoryRows(character, null)
  );
  const editingItemDisplayName =
    editingItem && editingItemInfo
      ? getInventoryItemDisplayName(editingItem, editingItemInfo)
      : '';
  const editingDraftQuantity = editingItemInfo?.isContainer
    ? 1
    : Math.max(1, Math.floor(Number(editingItemDraft?.quantity) || 1));
  const editingDraftLoadPerItemGp = Math.max(
    0,
    Math.floor(Number(editingItemDraft?.encumbranceGp) || 0)
  );
  const editingDraftOwnLoadGp =
    editingDraftLoadPerItemGp * editingDraftQuantity;
  const editingDraftOwnValueGp =
    editingItemInfo?.valueGp !== undefined
      ? editingItemInfo.valueGp * editingDraftQuantity
      : 0;
  const editingDraftVisibleOwnValueGp =
    mode === 'dm'
      ? editingDraftOwnValueGp
      : editingItemDraft?.playerKnowsValue
      ? editingDraftOwnValueGp
      : null;
  const editingSavedOwnLoadGp =
    editingItem && editingItemInfo
      ? getInventoryItemOwnEncumbranceGp(editingItem, editingItemInfo) *
        editingItem.quantity
      : 0;
  const editingSavedOwnValueGp =
    editingItem && editingItemInfo
      ? getInventoryItemOwnValueGp(editingItem, editingItemInfo)
      : 0;
  const editingSavedVisibleOwnValueGp =
    mode === 'dm'
      ? editingSavedOwnValueGp
      : editingItem?.playerKnowsValue
      ? editingSavedOwnValueGp
      : 0;
  const editingContainedLoadGp = Math.max(
    0,
    editingItemTotalEncumbranceGp - editingSavedOwnLoadGp
  );
  const editingContainedValueGp = Math.max(
    0,
    editingItemTotalValueGp - editingSavedVisibleOwnValueGp
  );
  const modalRoot =
    typeof window !== 'undefined'
      ? window.document.getElementById('app-modal')
      : null;
  const activeCharacterSummary = characterEditDraft
    ? {
        name: characterEditDraft.name,
        strength: {
          score: characterEditDraft.strengthScore,
          exceptional:
            characterEditDraft.strengthScore === 18
              ? characterEditDraft.exceptional
              : 'none',
        },
        dmNotes: characterEditDraft.dmNotes,
      }
    : {
        name: activeCharacter.name,
        strength: activeCharacter.strength,
        dmNotes: activeCharacter.dmNotes,
      };
  const characterSummaryName = isAllCharactersView
    ? 'Party View'
    : getCharacterDisplayName(activeCharacterSummary.name);
  const characterSummaryStrength = formatStrengthSummary(
    activeCharacterSummary.strength.score,
    activeCharacterSummary.strength.exceptional
  );
  const hasDmNotes =
    !isAllCharactersView && Boolean(activeCharacterSummary.dmNotes.trim());

  return (
    <div className={styles['outerContainer']}>
      <div className={styles['title']}>AD&amp;D Encumbrance &amp; Gear</div>
      <div className={styles['contentContainer']}>
        <div className={styles['toolbar']}>
          <div className={styles['toolbarGroup']}>
            <span className={styles['modeBadge']}>
              {mode === 'dm' ? 'Dungeon Master View' : 'Player View'}
            </span>
          </div>
          <div className={styles['toolbarGroup']}>
            <button
              type="button"
              className={`${styles['button']} ${styles['buttonPrimary']} ${styles['buttonCompact']}`}
              onClick={resetDocument}
            >
              New File
            </button>
            <button
              type="button"
              className={`${styles['button']} ${styles['buttonCompact']}`}
              onClick={triggerImport}
            >
              Load File
            </button>
            <button
              type="button"
              className={`${styles['button']} ${styles['buttonCompact']}`}
              onClick={exportCurrentDocument}
            >
              Export {mode === 'dm' ? 'DM File' : 'Player File'}
            </button>
            {mode === 'dm' && (
              <button
                type="button"
                className={`${styles['button']} ${styles['buttonCompact']}`}
                onClick={exportPlayerCopy}
                disabled={isAllCharactersView}
                title={
                  isAllCharactersView
                    ? 'Select a character to export a player copy.'
                    : undefined
                }
              >
                Export Player Copy
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />

        <div className={styles['gridLayout']}>
          <section className={`${styles['card']} ${styles['characterCard']}`}>
            <div className={styles['cardHeader']}>
              <div className={styles['cardTitle']}>Character</div>
              {mode === 'dm' && (
                <div className={styles['cardHeaderActions']}>
                  <button
                    type="button"
                    className={`${styles['button']} ${styles['buttonPrimary']} ${styles['buttonCompact']}`}
                    onClick={addCharacter}
                  >
                    Add Character
                  </button>
                </div>
              )}
            </div>
            {mode === 'dm' && (
              <div className={styles['characterTabs']}>
                <button
                  type="button"
                  className={`${styles['characterTab']} ${
                    isAllCharactersView ? styles['characterTabActive'] : ''
                  }`}
                  onClick={selectAllCharacters}
                >
                  All Characters
                </button>
                {dmCharacters.map((character) => {
                  const tabLabel = getCharacterDisplayName(character.name);
                  return (
                    <button
                      key={character.id}
                      type="button"
                      className={`${styles['characterTab']} ${
                        !isAllCharactersView &&
                        character.id === activeCharacter.id
                          ? styles['characterTabActive']
                          : ''
                      }`}
                      onClick={() => selectActiveCharacter(character.id)}
                    >
                      {tabLabel}
                    </button>
                  );
                })}
              </div>
            )}
            {isAllCharactersView ? (
              <div className={styles['characterSummary']}>
                <div className={styles['characterSummaryName']}>
                  {characterSummaryName}
                </div>
                <div className={styles['characterSummaryRow']}>
                  <span className={styles['characterSummaryChip']}>
                    {visibleCharacterCount} characters
                  </span>
                  <span className={styles['characterSummaryText']}>
                    Select a character tab to edit details.
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={styles['characterSummaryButton']}
                onClick={openCharacterModal}
                aria-label={`Edit ${characterSummaryName}`}
                aria-haspopup="dialog"
              >
                <div className={styles['characterSummary']}>
                  <div className={styles['characterSummaryName']}>
                    {characterSummaryName}
                  </div>
                  <div className={styles['characterSummaryRow']}>
                    <span className={styles['characterSummaryChip']}>
                      STR {characterSummaryStrength}
                    </span>
                    {mode === 'dm' && hasDmNotes && (
                      <span className={styles['characterSummaryText']}>
                        Private notes saved
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )}
          </section>

          <section className={styles['card']}>
            <div className={styles['cardTitle']}>Encumbrance</div>
            {isAllCharactersView ? (
              <div className={styles['summaryGrid']}>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Characters</span>
                  <strong>{visibleCharacterCount}</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Items</span>
                  <strong>{visibleItemCount}</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Containers</span>
                  <strong>{visibleContainerCount}</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Total</span>
                  <strong>{visibleTotalEncumbranceGp} gp</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>
                    {mode === 'dm' ? 'Value' : 'Known value'}
                  </span>
                  <strong>{formatGpValue(visibleTotalValueGp)} gp</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Warnings</span>
                  <strong>{visibleContainerWarningCount}</strong>
                </div>
              </div>
            ) : (
              <div className={styles['summaryGrid']}>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Total</span>
                  <strong>{totalEncumbranceGp} gp</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>
                    12&quot; Capacity
                  </span>
                  <strong>{carryingCapacityGp} gp</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>
                    {mode === 'dm' ? 'Value' : 'Known value'}
                  </span>
                  <strong>{formatGpValue(totalValueGp)} gp</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Band</span>
                  <strong>{loadBand.label}</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Move</span>
                  <strong>{loadBand.movement}</strong>
                </div>
                <div className={styles['summaryValue']}>
                  <span className={styles['summaryLabel']}>Warnings</span>
                  <strong>{containerWarningCount}</strong>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className={styles['card']}>
          <div className={styles['cardHeader']}>
            <div className={styles['cardTitle']}>Inventory</div>
            <div className={styles['cardHeaderActions']}>
              <button
                type="button"
                className={`${styles['button']} ${styles['buttonPrimary']} ${styles['buttonCompact']}`}
                onClick={openAddModal}
                disabled={isAllCharactersView}
                title={
                  isAllCharactersView
                    ? 'Select a character to add items.'
                    : undefined
                }
              >
                Add Item
              </button>
            </div>
          </div>
          <div
            className={`${styles['inventoryHeader']} ${
              isAllCharactersView ? styles['inventoryHeaderParty'] : ''
            }`}
          >
            {isAllCharactersView && <span>Owner</span>}
            <span>Item</span>
            <span>Day</span>
            <span>Qty</span>
            <span>Load</span>
            <span>{mode === 'dm' ? 'Value' : 'Known value'}</span>
            <span>Notes</span>
          </div>
          <div className={styles['inventoryList']}>
            {rootItemRows.length > 0 ? (
              rootItemRows
            ) : (
              <div className={styles['placeholder']}>
                {isAllCharactersView
                  ? 'Select a character to add items, or switch back to a single character view.'
                  : 'Use Add Item to start building the loadout.'}
              </div>
            )}
          </div>
        </section>
      </div>
      <div id={'app-modal'} />
      {modalRoot &&
        createPortal(
          <>
            {characterEditDraft && (
              <>
                <div
                  className={styles['modalShadow']}
                  onClick={closeCharacterModal}
                />
                <div
                  className={`${styles['modal']} ${styles['editModal']}`}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="encumbrance-character-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    id="encumbrance-character-title"
                    className={styles['modalTitle']}
                  >
                    Edit Character
                  </div>
                  <div
                    className={`${styles['modalBody']} ${styles['liveEditModalBody']}`}
                  >
                    <div className={styles['modalFields']}>
                      <label className={styles['modalFieldWide']}>
                        <span className={styles['fieldLabel']}>Name</span>
                        <input
                          className={styles['fieldControl']}
                          type="text"
                          value={characterEditDraft.name}
                          onChange={(event) =>
                            updateCharacterEditDraft((currentDraft) => ({
                              ...currentDraft,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Unnamed adventurer"
                          autoFocus
                        />
                      </label>
                      <label className={styles['fieldGroup']}>
                        <span className={styles['fieldLabel']}>Strength</span>
                        <select
                          className={styles['fieldControl']}
                          value={characterEditDraft.strengthScore}
                          onChange={(event) =>
                            updateCharacterEditDraft((currentDraft) => ({
                              ...currentDraft,
                              strengthScore: Number(event.target.value) || 8,
                              exceptional:
                                Number(event.target.value) === 18
                                  ? currentDraft.exceptional
                                  : 'none',
                            }))
                          }
                        >
                          {Array.from(
                            { length: 16 },
                            (_, index) => index + 3
                          ).map((score) => (
                            <option key={score} value={score}>
                              {score}
                            </option>
                          ))}
                        </select>
                      </label>
                      {characterEditDraft.strengthScore === 18 && (
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>
                            Exceptional
                          </span>
                          <select
                            className={styles['fieldControl']}
                            value={characterEditDraft.exceptional}
                            onChange={(event) =>
                              updateCharacterEditDraft((currentDraft) => ({
                                ...currentDraft,
                                exceptional: event.target
                                  .value as ExceptionalStrengthTier,
                              }))
                            }
                          >
                            <option value="none">None</option>
                            <option value="01-50">18/01-50</option>
                            <option value="51-75">18/51-75</option>
                            <option value="76-90">18/76-90</option>
                            <option value="91-99">18/91-99</option>
                            <option value="00">18/00</option>
                          </select>
                        </label>
                      )}
                      {mode === 'dm' && (
                        <label className={styles['modalFieldWide']}>
                          <span className={styles['fieldLabel']}>DM Notes</span>
                          <textarea
                            className={`${styles['fieldControl']} ${styles['modalNotes']}`}
                            rows={4}
                            value={characterEditDraft.dmNotes}
                            ref={(element) => resizeTextarea(element)}
                            onChange={(event) =>
                              updateCharacterEditDraft((currentDraft) => ({
                                ...currentDraft,
                                dmNotes: event.target.value,
                              }))
                            }
                            onInput={(event) =>
                              resizeTextarea(event.currentTarget)
                            }
                            placeholder="Private note stripped from player exports."
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {showAddModal && (
              <>
                <div
                  className={styles['modalShadow']}
                  onClick={closeAddModal}
                />
                <div
                  className={`${styles['modal']} ${styles['editModal']}`}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="encumbrance-add-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    id="encumbrance-add-title"
                    className={styles['modalTitle']}
                  >
                    Add Item
                  </div>
                  <div
                    className={`${styles['modalBody']} ${styles['liveEditModalBody']}`}
                  >
                    <div className={styles['modalToggleRow']}>
                      <button
                        type="button"
                        className={`${styles['button']} ${
                          styles['buttonCompact']
                        } ${
                          addMode === 'catalog' ? styles['buttonSelected'] : ''
                        }`}
                        onClick={() => setAddMode('catalog')}
                      >
                        Catalog Item
                      </button>
                      <button
                        type="button"
                        className={`${styles['button']} ${
                          styles['buttonCompact']
                        } ${
                          addMode === 'custom' ? styles['buttonSelected'] : ''
                        }`}
                        onClick={() => setAddMode('custom')}
                      >
                        Custom Item
                      </button>
                    </div>
                    <div className={styles['modalSection']}>
                      <div className={styles['modalFields']}>
                        {addMode === 'catalog' ? (
                          <label className={styles['modalFieldWide']}>
                            <span className={styles['fieldLabel']}>Item</span>
                            <select
                              className={styles['fieldControl']}
                              value={selectedCatalogId}
                              onChange={(event) => {
                                const nextCatalogId = event.target.value;
                                setSelectedCatalogId(nextCatalogId);
                                const nextItem =
                                  encumbranceCatalogById.get(nextCatalogId);
                                if (nextItem?.isContainer) {
                                  setSelectedQuantity(1);
                                }
                              }}
                            >
                              {(
                                Object.keys(
                                  categoryLabels
                                ) as EquipmentCategory[]
                              ).map((category) => (
                                <optgroup
                                  key={category}
                                  label={categoryLabels[category]}
                                >
                                  {selectableCatalogGroups[category].map(
                                    (item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    )
                                  )}
                                </optgroup>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <>
                            <label className={styles['modalFieldWide']}>
                              <span className={styles['fieldLabel']}>Name</span>
                              <input
                                className={styles['fieldControl']}
                                type="text"
                                value={customItemDraft.name}
                                onChange={(event) =>
                                  updateCustomItemDraft(
                                    'name',
                                    event.target.value
                                  )
                                }
                                placeholder="Custom item"
                                autoFocus
                              />
                            </label>
                            <label className={styles['fieldGroup']}>
                              <span className={styles['fieldLabel']}>
                                Category
                              </span>
                              <select
                                className={styles['fieldControl']}
                                value={customItemDraft.category}
                                onChange={(event) =>
                                  updateCustomItemDraft(
                                    'category',
                                    event.target.value as CustomCategory
                                  )
                                }
                              >
                                {customCategoryOptions.map((category) => (
                                  <option key={category} value={category}>
                                    {categoryLabels[category]}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </>
                        )}
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Quantity</span>
                          <input
                            className={styles['fieldControl']}
                            type="number"
                            min={1}
                            step={1}
                            value={addPreviewQuantity}
                            disabled={
                              addMode === 'catalog'
                                ? selectedCatalogItem?.isContainer
                                : customItemDraft.category === 'containers'
                            }
                            onChange={(event) =>
                              setSelectedQuantity(
                                Math.max(
                                  1,
                                  Math.floor(Number(event.target.value) || 1)
                                )
                              )
                            }
                          />
                        </label>
                        {mode === 'dm' && (
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>Day</span>
                            <input
                              className={styles['fieldControl']}
                              type="number"
                              min={0}
                              step={1}
                              value={addItemDetailsDraft.day}
                              onChange={(event) =>
                                setAddItemDetailsDraft((currentDraft) => ({
                                  ...currentDraft,
                                  day: Math.max(
                                    0,
                                    Math.floor(Number(event.target.value) || 0)
                                  ),
                                }))
                              }
                            />
                          </label>
                        )}
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>
                            Stored in
                          </span>
                          <select
                            className={styles['fieldControl']}
                            value={selectedContainerId}
                            onChange={(event) =>
                              setSelectedContainerId(event.target.value)
                            }
                          >
                            <option value="">On person</option>
                            {containerItems.map((containerItem) => {
                              const containerInfo = getInventoryItemInfo(
                                containerItem,
                                catalogById
                              );
                              const isAllowed = containerInfo
                                ? canStoreItemInContainer(
                                    addPreviewItem || customPreviewItem,
                                    containerInfo
                                  )
                                : true;

                              return (
                                <option
                                  key={containerItem.id}
                                  value={containerItem.id}
                                  disabled={!isAllowed}
                                >
                                  {containerInfo
                                    ? getInventoryItemDisplayName(
                                        containerItem,
                                        containerInfo
                                      )
                                    : 'Container'}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>
                            Weight per item
                          </span>
                          {addMode === 'catalog' ? (
                            <div className={styles['fieldReadonly']}>
                              {addPreviewWeightPerItemGp} gp
                            </div>
                          ) : (
                            <input
                              className={styles['fieldControl']}
                              type="number"
                              min={0}
                              step={1}
                              value={customItemDraft.encumbranceGp}
                              onChange={(event) =>
                                updateCustomItemDraft(
                                  'encumbranceGp',
                                  Math.max(
                                    0,
                                    Math.floor(Number(event.target.value) || 0)
                                  )
                                )
                              }
                            />
                          )}
                        </label>
                        {addMode === 'custom' && (
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Value per item
                            </span>
                            <input
                              className={styles['fieldControl']}
                              type="number"
                              min={0}
                              step={0.01}
                              value={customItemDraft.valueGp}
                              onChange={(event) =>
                                updateCustomItemDraft(
                                  'valueGp',
                                  Math.max(0, Number(event.target.value) || 0)
                                )
                              }
                            />
                          </label>
                        )}
                        {addMode === 'custom' &&
                          customItemDraft.category === 'containers' && (
                            <>
                              <label className={styles['fieldGroup']}>
                                <span className={styles['fieldLabel']}>
                                  Capacity
                                </span>
                                <input
                                  className={styles['fieldControl']}
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={customItemDraft.capacityGp}
                                  onChange={(event) =>
                                    updateCustomItemDraft(
                                      'capacityGp',
                                      Math.max(
                                        1,
                                        Math.floor(
                                          Number(event.target.value) || 1
                                        )
                                      )
                                    )
                                  }
                                />
                              </label>
                              <label className={styles['fieldGroup']}>
                                <span className={styles['fieldLabel']}>
                                  Carried weight
                                </span>
                                <select
                                  className={styles['fieldControl']}
                                  value={
                                    customItemDraft.ignoresContentsWeightForEncumbrance
                                      ? 'own'
                                      : 'count'
                                  }
                                  onChange={(event) =>
                                    updateCustomItemDraft(
                                      'ignoresContentsWeightForEncumbrance',
                                      event.target.value === 'own'
                                    )
                                  }
                                >
                                  <option value="count">
                                    {carriedWeightRuleOptions.count}
                                  </option>
                                  <option value="own">
                                    {carriedWeightRuleOptions.own}
                                  </option>
                                </select>
                              </label>
                            </>
                          )}
                        <label className={styles['modalFieldWide']}>
                          <span className={styles['fieldLabel']}>
                            Player Notes
                          </span>
                          <textarea
                            className={`${styles['fieldControl']} ${styles['modalNotes']}`}
                            rows={3}
                            value={addItemDetailsDraft.playerNotes}
                            ref={(element) => resizeTextarea(element)}
                            onChange={(event) =>
                              setAddItemDetailsDraft((currentDraft) => ({
                                ...currentDraft,
                                playerNotes: event.target.value,
                              }))
                            }
                            onInput={(event) =>
                              resizeTextarea(event.currentTarget)
                            }
                            placeholder="Visible in player copies."
                          />
                        </label>
                      </div>
                    </div>
                    {mode === 'dm' && (
                      <div
                        className={`${styles['modalSection']} ${styles['modalSectionDm']}`}
                      >
                        <div className={styles['modalFields']}>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Magic known to player
                            </span>
                            <select
                              className={styles['fieldControl']}
                              value={addItemDetailsDraft.playerMagicKnowledge}
                              onChange={(event) =>
                                setAddItemDetailsDraft((currentDraft) => {
                                  const nextKnowledge = event.target
                                    .value as MagicKnowledge;
                                  return {
                                    ...currentDraft,
                                    playerMagicKnowledge: nextKnowledge,
                                    fullyIdentified:
                                      nextKnowledge === 'known-magical'
                                        ? currentDraft.fullyIdentified
                                        : false,
                                  };
                                })
                              }
                            >
                              {(
                                Object.keys(
                                  magicKnowledgeLabels
                                ) as MagicKnowledge[]
                              ).map((knowledge) => (
                                <option key={knowledge} value={knowledge}>
                                  {magicKnowledgeLabels[knowledge]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Value known to player
                            </span>
                            <select
                              className={styles['fieldControl']}
                              value={
                                addItemDetailsDraft.playerKnowsValue
                                  ? 'yes'
                                  : 'no'
                              }
                              onChange={(event) =>
                                setAddItemDetailsDraft((currentDraft) => ({
                                  ...currentDraft,
                                  playerKnowsValue:
                                    event.target.value === 'yes',
                                }))
                              }
                            >
                              <option value="yes">Known</option>
                              <option value="no">Unknown</option>
                            </select>
                          </label>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Magical truth
                            </span>
                            <select
                              className={styles['fieldControl']}
                              value={
                                addItemDetailsDraft.isMagical ? 'yes' : 'no'
                              }
                              onChange={(event) =>
                                setAddItemDetailsDraft((currentDraft) => ({
                                  ...currentDraft,
                                  isMagical: event.target.value === 'yes',
                                  fullyIdentified:
                                    event.target.value === 'yes'
                                      ? currentDraft.fullyIdentified
                                      : false,
                                }))
                              }
                            >
                              <option value="no">Mundane</option>
                              <option value="yes">Magical</option>
                            </select>
                          </label>
                          {addItemDetailsDraft.isMagical && (
                            <label className={styles['fieldGroup']}>
                              <span className={styles['fieldLabel']}>
                                Fully identified
                              </span>
                              <select
                                className={styles['fieldControl']}
                                value={
                                  addItemDetailsDraft.fullyIdentified
                                    ? 'yes'
                                    : 'no'
                                }
                                onChange={(event) =>
                                  setAddItemDetailsDraft((currentDraft) => ({
                                    ...currentDraft,
                                    fullyIdentified:
                                      event.target.value === 'yes',
                                    playerMagicKnowledge:
                                      event.target.value === 'yes'
                                        ? 'known-magical'
                                        : currentDraft.playerMagicKnowledge,
                                  }))
                                }
                              >
                                <option value="no">Not fully identified</option>
                                <option value="yes">Fully identified</option>
                              </select>
                            </label>
                          )}
                          <label className={styles['modalFieldWide']}>
                            <span className={styles['fieldLabel']}>
                              DM Notes
                            </span>
                            <textarea
                              className={`${styles['fieldControl']} ${styles['modalNotes']}`}
                              rows={3}
                              value={addItemDetailsDraft.dmNotes}
                              ref={(element) => resizeTextarea(element)}
                              onChange={(event) =>
                                setAddItemDetailsDraft((currentDraft) => ({
                                  ...currentDraft,
                                  dmNotes: event.target.value,
                                }))
                              }
                              onInput={(event) =>
                                resizeTextarea(event.currentTarget)
                              }
                              placeholder="Private note stripped from player exports."
                            />
                          </label>
                        </div>
                      </div>
                    )}
                    <div className={styles['modalMetaGrid']}>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Value per item
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {formatGpValue(addPreviewValuePerItemGp)} gp
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Current weight
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {addPreviewCurrentWeightGp} gp
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Current value
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {formatGpValue(addPreviewCurrentValueGp)} gp
                        </span>
                      </div>
                      {addMode === 'catalog' && selectedCatalogItem && (
                        <div className={styles['modalMetaItem']}>
                          <span className={styles['modalMetaLabel']}>
                            Catalog item
                          </span>
                          <span className={styles['modalMetaValue']}>
                            {selectedCatalogItem.name}
                          </span>
                        </div>
                      )}
                      {addMode === 'custom' && (
                        <div className={styles['modalMetaItem']}>
                          <span className={styles['modalMetaLabel']}>
                            Category
                          </span>
                          <span className={styles['modalMetaValue']}>
                            {categoryLabels[customItemDraft.category]}
                          </span>
                        </div>
                      )}
                      {addPreviewItem?.isContainer &&
                        typeof addPreviewItem.capacityGp === 'number' && (
                          <div className={styles['modalMetaItem']}>
                            <span className={styles['modalMetaLabel']}>
                              Capacity
                            </span>
                            <span className={styles['modalMetaValue']}>
                              {addPreviewItem.capacityGp} gp
                            </span>
                          </div>
                        )}
                      {addPreviewItem?.ignoresContentsWeightForEncumbrance && (
                        <div className={styles['modalMetaItem']}>
                          <span className={styles['modalMetaLabel']}>
                            Carried weight
                          </span>
                          <span className={styles['modalMetaValue']}>
                            {carriedWeightRuleOptions.own}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles['modalActions']}>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonCompact']}`}
                      onClick={closeAddModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonCompact']} ${styles['buttonPrimary']}`}
                      onClick={handleAddItem}
                      disabled={
                        addMode === 'catalog'
                          ? !selectedCatalogItem
                          : !customItemDraft.name.trim()
                      }
                    >
                      {addMode === 'catalog' ? 'Add Item' : 'Add Custom Item'}
                    </button>
                  </div>
                </div>
              </>
            )}
            {editingItemDraft && editingItem && editingItemInfo && (
              <>
                <div
                  className={styles['modalShadow']}
                  onClick={closeEditModal}
                />
                <div
                  className={`${styles['modal']} ${styles['editModal']}`}
                  role="dialog"
                  aria-modal="true"
                  aria-label={editingItemDisplayName}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    className={`${styles['modalBody']} ${styles['liveEditModalBody']}`}
                  >
                    <div className={styles['modalSection']}>
                      <div className={styles['modalFields']}>
                        <label className={styles['modalFieldWide']}>
                          <span className={styles['fieldLabel']}>Name</span>
                          <input
                            className={styles['fieldControl']}
                            type="text"
                            value={editingItemDraft.name}
                            onChange={(event) =>
                              updateEditingItemDraft((currentDraft) => ({
                                ...currentDraft,
                                name: event.target.value,
                              }))
                            }
                            placeholder={editingItemInfo.name}
                            autoFocus
                          />
                        </label>
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Quantity</span>
                          <input
                            className={styles['fieldControl']}
                            type="number"
                            min={1}
                            step={1}
                            value={editingDraftQuantity}
                            disabled={editingItemInfo.isContainer}
                            onChange={(event) =>
                              updateEditingItemDraft((currentDraft) => ({
                                ...currentDraft,
                                quantity: Math.max(
                                  1,
                                  Math.floor(Number(event.target.value) || 1)
                                ),
                              }))
                            }
                          />
                        </label>
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>
                            Weight per item
                          </span>
                          <input
                            className={styles['fieldControl']}
                            type="number"
                            min={0}
                            step={1}
                            value={editingDraftLoadPerItemGp}
                            onChange={(event) =>
                              updateEditingItemDraft((currentDraft) => ({
                                ...currentDraft,
                                encumbranceGp: Math.max(
                                  0,
                                  Math.floor(Number(event.target.value) || 0)
                                ),
                              }))
                            }
                          />
                        </label>
                        {mode === 'dm' ? (
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>Day</span>
                            <input
                              className={styles['fieldControl']}
                              type="number"
                              min={0}
                              step={1}
                              value={editingItemDraft.day}
                              onChange={(event) =>
                                updateEditingItemDraft((currentDraft) => ({
                                  ...currentDraft,
                                  day: Math.max(
                                    0,
                                    Math.floor(Number(event.target.value) || 0)
                                  ),
                                }))
                              }
                            />
                          </label>
                        ) : (
                          <div className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>Day</span>
                            <div className={styles['fieldReadonly']}>
                              {editingItem.day}
                            </div>
                          </div>
                        )}
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>
                            Stored in
                          </span>
                          <select
                            className={styles['fieldControl']}
                            value={editingItemDraft.containerId}
                            onChange={(event) =>
                              updateEditingItemDraft((currentDraft) => ({
                                ...currentDraft,
                                containerId: event.target.value,
                              }))
                            }
                          >
                            <option value="">On person</option>
                            {editingParentOptions.map((containerItem) => {
                              const containerInfo = getInventoryItemInfo(
                                containerItem,
                                catalogById
                              );

                              return (
                                <option
                                  key={containerItem.id}
                                  value={containerItem.id}
                                >
                                  {containerInfo
                                    ? getInventoryItemDisplayName(
                                        containerItem,
                                        containerInfo
                                      )
                                    : 'Container'}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                        <label className={styles['modalFieldWide']}>
                          <span className={styles['fieldLabel']}>
                            Player Notes
                          </span>
                          <textarea
                            className={`${styles['fieldControl']} ${styles['modalNotes']}`}
                            rows={3}
                            value={editingItemDraft.playerNotes}
                            ref={(element) => resizeTextarea(element)}
                            onChange={(event) =>
                              updateEditingItemDraft((currentDraft) => ({
                                ...currentDraft,
                                playerNotes: event.target.value,
                              }))
                            }
                            onInput={(event) =>
                              resizeTextarea(event.currentTarget)
                            }
                            placeholder="Short note"
                          />
                        </label>
                      </div>
                    </div>
                    {mode === 'dm' && (
                      <div
                        className={`${styles['modalSection']} ${styles['modalSectionDm']}`}
                      >
                        <div className={styles['modalFields']}>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Magic known to player
                            </span>
                            <select
                              className={styles['fieldControl']}
                              value={editingItemDraft.playerMagicKnowledge}
                              onChange={(event) =>
                                updateEditingItemDraft((currentDraft) => {
                                  const nextKnowledge = event.target
                                    .value as MagicKnowledge;

                                  return {
                                    ...currentDraft,
                                    playerMagicKnowledge: nextKnowledge,
                                    fullyIdentified:
                                      nextKnowledge === 'known-magical'
                                        ? currentDraft.fullyIdentified
                                        : false,
                                  };
                                })
                              }
                            >
                              {(
                                Object.keys(
                                  magicKnowledgeLabels
                                ) as MagicKnowledge[]
                              ).map((knowledge) => (
                                <option key={knowledge} value={knowledge}>
                                  {magicKnowledgeLabels[knowledge]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Value known to player
                            </span>
                            <select
                              className={styles['fieldControl']}
                              value={
                                editingItemDraft.playerKnowsValue ? 'yes' : 'no'
                              }
                              onChange={(event) =>
                                updateEditingItemDraft((currentDraft) => ({
                                  ...currentDraft,
                                  playerKnowsValue:
                                    event.target.value === 'yes',
                                }))
                              }
                            >
                              <option value="yes">Known</option>
                              <option value="no">Unknown</option>
                            </select>
                          </label>
                          {editingCustomItemInfo?.isContainer && (
                            <label className={styles['fieldGroup']}>
                              <span className={styles['fieldLabel']}>
                                Carried weight
                              </span>
                              <select
                                className={styles['fieldControl']}
                                value={
                                  editingCustomItemInfo.ignoresContentsWeightForEncumbrance
                                    ? 'own'
                                    : 'count'
                                }
                                onChange={(event) =>
                                  updateCustomInventoryItem(
                                    editingItemDraft.characterId,
                                    editingItemDraft.itemId,
                                    (currentItem) => ({
                                      ...currentItem,
                                      ignoresContentsWeightForEncumbrance:
                                        event.target.value === 'own',
                                    })
                                  )
                                }
                              >
                                <option value="count">
                                  {carriedWeightRuleOptions.count}
                                </option>
                                <option value="own">
                                  {carriedWeightRuleOptions.own}
                                </option>
                              </select>
                            </label>
                          )}
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Magical truth
                            </span>
                            <select
                              className={styles['fieldControl']}
                              value={editingItemDraft.isMagical ? 'yes' : 'no'}
                              onChange={(event) =>
                                updateEditingItemDraft((currentDraft) => ({
                                  ...currentDraft,
                                  isMagical: event.target.value === 'yes',
                                  fullyIdentified:
                                    event.target.value === 'yes'
                                      ? currentDraft.fullyIdentified
                                      : false,
                                }))
                              }
                            >
                              <option value="no">Mundane</option>
                              <option value="yes">Magical</option>
                            </select>
                          </label>
                          {editingItemDraft.isMagical && (
                            <label className={styles['fieldGroup']}>
                              <span className={styles['fieldLabel']}>
                                Fully identified
                              </span>
                              <select
                                className={styles['fieldControl']}
                                value={
                                  editingItemDraft.fullyIdentified
                                    ? 'yes'
                                    : 'no'
                                }
                                onChange={(event) =>
                                  updateEditingItemDraft((currentDraft) => ({
                                    ...currentDraft,
                                    fullyIdentified:
                                      event.target.value === 'yes',
                                    playerMagicKnowledge:
                                      event.target.value === 'yes'
                                        ? 'known-magical'
                                        : currentDraft.playerMagicKnowledge,
                                  }))
                                }
                              >
                                <option value="no">Not fully identified</option>
                                <option value="yes">Fully identified</option>
                              </select>
                            </label>
                          )}
                          <label className={styles['modalFieldWide']}>
                            <span className={styles['fieldLabel']}>
                              DM Notes
                            </span>
                            <textarea
                              className={`${styles['fieldControl']} ${styles['modalNotes']}`}
                              rows={3}
                              value={editingItemDraft.dmNotes}
                              ref={(element) => resizeTextarea(element)}
                              onChange={(event) =>
                                updateEditingItemDraft((currentDraft) => ({
                                  ...currentDraft,
                                  dmNotes: event.target.value,
                                }))
                              }
                              onInput={(event) =>
                                resizeTextarea(event.currentTarget)
                              }
                              placeholder="Private note stripped from player exports."
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <div className={styles['modalMetaGrid']}>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          {mode === 'dm'
                            ? 'Value per item'
                            : 'Known value per item'}
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {formatOptionalGpValue(
                            mode === 'dm'
                              ? editingItemInfo.valueGp
                              : editingItemDraft.playerKnowsValue
                              ? editingItemInfo.valueGp
                              : null
                          )}
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Current weight
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {editingDraftOwnLoadGp} gp
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          {mode === 'dm' ? 'Row value' : 'Known value'}
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {formatOptionalGpValue(editingDraftVisibleOwnValueGp)}
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Catalog weight
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {editingItemInfo.encumbranceGp} gp
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Catalog name
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {editingItemInfo.name}
                        </span>
                      </div>
                      {editingItemInfo.ignoresContentsWeightForEncumbrance && (
                        <div className={styles['modalMetaItem']}>
                          <span className={styles['modalMetaLabel']}>
                            Carried weight
                          </span>
                          <span className={styles['modalMetaValue']}>
                            {carriedWeightRuleOptions.own}
                          </span>
                        </div>
                      )}
                      {editingContainerSummary && (
                        <>
                          <div className={styles['modalMetaItem']}>
                            <span className={styles['modalMetaLabel']}>
                              Container usage
                            </span>
                            <span className={styles['modalMetaValue']}>
                              {formatContainerUsage(editingContainerSummary)}
                            </span>
                          </div>
                          <div className={styles['modalMetaItem']}>
                            <span className={styles['modalMetaLabel']}>
                              Contained weight
                            </span>
                            <span className={styles['modalMetaValue']}>
                              {editingContainedLoadGp} gp
                            </span>
                          </div>
                          <div className={styles['modalMetaItem']}>
                            <span className={styles['modalMetaLabel']}>
                              {mode === 'dm'
                                ? 'Contained value'
                                : 'Known contained value'}
                            </span>
                            <span className={styles['modalMetaValue']}>
                              {formatGpValue(editingContainedValueGp)} gp
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles['modalDangerRow']}>
                      <button
                        type="button"
                        className={`${styles['button']} ${styles['buttonCompact']} ${styles['buttonDanger']}`}
                        onClick={() =>
                          requestRemoveInventoryItem(editingItem.id)
                        }
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {pendingRemovalItem && pendingRemovalItemInfo && (
              <>
                <div
                  className={styles['modalShadow']}
                  onClick={closeRemoveModal}
                />
                <div
                  className={styles['modal']}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="encumbrance-remove-title"
                  aria-describedby="encumbrance-remove-description"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    id="encumbrance-remove-title"
                    className={styles['modalTitle']}
                  >
                    Remove Item
                  </div>
                  <div className={styles['modalBody']}>
                    <p
                      id="encumbrance-remove-description"
                      className={styles['modalText']}
                    >
                      Remove{' '}
                      <span className={styles['modalItemName']}>
                        {getInventoryItemDisplayName(
                          pendingRemovalItem,
                          pendingRemovalItemInfo
                        )}
                      </span>
                      ? This cannot be undone from the sheet.
                    </p>
                    {pendingRemovalDescendantCount > 0 && (
                      <p className={styles['modalText']}>
                        It also contains {pendingRemovalDescendantCount} nested
                        item{pendingRemovalDescendantCount === 1 ? '' : 's'},
                        and those will be removed too.
                      </p>
                    )}
                  </div>
                  <div className={styles['modalActions']}>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonCompact']}`}
                      onClick={closeRemoveModal}
                      autoFocus
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonCompact']} ${styles['buttonDanger']}`}
                      onClick={confirmRemoveInventoryItem}
                    >
                      Remove Item
                    </button>
                  </div>
                </div>
              </>
            )}
          </>,
          modalRoot
        )}
    </div>
  );
};

export default EncumbranceApp;
