import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './encumbrance.module.css';
import type {
  EncumbranceCatalogItem,
  EncumbranceCustomItem,
  EncumbranceDocument,
  EncumbranceInventoryItem,
  EncumbranceMode,
  EquipmentCategory,
  ExceptionalStrengthTier,
} from '../../types/encumbrance';
import {
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
  redactEncumbranceDocument,
} from '../../helpers/encumbranceDocument';
import {
  getContainerLoadSummary,
  getContainerWarningCount,
  getDescendantIds,
  getEffectiveLoadGp,
  getInventoryItemTotalGp,
  getInventoryItemTotalValueGp,
  getLoadBand,
  getStrengthCarryingCapacityGp,
  getTotalEncumbranceGp,
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
  'containers' | 'armor' | 'weapons' | 'gear' | 'provisions' | 'treasure'
>;

interface CustomItemDraft {
  name: string;
  category: CustomCategory;
  encumbranceGp: number;
  valueGp: number;
  capacityGp: number;
}

interface InventoryEditDraft {
  itemId: string;
  nameOverride: string;
  quantity: number;
  containerId: string;
  notes: string;
  encumbranceGp: number;
}

const categoryLabels: Record<EquipmentCategory, string> = {
  containers: 'Containers',
  armor: 'Armor',
  weapons: 'Weapons',
  ammunition: 'Ammunition',
  gear: 'Adventuring Gear',
  provisions: 'Provisions',
  treasure: 'Treasure',
  coins: 'Coins',
};

const customCategoryOptions: CustomCategory[] = [
  'gear',
  'containers',
  'weapons',
  'armor',
  'provisions',
  'treasure',
];

const defaultCustomItemDraft = (): CustomItemDraft => ({
  name: '',
  category: 'gear',
  encumbranceGp: 1,
  valueGp: 0,
  capacityGp: 100,
});

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

const getInventoryItemDisplayName = (
  item: EncumbranceInventoryItem,
  itemInfo: EncumbranceCatalogItem
): string => item.nameOverride?.trim() || itemInfo.name;

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
  const [customItemDraft, setCustomItemDraft] = useState<CustomItemDraft>(
    defaultCustomItemDraft()
  );
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItemDraft, setEditingItemDraft] =
    useState<InventoryEditDraft | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleDocument =
    mode === 'player' ? redactEncumbranceDocument(document) : document;

  const catalogItems = useMemo(
    () => [...encumbranceCatalog, ...visibleDocument.customItems],
    [visibleDocument.customItems]
  );

  const catalogById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems]
  );

  const customCatalogIds = useMemo(
    () => new Set(visibleDocument.customItems.map((item) => item.id)),
    [visibleDocument.customItems]
  );

  const catalogGroups = useMemo(
    () =>
      catalogItems.reduce<Record<EquipmentCategory, EncumbranceCatalogItem[]>>(
        (groups, item) => {
          groups[item.category].push(item);
          return groups;
        },
        {
          containers: [],
          armor: [],
          weapons: [],
          ammunition: [],
          gear: [],
          provisions: [],
          treasure: [],
          coins: [],
        }
      ),
    [catalogItems]
  );

  const containerItems = useMemo(
    () =>
      visibleDocument.inventory.filter((item) => {
        const itemInfo = catalogById.get(item.catalogId);
        return Boolean(itemInfo?.isContainer);
      }),
    [catalogById, visibleDocument.inventory]
  );

  const selectedCatalogItem = catalogById.get(selectedCatalogId);
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
  const totalEncumbranceGp = getTotalEncumbranceGp(
    visibleDocument,
    catalogById
  );
  const totalValueGp = getTotalValueGp(visibleDocument, catalogById);
  const carryingCapacityGp = getStrengthCarryingCapacityGp(
    visibleDocument.character.strength
  );
  const effectiveLoadGp = getEffectiveLoadGp(
    totalEncumbranceGp,
    visibleDocument.character.strength
  );
  const loadBand = getLoadBand(effectiveLoadGp);
  const containerWarningCount = getContainerWarningCount(
    visibleDocument.inventory,
    catalogById
  );
  const pendingRemovalItem = pendingRemovalId
    ? visibleDocument.inventory.find((item) => item.id === pendingRemovalId)
    : undefined;
  const pendingRemovalItemInfo = pendingRemovalItem
    ? catalogById.get(pendingRemovalItem.catalogId)
    : undefined;
  const pendingRemovalDescendantCount = pendingRemovalItem
    ? getDescendantIds(visibleDocument.inventory, pendingRemovalItem.id).length
    : 0;
  const editingItem = editingItemDraft
    ? visibleDocument.inventory.find(
        (item) => item.id === editingItemDraft.itemId
      )
    : undefined;
  const editingItemInfo = editingItem
    ? catalogById.get(editingItem.catalogId)
    : undefined;
  const editingItemDescendantIds =
    editingItem && editingItemInfo
      ? getDescendantIds(visibleDocument.inventory, editingItem.id)
      : [];
  const editingContainerSummary =
    editingItem && editingItemInfo?.isContainer
      ? getContainerLoadSummary(
          editingItem.id,
          visibleDocument.inventory,
          catalogById
        )
      : undefined;
  const editingItemTotalEncumbranceGp =
    editingItem && editingItemInfo
      ? getInventoryItemTotalGp(
          editingItem.id,
          visibleDocument.inventory,
          catalogById
        )
      : 0;
  const editingItemTotalValueGp =
    editingItem && editingItemInfo
      ? getInventoryItemTotalValueGp(
          editingItem.id,
          visibleDocument.inventory,
          catalogById
        )
      : 0;
  const editingParentOptions =
    editingItem && editingItemInfo
      ? containerItems.filter((containerItem) => {
          if (
            containerItem.id === editingItem.id ||
            editingItemDescendantIds.includes(containerItem.id)
          ) {
            return false;
          }

          const containerInfo = catalogById.get(containerItem.catalogId);
          return Boolean(
            containerInfo &&
              canStoreItemInContainer(editingItemInfo, containerInfo)
          );
        })
      : [];

  useEffect(() => {
    if (!pendingRemovalId && !editingItemDraft && !showAddModal) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (pendingRemovalId) {
          setPendingRemovalId(null);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingItemDraft, pendingRemovalId, showAddModal]);

  useEffect(() => {
    if (editingItemDraft && !editingItem) {
      setEditingItemDraft(null);
    }
  }, [editingItem, editingItemDraft]);

  const setCharacterName = (name: string) => {
    setDocument((currentDocument) => ({
      ...currentDocument,
      character: {
        ...currentDocument.character,
        name,
      },
    }));
  };

  const setStrengthScore = (score: number) => {
    setDocument((currentDocument) => ({
      ...currentDocument,
      character: {
        ...currentDocument.character,
        strength: {
          score,
          exceptional:
            score === 18
              ? currentDocument.character.strength.exceptional
              : 'none',
        },
      },
    }));
  };

  const setExceptionalStrength = (exceptional: ExceptionalStrengthTier) => {
    setDocument((currentDocument) => ({
      ...currentDocument,
      character: {
        ...currentDocument.character,
        strength: {
          ...currentDocument.character.strength,
          exceptional:
            currentDocument.character.strength.score === 18
              ? exceptional
              : 'none',
        },
      },
    }));
  };

  const updateInventoryItem = (
    itemId: string,
    updater: (item: EncumbranceInventoryItem) => EncumbranceInventoryItem
  ) => {
    setDocument((currentDocument) => ({
      ...currentDocument,
      inventory: currentDocument.inventory.map((item) =>
        item.id === itemId ? updater(item) : item
      ),
    }));
  };

  const openEditItem = (itemId: string) => {
    const item = visibleDocument.inventory.find(
      (candidate) => candidate.id === itemId
    );
    if (!item) {
      return;
    }

    const itemInfo = catalogById.get(item.catalogId);
    if (!itemInfo) {
      return;
    }

    setEditingItemDraft({
      itemId: item.id,
      nameOverride: item.nameOverride || '',
      quantity: item.quantity,
      containerId: item.containerId || '',
      notes: item.notes,
      encumbranceGp: getInventoryItemOwnEncumbranceGp(item, itemInfo),
    });
  };

  const closeEditModal = () => {
    setEditingItemDraft(null);
  };

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const saveEditingItem = () => {
    if (!editingItemDraft || !editingItem || !editingItemInfo) {
      setEditingItemDraft(null);
      return;
    }

    const normalizedNameOverride = editingItemDraft.nameOverride.trim();
    const normalizedLoad = Math.max(
      0,
      Math.floor(Number(editingItemDraft.encumbranceGp) || 0)
    );

    updateInventoryItem(editingItem.id, (currentItem) => ({
      ...currentItem,
      quantity: editingItemInfo.isContainer
        ? 1
        : Math.max(1, Math.floor(Number(editingItemDraft.quantity) || 1)),
      containerId: editingItemDraft.containerId || null,
      notes: editingItemDraft.notes,
      nameOverride:
        normalizedNameOverride &&
        normalizedNameOverride !== editingItemInfo.name
          ? normalizedNameOverride
          : undefined,
      encumbranceGpOverride:
        normalizedLoad !== editingItemInfo.encumbranceGp
          ? normalizedLoad
          : undefined,
    }));

    setEditingItemDraft(null);
    setStatusMessage(
      `Updated ${getInventoryItemDisplayName(editingItem, editingItemInfo)}.`
    );
    setErrorMessage('');
  };

  const removeInventoryItem = (itemId: string) => {
    setDocument((currentDocument) => {
      const descendantIds = getDescendantIds(currentDocument.inventory, itemId);
      const blockedIds = new Set([itemId, ...descendantIds]);
      const inventory = currentDocument.inventory.filter(
        (item) => !blockedIds.has(item.id)
      );
      const referencedCatalogIds = new Set(
        inventory.map((item) => item.catalogId)
      );

      return {
        ...currentDocument,
        inventory,
        customItems: currentDocument.customItems.filter((item) =>
          referencedCatalogIds.has(item.id)
        ),
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

  const requestRemoveInventoryItem = (itemId: string) => {
    setPendingRemovalId(itemId);
  };

  const closeRemoveModal = () => {
    setPendingRemovalId(null);
  };

  const confirmRemoveInventoryItem = () => {
    if (!pendingRemovalItem || !pendingRemovalItemInfo) {
      setPendingRemovalId(null);
      return;
    }

    const removedItemName = getInventoryItemDisplayName(
      pendingRemovalItem,
      pendingRemovalItemInfo
    );
    removeInventoryItem(pendingRemovalItem.id);
    setEditingItemDraft(null);
    setPendingRemovalId(null);
    setStatusMessage(
      pendingRemovalDescendantCount > 0
        ? `Removed ${removedItemName} and ${pendingRemovalDescendantCount} contained item${
            pendingRemovalDescendantCount === 1 ? '' : 's'
          }.`
        : `Removed ${removedItemName}.`
    );
    setErrorMessage('');
  };

  const addInventoryEntry = (
    currentDocument: EncumbranceDocument,
    itemInfo: EncumbranceCatalogItem,
    quantity: number,
    customItemToPersist?: EncumbranceCustomItem
  ): EncumbranceDocument => {
    const effectiveCatalogById = new Map<string, EncumbranceCatalogItem>([
      ...Array.from(encumbranceCatalogById.entries()),
      ...currentDocument.customItems.map(
        (item): [string, EncumbranceCatalogItem] => [item.id, item]
      ),
      ...(customItemToPersist
        ? ([[customItemToPersist.id, customItemToPersist]] as [
            string,
            EncumbranceCatalogItem
          ][])
        : []),
    ]);
    const targetContainer = selectedContainerId
      ? currentDocument.inventory.find(
          (item) => item.id === selectedContainerId
        )
      : undefined;
    const targetContainerInfo = targetContainer
      ? effectiveCatalogById.get(targetContainer.catalogId)
      : undefined;
    const nextContainerId =
      targetContainerInfo &&
      canStoreItemInContainer(itemInfo, targetContainerInfo)
        ? selectedContainerId
        : '';

    return {
      ...currentDocument,
      customItems: customItemToPersist
        ? [...currentDocument.customItems, customItemToPersist]
        : currentDocument.customItems,
      inventory: [
        ...currentDocument.inventory,
        {
          id: createInventoryItemId(),
          catalogId: itemInfo.id,
          quantity: itemInfo.isContainer ? 1 : quantity,
          containerId: nextContainerId || null,
          notes: '',
        },
      ],
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
      setStatusMessage(`Added ${selectedCatalogItem.name}.`);
      setErrorMessage('');
      setSelectedQuantity(1);
      setShowAddModal(false);
      return;
    }

    if (!customItemDraft.name.trim()) {
      setErrorMessage('Custom items need a name.');
      setStatusMessage('');
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
    setStatusMessage(`Added custom item ${customItem.name}.`);
    setErrorMessage('');
    setSelectedQuantity(1);
    setCustomItemDraft(defaultCustomItemDraft());
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
      setDocument(parsed);
      setShowAddModal(false);
      setEditingItemDraft(null);
      setPendingRemovalId(null);
      setSelectedContainerId('');
      setSelectedQuantity(1);
      setStatusMessage(`Loaded ${file.name}.`);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load the file.'
      );
      setStatusMessage('');
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

    anchor.href = url;
    anchor.download = `${slugify(
      nextDocument.character.name || 'character'
    )}-encumbrance-${kindLabel}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportCurrentDocument = () => {
    downloadDocument(
      mode === 'dm' ? document : redactEncumbranceDocument(document)
    );
    setStatusMessage(
      mode === 'dm' ? 'Exported DM document.' : 'Exported player document.'
    );
    setErrorMessage('');
  };

  const exportPlayerCopy = () => {
    downloadDocument(redactEncumbranceDocument(document));
    setStatusMessage('Exported player copy.');
    setErrorMessage('');
  };

  const resetDocument = () => {
    setDocument(createEmptyEncumbranceDocument(getDocumentKindForMode(mode)));
    setShowAddModal(false);
    setEditingItemDraft(null);
    setPendingRemovalId(null);
    setCustomItemDraft(defaultCustomItemDraft());
    setSelectedContainerId('');
    setSelectedQuantity(1);
    setStatusMessage('Started a new document.');
    setErrorMessage('');
  };

  const renderInventoryRows = (
    containerId: string | null,
    depth = 0
  ): JSX.Element[] =>
    visibleDocument.inventory
      .filter((item) => item.containerId === containerId)
      .map((item) => {
        const itemInfo = catalogById.get(item.catalogId);
        if (!itemInfo) {
          return <div key={item.id} />;
        }

        const containerSummary = itemInfo.isContainer
          ? getContainerLoadSummary(
              item.id,
              visibleDocument.inventory,
              catalogById
            )
          : undefined;
        const containerUsage = formatContainerUsage(containerSummary);
        const itemOwnEncumbranceGp = getInventoryItemOwnEncumbranceGp(
          item,
          itemInfo
        );
        const itemOwnLoadGp = itemOwnEncumbranceGp * item.quantity;
        const itemOwnValueGp = getInventoryItemOwnValueGp(item, itemInfo);
        const displayName = getInventoryItemDisplayName(item, itemInfo);
        const notePreview = item.notes.trim();
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
          <div key={item.id} className={styles['inventoryRowShell']}>
            <button
              type="button"
              className={`${styles['inventoryRowButton']} ${
                containerSummary?.isOverCapacity
                  ? styles['inventoryRowWarning']
                  : ''
              }`}
              onClick={() => openEditItem(item.id)}
              aria-label={`Edit ${displayName}`}
              aria-haspopup="dialog"
            >
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
                  {formatGpValue(itemOwnValueGp)} gp
                </span>
              </div>
              <div
                className={`${styles['inventoryCellSummary']} ${styles['inventoryNotesCell']}`}
              >
                <span className={styles['inventoryLabel']}>Notes</span>
                <span className={styles['inventoryNotesPreview']}>
                  {notePreview}
                </span>
              </div>
            </button>
            {renderInventoryRows(item.id, depth + 1)}
          </div>
        );
      });

  const rootItemRows = renderInventoryRows(null);
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
  const editingSavedOwnLoadGp =
    editingItem && editingItemInfo
      ? getInventoryItemOwnEncumbranceGp(editingItem, editingItemInfo) *
        editingItem.quantity
      : 0;
  const editingSavedOwnValueGp =
    editingItem && editingItemInfo
      ? getInventoryItemOwnValueGp(editingItem, editingItemInfo)
      : 0;
  const editingContainedLoadGp = Math.max(
    0,
    editingItemTotalEncumbranceGp - editingSavedOwnLoadGp
  );
  const editingContainedValueGp = Math.max(
    0,
    editingItemTotalValueGp - editingSavedOwnValueGp
  );
  const modalRoot =
    typeof window !== 'undefined'
      ? window.document.getElementById('app-modal')
      : null;

  return (
    <div className={styles['outerContainer']}>
      <div className={styles['title']}>AD&amp;D Encumbrance &amp; Gear</div>
      <div className={styles['contentContainer']}>
        <div className={styles['toolbar']}>
          <div className={styles['toolbarGroup']}>
            <span className={styles['modeBadge']}>
              {mode === 'dm' ? 'Dungeon Master View' : 'Player View'}
            </span>
            {mode === 'player' && document.kind === 'adnd-encumbrance-dm' && (
              <span className={styles['toolbarHint']}>
                Master document loaded in player view; export a player copy
                before sharing.
              </span>
            )}
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

        {(statusMessage || errorMessage) && (
          <div
            className={`${styles['message']} ${
              errorMessage ? styles['messageError'] : styles['messageInfo']
            }`}
          >
            {errorMessage || statusMessage}
          </div>
        )}

        <div className={styles['gridLayout']}>
          <section className={styles['card']}>
            <div className={styles['cardTitle']}>Character</div>
            <div className={styles['formGridCompact']}>
              <label className={styles['fieldGroupWide']}>
                <span className={styles['fieldLabel']}>Name</span>
                <input
                  className={styles['fieldControl']}
                  type="text"
                  value={visibleDocument.character.name}
                  onChange={(event) => setCharacterName(event.target.value)}
                  placeholder="Unnamed adventurer"
                />
              </label>
              <label className={styles['fieldGroup']}>
                <span className={styles['fieldLabel']}>Strength</span>
                <select
                  className={styles['fieldControl']}
                  value={visibleDocument.character.strength.score}
                  onChange={(event) =>
                    setStrengthScore(Number(event.target.value) || 8)
                  }
                >
                  {Array.from({ length: 16 }, (_, index) => index + 3).map(
                    (score) => (
                      <option key={score} value={score}>
                        {score}
                      </option>
                    )
                  )}
                </select>
              </label>
              <label className={styles['fieldGroup']}>
                <span className={styles['fieldLabel']}>Exceptional</span>
                <select
                  className={styles['fieldControl']}
                  value={visibleDocument.character.strength.exceptional}
                  disabled={visibleDocument.character.strength.score !== 18}
                  onChange={(event) =>
                    setExceptionalStrength(
                      event.target.value as ExceptionalStrengthTier
                    )
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
            </div>
            {mode === 'dm' && (
              <label className={styles['fieldGroup']}>
                <span className={styles['fieldLabel']}>DM Notes</span>
                <textarea
                  className={`${styles['fieldControl']} ${styles['textareaControlCompact']}`}
                  value={document.dm?.privateNotes || ''}
                  onChange={(event) =>
                    setDocument((currentDocument) => ({
                      ...currentDocument,
                      dm: {
                        privateNotes: event.target.value,
                      },
                    }))
                  }
                  placeholder="Private note stripped from player exports."
                />
              </label>
            )}
          </section>

          <section className={styles['card']}>
            <div className={styles['cardTitle']}>Encumbrance</div>
            <div className={styles['summaryGrid']}>
              <div className={styles['summaryValue']}>
                <span className={styles['summaryLabel']}>Total</span>
                <strong>{totalEncumbranceGp} gp</strong>
              </div>
              <div className={styles['summaryValue']}>
                <span className={styles['summaryLabel']}>Capacity</span>
                <strong>{carryingCapacityGp} gp</strong>
              </div>
              <div className={styles['summaryValue']}>
                <span className={styles['summaryLabel']}>Value</span>
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
              >
                Add Item
              </button>
            </div>
          </div>
          <div className={styles['inventoryHeader']}>
            <span>Item</span>
            <span>Qty</span>
            <span>Load</span>
            <span>Value</span>
            <span>Notes</span>
          </div>
          <div className={styles['inventoryList']}>
            {rootItemRows.length > 0 ? (
              rootItemRows
            ) : (
              <div className={styles['placeholder']}>
                Use Add Item to start building the loadout.
              </div>
            )}
          </div>
        </section>
      </div>
      <div id={'app-modal'} />
      {modalRoot &&
        createPortal(
          <>
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
                  <div className={styles['modalBody']}>
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

                    {addMode === 'catalog' ? (
                      <div className={styles['modalAddGrid']}>
                        <label className={styles['modalFieldWide']}>
                          <span className={styles['fieldLabel']}>Item</span>
                          <select
                            className={styles['fieldControl']}
                            value={selectedCatalogId}
                            onChange={(event) => {
                              const nextCatalogId = event.target.value;
                              setSelectedCatalogId(nextCatalogId);
                              const nextItem = catalogById.get(nextCatalogId);
                              if (nextItem?.isContainer) {
                                setSelectedQuantity(1);
                              }
                            }}
                          >
                            {(
                              Object.keys(categoryLabels) as EquipmentCategory[]
                            ).map((category) => (
                              <optgroup
                                key={category}
                                label={categoryLabels[category]}
                              >
                                {catalogGroups[category].map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </label>
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Quantity</span>
                          <input
                            className={styles['fieldControl']}
                            type="number"
                            min={1}
                            step={1}
                            value={addPreviewQuantity}
                            disabled={selectedCatalogItem?.isContainer}
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
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Store in</span>
                          <select
                            className={styles['fieldControl']}
                            value={selectedContainerId}
                            onChange={(event) =>
                              setSelectedContainerId(event.target.value)
                            }
                          >
                            <option value="">On person</option>
                            {containerItems.map((containerItem) => {
                              const containerInfo = catalogById.get(
                                containerItem.catalogId
                              );
                              const isAllowed =
                                addPreviewItem && containerInfo
                                  ? canStoreItemInContainer(
                                      addPreviewItem,
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
                        <div className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Load</span>
                          <div className={styles['fieldReadonly']}>
                            {selectedCatalogItem?.encumbranceGp || 0} gp
                          </div>
                        </div>
                        <div className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Value</span>
                          <div className={styles['fieldReadonly']}>
                            {formatGpValue(selectedCatalogItem?.valueGp || 0)}{' '}
                            gp
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={styles['modalAddGrid']}>
                        <label className={styles['modalFieldWide']}>
                          <span className={styles['fieldLabel']}>Name</span>
                          <input
                            className={styles['fieldControl']}
                            type="text"
                            value={customItemDraft.name}
                            onChange={(event) =>
                              updateCustomItemDraft('name', event.target.value)
                            }
                            placeholder="Custom item"
                          />
                        </label>
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Category</span>
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
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Quantity</span>
                          <input
                            className={styles['fieldControl']}
                            type="number"
                            min={1}
                            step={1}
                            value={addPreviewQuantity}
                            disabled={customItemDraft.category === 'containers'}
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
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Store in</span>
                          <select
                            className={styles['fieldControl']}
                            value={selectedContainerId}
                            onChange={(event) =>
                              setSelectedContainerId(event.target.value)
                            }
                          >
                            <option value="">On person</option>
                            {containerItems.map((containerItem) => {
                              const containerInfo = catalogById.get(
                                containerItem.catalogId
                              );
                              const isAllowed = containerInfo
                                ? canStoreItemInContainer(
                                    customPreviewItem,
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
                          <span className={styles['fieldLabel']}>Load</span>
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
                        </label>
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>Value</span>
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
                        {customItemDraft.category === 'containers' && (
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
                                    Math.floor(Number(event.target.value) || 1)
                                  )
                                )
                              }
                            />
                          </label>
                        )}
                        <div className={styles['modalFieldWide']}>
                          <span className={styles['fieldLabel']}>Preview</span>
                          <div className={styles['fieldReadonly']}>
                            {customPreviewItem.encumbranceGp} gp /{' '}
                            {formatGpValue(customPreviewItem.valueGp)} gp
                            {customPreviewItem.isContainer &&
                              ` / ${customPreviewItem.capacityGp} gp cap.`}
                          </div>
                        </div>
                      </div>
                    )}
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
                  aria-labelledby="encumbrance-edit-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    id="encumbrance-edit-title"
                    className={styles['modalTitle']}
                  >
                    Edit {editingItemDisplayName}
                  </div>
                  <div className={styles['modalBody']}>
                    <div className={styles['modalFields']}>
                      <label className={styles['modalFieldWide']}>
                        <span className={styles['fieldLabel']}>Name</span>
                        <input
                          className={styles['fieldControl']}
                          type="text"
                          value={editingItemDraft.nameOverride}
                          onChange={(event) =>
                            setEditingItemDraft((currentDraft) =>
                              currentDraft
                                ? {
                                    ...currentDraft,
                                    nameOverride: event.target.value,
                                  }
                                : currentDraft
                            )
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
                            setEditingItemDraft((currentDraft) =>
                              currentDraft
                                ? {
                                    ...currentDraft,
                                    quantity: Math.max(
                                      1,
                                      Math.floor(
                                        Number(event.target.value) || 1
                                      )
                                    ),
                                  }
                                : currentDraft
                            )
                          }
                        />
                      </label>
                      <label className={styles['fieldGroup']}>
                        <span className={styles['fieldLabel']}>Stored in</span>
                        <select
                          className={styles['fieldControl']}
                          value={editingItemDraft.containerId}
                          onChange={(event) =>
                            setEditingItemDraft((currentDraft) =>
                              currentDraft
                                ? {
                                    ...currentDraft,
                                    containerId: event.target.value,
                                  }
                                : currentDraft
                            )
                          }
                        >
                          <option value="">On person</option>
                          {editingParentOptions.map((containerItem) => {
                            const containerInfo = catalogById.get(
                              containerItem.catalogId
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
                      <label className={styles['fieldGroup']}>
                        <span className={styles['fieldLabel']}>
                          Load per item
                        </span>
                        <input
                          className={styles['fieldControl']}
                          type="number"
                          min={0}
                          step={1}
                          value={editingDraftLoadPerItemGp}
                          onChange={(event) =>
                            setEditingItemDraft((currentDraft) =>
                              currentDraft
                                ? {
                                    ...currentDraft,
                                    encumbranceGp: Math.max(
                                      0,
                                      Math.floor(
                                        Number(event.target.value) || 0
                                      )
                                    ),
                                  }
                                : currentDraft
                            )
                          }
                        />
                      </label>
                      <label className={styles['modalFieldWide']}>
                        <span className={styles['fieldLabel']}>Notes</span>
                        <textarea
                          className={`${styles['fieldControl']} ${styles['modalNotes']}`}
                          rows={3}
                          value={editingItemDraft.notes}
                          ref={(element) => resizeTextarea(element)}
                          onChange={(event) =>
                            setEditingItemDraft((currentDraft) =>
                              currentDraft
                                ? {
                                    ...currentDraft,
                                    notes: event.target.value,
                                  }
                                : currentDraft
                            )
                          }
                          onInput={(event) =>
                            resizeTextarea(event.currentTarget)
                          }
                          placeholder="Short note"
                        />
                      </label>
                    </div>

                    <div className={styles['modalMetaGrid']}>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>Type</span>
                        <span className={styles['modalMetaValue']}>
                          {categoryLabels[editingItemInfo.category]}
                          {customCatalogIds.has(editingItem.catalogId)
                            ? ' / Custom'
                            : ''}
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Value per item
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {formatGpValue(editingItemInfo.valueGp)} gp
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Row load
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {editingDraftOwnLoadGp} gp
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Row value
                        </span>
                        <span className={styles['modalMetaValue']}>
                          {formatGpValue(editingDraftOwnValueGp)} gp
                        </span>
                      </div>
                      <div className={styles['modalMetaItem']}>
                        <span className={styles['modalMetaLabel']}>
                          Catalog load
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
                              Contained load
                            </span>
                            <span className={styles['modalMetaValue']}>
                              {editingContainedLoadGp} gp
                            </span>
                          </div>
                          <div className={styles['modalMetaItem']}>
                            <span className={styles['modalMetaLabel']}>
                              Contained value
                            </span>
                            <span className={styles['modalMetaValue']}>
                              {formatGpValue(editingContainedValueGp)} gp
                            </span>
                          </div>
                          <div className={styles['modalMetaItem']}>
                            <span className={styles['modalMetaLabel']}>
                              Container state
                            </span>
                            <span className={styles['modalMetaValue']}>
                              {editingContainerSummary.mismatchedItemIds
                                .length > 0
                                ? 'Check contents'
                                : editingContainerSummary.isOverCapacity
                                ? 'Overfull'
                                : editingContainerSummary.capacity > 0 &&
                                  editingContainerSummary.used >=
                                    editingContainerSummary.capacity
                                ? 'Full'
                                : 'Available'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles['modalDangerRow']}>
                      <div className={styles['modalDangerText']}>
                        Remove this item from the sheet.
                      </div>
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
                  <div className={styles['modalActions']}>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonCompact']}`}
                      onClick={closeEditModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonCompact']} ${styles['buttonPrimary']}`}
                      onClick={saveEditingItem}
                    >
                      Save Changes
                    </button>
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
