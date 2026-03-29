import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
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

const getTextareaMinHeight = (textarea: HTMLTextAreaElement): number => {
  const computedStyle = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 0;
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;

  return Math.ceil(
    lineHeight + paddingTop + paddingBottom + borderTop + borderBottom
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

  useEffect(() => {
    if (!pendingRemovalId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingRemovalId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingRemovalId]);

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

    const removedItemName = pendingRemovalItemInfo.name;
    removeInventoryItem(pendingRemovalItem.id);
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

        const descendantIds = getDescendantIds(
          visibleDocument.inventory,
          item.id
        );
        const containerSummary = itemInfo.isContainer
          ? getContainerLoadSummary(
              item.id,
              visibleDocument.inventory,
              catalogById
            )
          : undefined;
        const containerUsage = formatContainerUsage(containerSummary);
        const itemTotalEncumbranceGp = getInventoryItemTotalGp(
          item.id,
          visibleDocument.inventory,
          catalogById
        );
        const itemTotalValueGp = getInventoryItemTotalValueGp(
          item.id,
          visibleDocument.inventory,
          catalogById
        );
        const parentOptions = containerItems.filter((containerItem) => {
          if (
            containerItem.id === item.id ||
            descendantIds.includes(containerItem.id)
          ) {
            return false;
          }

          const containerInfo = catalogById.get(containerItem.catalogId);
          return Boolean(
            containerInfo && canStoreItemInContainer(itemInfo, containerInfo)
          );
        });

        return (
          <div key={item.id}>
            <div
              className={`${styles['inventoryRow']} ${
                containerSummary?.isOverCapacity
                  ? styles['inventoryRowWarning']
                  : ''
              }`}
            >
              <div
                className={styles['inventoryCellPrimary']}
                style={{ paddingLeft: `calc(0.3rem + ${depth * 0.9}rem)` }}
              >
                <span className={styles['inventoryLabel']}>Item</span>
                <div className={styles['inventoryNameRow']}>
                  <span>{itemInfo.name}</span>
                  {itemInfo.isContainer && (
                    <span className={styles['inventoryBadge']}>Container</span>
                  )}
                  {itemInfo.ammoKind && (
                    <span className={styles['inventoryBadge']}>
                      {itemInfo.ammoKind}
                    </span>
                  )}
                  {customCatalogIds.has(item.catalogId) && (
                    <span className={styles['inventoryBadge']}>Custom</span>
                  )}
                </div>
                <div className={styles['inventoryMeta']}>
                  Own {itemInfo.encumbranceGp} gp
                  {' | '}
                  Worth {formatGpValue(itemInfo.valueGp)} gp
                  {itemInfo.isContainer && containerUsage
                    ? ` | Load ${containerUsage}`
                    : ` | Total ${itemTotalEncumbranceGp} gp`}
                </div>
              </div>
              <label className={styles['inventoryCell']}>
                <span className={styles['inventoryLabel']}>Qty</span>
                <input
                  className={`${styles['fieldControl']} ${styles['fieldControlDense']}`}
                  type="number"
                  min={1}
                  step={1}
                  value={item.quantity}
                  disabled={itemInfo.isContainer}
                  onChange={(event) =>
                    updateInventoryItem(item.id, (currentItem) => ({
                      ...currentItem,
                      quantity: Math.max(
                        1,
                        Math.floor(Number(event.target.value) || 1)
                      ),
                    }))
                  }
                />
              </label>
              <label className={styles['inventoryCell']}>
                <span className={styles['inventoryLabel']}>Stored in</span>
                <select
                  className={`${styles['fieldControl']} ${styles['fieldControlDense']}`}
                  value={item.containerId || ''}
                  onChange={(event) =>
                    updateInventoryItem(item.id, (currentItem) => ({
                      ...currentItem,
                      containerId: event.target.value || null,
                    }))
                  }
                >
                  <option value="">On person</option>
                  {parentOptions.map((containerItem) => {
                    const containerInfo = catalogById.get(
                      containerItem.catalogId
                    );

                    return (
                      <option key={containerItem.id} value={containerItem.id}>
                        {containerInfo?.name || 'Container'}
                      </option>
                    );
                  })}
                </select>
              </label>
              <div className={styles['inventoryCell']}>
                <span className={styles['inventoryLabel']}>Load</span>
                <strong>{itemTotalEncumbranceGp} gp</strong>
              </div>
              <div className={styles['inventoryCell']}>
                <span className={styles['inventoryLabel']}>Value</span>
                <strong>{formatGpValue(itemTotalValueGp)} gp</strong>
              </div>
              <label className={styles['inventoryCell']}>
                <span className={styles['inventoryLabel']}>Notes</span>
                <textarea
                  className={`${styles['fieldControl']} ${styles['fieldControlDense']} ${styles['inventoryNotes']}`}
                  rows={1}
                  value={item.notes}
                  ref={(element) => resizeTextarea(element)}
                  onChange={(event) =>
                    updateInventoryItem(item.id, (currentItem) => ({
                      ...currentItem,
                      notes: event.target.value,
                    }))
                  }
                  onInput={(event) => resizeTextarea(event.currentTarget)}
                  placeholder="Short note"
                />
              </label>
              <div className={styles['inventoryCellAction']}>
                <button
                  type="button"
                  className={`${styles['button']} ${styles['buttonQuiet']} ${styles['buttonCompact']} ${styles['inventoryActionButton']}`}
                  onClick={() => requestRemoveInventoryItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
            {renderInventoryRows(item.id, depth + 1)}
          </div>
        );
      });

  const rootItemRows = renderInventoryRows(null);

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
          <div className={styles['cardTitle']}>Add Possession</div>
          <div className={styles['addModeRow']}>
            <button
              type="button"
              className={`${styles['button']} ${styles['buttonCompact']} ${
                addMode === 'catalog' ? styles['buttonSelected'] : ''
              }`}
              onClick={() => setAddMode('catalog')}
            >
              Catalog Item
            </button>
            <button
              type="button"
              className={`${styles['button']} ${styles['buttonCompact']} ${
                addMode === 'custom' ? styles['buttonSelected'] : ''
              }`}
              onClick={() => setAddMode('custom')}
            >
              Custom Item
            </button>
          </div>

          {addMode === 'catalog' ? (
            <div className={styles['addGrid']}>
              <label className={styles['fieldGroupWide']}>
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
                  {(Object.keys(categoryLabels) as EquipmentCategory[]).map(
                    (category) => (
                      <optgroup key={category} label={categoryLabels[category]}>
                        {catalogGroups[category].map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  )}
                </select>
              </label>
              <label className={styles['fieldGroup']}>
                <span className={styles['fieldLabel']}>Quantity</span>
                <input
                  className={styles['fieldControl']}
                  type="number"
                  min={1}
                  step={1}
                  value={
                    selectedCatalogItem?.isContainer ? 1 : selectedQuantity
                  }
                  disabled={selectedCatalogItem?.isContainer}
                  onChange={(event) =>
                    setSelectedQuantity(
                      Math.max(1, Math.floor(Number(event.target.value) || 1))
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
                      selectedCatalogItem && containerInfo
                        ? canStoreItemInContainer(
                            selectedCatalogItem,
                            containerInfo
                          )
                        : true;

                    return (
                      <option
                        key={containerItem.id}
                        value={containerItem.id}
                        disabled={!isAllowed}
                      >
                        {containerInfo?.name || 'Container'}
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
                  {formatGpValue(selectedCatalogItem?.valueGp || 0)} gp
                </div>
              </div>
              <div className={styles['fieldGroupAction']}>
                <button
                  type="button"
                  className={`${styles['button']} ${styles['buttonPrimary']}`}
                  onClick={handleAddItem}
                  disabled={!selectedCatalogItem}
                >
                  Add Item
                </button>
              </div>
            </div>
          ) : (
            <div className={styles['addGrid']}>
              <label className={styles['fieldGroupWide']}>
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
                  value={
                    customItemDraft.category === 'containers'
                      ? 1
                      : selectedQuantity
                  }
                  disabled={customItemDraft.category === 'containers'}
                  onChange={(event) =>
                    setSelectedQuantity(
                      Math.max(1, Math.floor(Number(event.target.value) || 1))
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
                        {containerInfo?.name || 'Container'}
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
                      Math.max(0, Math.floor(Number(event.target.value) || 0))
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
                  <span className={styles['fieldLabel']}>Capacity</span>
                  <input
                    className={styles['fieldControl']}
                    type="number"
                    min={1}
                    step={1}
                    value={customItemDraft.capacityGp}
                    onChange={(event) =>
                      updateCustomItemDraft(
                        'capacityGp',
                        Math.max(1, Math.floor(Number(event.target.value) || 1))
                      )
                    }
                  />
                </label>
              )}
              <div className={styles['fieldGroup']}>
                <span className={styles['fieldLabel']}>Preview</span>
                <div className={styles['fieldReadonly']}>
                  {customPreviewItem.encumbranceGp} gp /{' '}
                  {formatGpValue(customPreviewItem.valueGp)} gp
                  {customPreviewItem.isContainer &&
                    ` / ${customPreviewItem.capacityGp} gp cap.`}
                </div>
              </div>
              <div className={styles['fieldGroupAction']}>
                <button
                  type="button"
                  className={`${styles['button']} ${styles['buttonPrimary']}`}
                  onClick={handleAddItem}
                >
                  Add Custom Item
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={styles['card']}>
          <div className={styles['cardTitle']}>Inventory</div>
          <div className={styles['inventoryHeader']}>
            <span>Item</span>
            <span>Qty</span>
            <span>Stored in</span>
            <span>Load</span>
            <span>Value</span>
            <span>Notes</span>
            <span>Action</span>
          </div>
          <div className={styles['inventoryList']}>
            {rootItemRows.length > 0 ? (
              rootItemRows
            ) : (
              <div className={styles['placeholder']}>
                Add a character name, choose gear, and start building the
                loadout.
              </div>
            )}
          </div>
        </section>
      </div>
      {pendingRemovalItem && pendingRemovalItemInfo && (
        <>
          <div className={styles['modalShadow']} onClick={closeRemoveModal} />
          <div
            className={styles['modal']}
            role="dialog"
            aria-modal="true"
            aria-labelledby="encumbrance-remove-title"
            aria-describedby="encumbrance-remove-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div id="encumbrance-remove-title" className={styles['modalTitle']}>
              Remove Item
            </div>
            <div className={styles['modalBody']}>
              <p
                id="encumbrance-remove-description"
                className={styles['modalText']}
              >
                Remove{' '}
                <span className={styles['modalItemName']}>
                  {pendingRemovalItemInfo.name}
                </span>
                ? This cannot be undone from the sheet.
              </p>
              {pendingRemovalDescendantCount > 0 && (
                <p className={styles['modalText']}>
                  It also contains {pendingRemovalDescendantCount} nested item
                  {pendingRemovalDescendantCount === 1 ? '' : 's'}, and those
                  will be removed too.
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
    </div>
  );
};

export default EncumbranceApp;
