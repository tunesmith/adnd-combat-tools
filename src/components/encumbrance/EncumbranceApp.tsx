import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import styles from './encumbrance.module.css';
import type {
  EncumbranceCatalogItem,
  EncumbranceDocument,
  EncumbranceInventoryItem,
  EncumbranceMode,
  EquipmentCategory,
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
  getLoadBand,
  getStrengthWeightAllowanceGp,
  getTotalEncumbranceGp,
} from '../../helpers/encumbranceRules';
import {
  encumbranceCatalog,
  encumbranceCatalogById,
} from '../../tables/encumbranceCatalog';

interface EncumbranceAppProps {
  mode: EncumbranceMode;
}

const categoryLabels: Record<EquipmentCategory, string> = {
  containers: 'Containers',
  armor: 'Armor',
  weapons: 'Weapons',
  ammunition: 'Ammunition',
  gear: 'Adventuring Gear',
  provisions: 'Provisions',
  coins: 'Coins',
};

const createInventoryItemId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `enc-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

const EncumbranceApp = ({ mode }: EncumbranceAppProps) => {
  const [document, setDocument] = useState<EncumbranceDocument>(
    createEmptyEncumbranceDocument(getDocumentKindForMode(mode))
  );
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(
    encumbranceCatalog[0]?.id || ''
  );
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleDocument =
    mode === 'player' ? redactEncumbranceDocument(document) : document;

  const catalogGroups = useMemo(
    () =>
      encumbranceCatalog.reduce<Record<EquipmentCategory, EncumbranceCatalogItem[]>>(
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
          coins: [],
        }
      ),
    []
  );

  const containerItems = useMemo(
    () =>
      visibleDocument.inventory.filter((item) => {
        const itemInfo = encumbranceCatalogById.get(item.catalogId);
        return Boolean(itemInfo?.isContainer);
      }),
    [visibleDocument.inventory]
  );

  const selectedCatalogItem = encumbranceCatalogById.get(selectedCatalogId);
  const totalEncumbranceGp = getTotalEncumbranceGp(
    visibleDocument,
    encumbranceCatalogById
  );
  const weightAllowanceGp = getStrengthWeightAllowanceGp(
    visibleDocument.character.strength
  );
  const effectiveLoadGp = getEffectiveLoadGp(
    totalEncumbranceGp,
    visibleDocument.character.strength
  );
  const loadBand = getLoadBand(effectiveLoadGp);
  const containerWarningCount = getContainerWarningCount(
    visibleDocument.inventory,
    encumbranceCatalogById
  );

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

  const setExceptionalStrength = (exceptional: string) => {
    setDocument((currentDocument) => ({
      ...currentDocument,
      character: {
        ...currentDocument.character,
        strength: {
          ...currentDocument.character.strength,
          exceptional: currentDocument.character.strength.score === 18
            ? (exceptional as EncumbranceDocument['character']['strength']['exceptional'])
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
    const descendantIds = getDescendantIds(document.inventory, itemId);
    const blockedIds = new Set([itemId, ...descendantIds]);
    setDocument((currentDocument) => ({
      ...currentDocument,
      inventory: currentDocument.inventory.filter(
        (item) => !blockedIds.has(item.id)
      ),
    }));
  };

  const handleAddItem = () => {
    if (!selectedCatalogItem) {
      return;
    }

    const targetContainer = selectedContainerId
      ? containerItems.find((item) => item.id === selectedContainerId)
      : undefined;
    const targetContainerInfo = targetContainer
      ? encumbranceCatalogById.get(targetContainer.catalogId)
      : undefined;
    const nextContainerId =
      targetContainerInfo &&
      canStoreItemInContainer(selectedCatalogItem, targetContainerInfo)
        ? selectedContainerId
        : '';

    setDocument((currentDocument) => ({
      ...currentDocument,
      inventory: [
        ...currentDocument.inventory,
        {
          id: createInventoryItemId(),
          catalogId: selectedCatalogItem.id,
          quantity: selectedCatalogItem.isContainer
            ? 1
            : Math.max(1, Math.floor(selectedQuantity)),
          containerId: nextContainerId || null,
        },
      ],
    }));

    setStatusMessage(`Added ${selectedCatalogItem.name}.`);
    setErrorMessage('');
    setSelectedQuantity(1);
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
        const itemInfo = encumbranceCatalogById.get(item.catalogId);
        if (!itemInfo) {
          return <div key={item.id} />;
        }

        const descendantIds = getDescendantIds(visibleDocument.inventory, item.id);
        const containerSummary = itemInfo.isContainer
          ? getContainerLoadSummary(
              item.id,
              visibleDocument.inventory,
              encumbranceCatalogById
            )
          : undefined;
        const containerUsage = formatContainerUsage(containerSummary);
        const itemTotalEncumbranceGp = getInventoryItemTotalGp(
          item.id,
          visibleDocument.inventory,
          encumbranceCatalogById
        );
        const parentOptions = containerItems.filter((containerItem) => {
          if (containerItem.id === item.id || descendantIds.includes(containerItem.id)) {
            return false;
          }

          const containerInfo = encumbranceCatalogById.get(containerItem.catalogId);
          return Boolean(containerInfo && canStoreItemInContainer(itemInfo, containerInfo));
        });

        return (
          <div key={item.id}>
            <div
              className={`${styles['inventoryRow']} ${
                containerSummary?.isOverCapacity ? styles['inventoryRowWarning'] : ''
              }`}
              style={{ paddingLeft: `${depth * 1.4}rem` }}
            >
              <div className={styles['inventoryCellPrimary']}>
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
                </div>
                <div className={styles['inventoryMeta']}>
                  Own encumbrance: {itemInfo.encumbranceGp}
                  {itemInfo.isContainer && containerUsage
                    ? ` | Load: ${containerUsage}`
                    : ` | Total carried: ${itemTotalEncumbranceGp} gp`}
                </div>
              </div>
              <label className={styles['inventoryCell']}>
                <span className={styles['inventoryLabel']}>Qty</span>
                <input
                  className={styles['fieldControl']}
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
                  className={styles['fieldControl']}
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
                    const containerInfo = encumbranceCatalogById.get(
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
                <span className={styles['inventoryLabel']}>Total gp</span>
                <strong>{itemTotalEncumbranceGp}</strong>
              </div>
              <div className={styles['inventoryCellAction']}>
                <button
                  type="button"
                  className={`${styles['button']} ${styles['buttonQuiet']}`}
                  onClick={() => removeInventoryItem(item.id)}
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
            {mode === 'player' &&
              document.kind === 'adnd-encumbrance-dm' && (
                <span className={styles['toolbarHint']}>
                  Master document loaded in player view; export a player copy
                  before sharing.
                </span>
              )}
          </div>
          <div className={styles['toolbarGroup']}>
            <button
              type="button"
              className={`${styles['button']} ${styles['buttonPrimary']}`}
              onClick={resetDocument}
            >
              New File
            </button>
            <button
              type="button"
              className={styles['button']}
              onClick={triggerImport}
            >
              Load File
            </button>
            <button
              type="button"
              className={styles['button']}
              onClick={exportCurrentDocument}
            >
              Export {mode === 'dm' ? 'DM File' : 'Player File'}
            </button>
            {mode === 'dm' && (
              <button
                type="button"
                className={styles['button']}
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
            <div className={styles['formGrid']}>
              <label className={styles['fieldGroup']}>
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
                  onChange={(event) => setExceptionalStrength(event.target.value)}
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
                  className={`${styles['fieldControl']} ${styles['textareaControl']}`}
                  value={document.dm?.privateNotes || ''}
                  onChange={(event) =>
                    setDocument((currentDocument) => ({
                      ...currentDocument,
                      dm: {
                        privateNotes: event.target.value,
                      },
                    }))
                  }
                  placeholder="Private note that is stripped from player exports."
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
                <span className={styles['summaryLabel']}>Allowance</span>
                <strong>{weightAllowanceGp} gp</strong>
              </div>
              <div className={styles['summaryValue']}>
                <span className={styles['summaryLabel']}>Effective Load</span>
                <strong>{effectiveLoadGp} gp</strong>
              </div>
              <div className={styles['summaryValue']}>
                <span className={styles['summaryLabel']}>Band</span>
                <strong>{loadBand.label}</strong>
              </div>
              <div className={styles['summaryValue']}>
                <span className={styles['summaryLabel']}>Movement</span>
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
          <div className={styles['formGrid']}>
            <label className={styles['fieldGroup']}>
              <span className={styles['fieldLabel']}>Item</span>
              <select
                className={styles['fieldControl']}
                value={selectedCatalogId}
                onChange={(event) => {
                  const nextCatalogId = event.target.value;
                  setSelectedCatalogId(nextCatalogId);
                  const nextItem = encumbranceCatalogById.get(nextCatalogId);
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
                value={selectedCatalogItem?.isContainer ? 1 : selectedQuantity}
                disabled={selectedCatalogItem?.isContainer}
                onChange={(event) =>
                  setSelectedQuantity(
                    Math.max(1, Math.floor(Number(event.target.value) || 1))
                  )
                }
              />
            </label>
            <label className={styles['fieldGroup']}>
              <span className={styles['fieldLabel']}>Store In</span>
              <select
                className={styles['fieldControl']}
                value={selectedContainerId}
                onChange={(event) => setSelectedContainerId(event.target.value)}
              >
                <option value="">On person</option>
                {containerItems.map((containerItem) => {
                  const containerInfo = encumbranceCatalogById.get(
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
              <span className={styles['fieldLabel']}>Item Encumbrance</span>
              <div className={styles['fieldReadonly']}>
                {selectedCatalogItem?.encumbranceGp || 0} gp
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
        </section>

        <section className={styles['card']}>
          <div className={styles['cardTitle']}>Inventory</div>
          <div className={styles['inventoryHeader']}>
            <span>Item</span>
            <span>Qty</span>
            <span>Stored In</span>
            <span>Total gp</span>
            <span>Action</span>
          </div>
          <div className={styles['inventoryList']}>
            {rootItemRows.length > 0 ? (
              rootItemRows
            ) : (
              <div className={styles['placeholder']}>
                Add a character name, pick a possession, and start building the
                loadout.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EncumbranceApp;
