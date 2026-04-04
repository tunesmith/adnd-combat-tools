import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import type { GroupBase, SingleValue } from 'react-select';
import Select from 'react-select';
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
  applyPlayerMergePlan,
  buildPlayerMergePlan,
  createEmptyEncumbranceDmCharacter,
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
  redactEncumbranceDocument,
  stringifyEncumbranceDocument,
} from '../../helpers/encumbranceDocument';
import type {
  PlayerMergeChoiceSource,
  PlayerMergeFieldReview,
  PlayerMergeItemReview,
  PlayerMergePlan,
  PlayerMergeRemovalChoice,
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
import {
  createEncumbranceSelectStyles,
  type EncumbranceSelectOption,
  type EncumbranceSelectValue,
} from '../../helpers/encumbranceSelectStyles';

interface EncumbranceAppProps {
  mode: EncumbranceMode;
}

type EncumbranceSelectGroup = GroupBase<EncumbranceSelectOption>;
type EncumbranceSelectOptions = readonly (
  | EncumbranceSelectOption
  | EncumbranceSelectGroup
)[];

type AddMode = 'catalog' | 'custom';
type InventorySortKey = 'owner' | 'item' | 'day';
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
  valueGp: number;
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

interface PendingMergeReviewState {
  fileName: string;
  plan: PlayerMergePlan;
}

interface BrowserFilePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface BrowserWritableFileStream {
  write: (data: string | Blob) => Promise<void>;
  close: () => Promise<void>;
}

interface BrowserFileHandle {
  kind?: 'file' | 'directory';
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<BrowserWritableFileStream>;
  queryPermission?: (
    descriptor?: BrowserFilePermissionDescriptor
  ) => Promise<PermissionState>;
  requestPermission?: (
    descriptor?: BrowserFilePermissionDescriptor
  ) => Promise<PermissionState>;
}

interface BrowserFilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface BrowserOpenFilePickerOptions {
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  types?: BrowserFilePickerAcceptType[];
}

interface BrowserSaveFilePickerOptions {
  excludeAcceptAllOption?: boolean;
  suggestedName?: string;
  types?: BrowserFilePickerAcceptType[];
  id?: string;
}

interface BrowserFilePickerWindow extends Window {
  showOpenFilePicker?: (
    options?: BrowserOpenFilePickerOptions
  ) => Promise<BrowserFileHandle[]>;
  showSaveFilePicker?: (
    options?: BrowserSaveFilePickerOptions
  ) => Promise<BrowserFileHandle>;
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

const defaultAddItemDetailsDraft = (
  addMode: AddMode = 'catalog'
): AddItemDetailsDraft => ({
  day: 0,
  playerNotes: '',
  dmNotes: '',
  playerKnowsValue: addMode === 'custom' ? false : true,
  playerMagicKnowledge: addMode === 'catalog' ? 'known-mundane' : 'unknown',
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

const strengthScoreOptions: EncumbranceSelectOption[] = Array.from(
  { length: 16 },
  (_, index) => {
    const score = index + 3;

    return {
      value: score,
      label: `${score}`,
    };
  }
);

const exceptionalStrengthOptions: EncumbranceSelectOption[] = [
  { value: 'none', label: 'None' },
  { value: '01-50', label: '18/01-50' },
  { value: '51-75', label: '18/51-75' },
  { value: '76-90', label: '18/76-90' },
  { value: '91-99', label: '18/91-99' },
  { value: '00', label: '18/00' },
];

const customCategorySelectOptions: EncumbranceSelectOption[] =
  customCategoryOptions.map((category) => ({
    value: category,
    label: categoryLabels[category],
  }));

const magicKnowledgeOptions: EncumbranceSelectOption[] = (
  Object.keys(magicKnowledgeLabels) as MagicKnowledge[]
).map((knowledge) => ({
  value: knowledge,
  label: magicKnowledgeLabels[knowledge],
}));

const valueKnowledgeOptions: EncumbranceSelectOption[] = [
  { value: 'yes', label: 'Known' },
  { value: 'no', label: 'Unknown' },
];

const magicalTruthOptions: EncumbranceSelectOption[] = [
  { value: 'no', label: 'Mundane' },
  { value: 'yes', label: 'Magical' },
];

const fullyIdentifiedOptions: EncumbranceSelectOption[] = [
  { value: 'no', label: 'Not fully identified' },
  { value: 'yes', label: 'Fully identified' },
];

const carriedWeightSelectOptions: EncumbranceSelectOption[] = [
  {
    value: 'count',
    label: carriedWeightRuleOptions.count,
  },
  {
    value: 'own',
    label: carriedWeightRuleOptions.own,
  },
];

const isEncumbranceSelectGroup = (
  option: EncumbranceSelectOption | EncumbranceSelectGroup
): option is EncumbranceSelectGroup => 'options' in option;

const findEncumbranceSelectOption = (
  options: EncumbranceSelectOptions,
  value: EncumbranceSelectValue
): EncumbranceSelectOption | null => {
  for (const option of options) {
    if (isEncumbranceSelectGroup(option)) {
      const match = option.options.find(
        (groupOption) => groupOption.value === value
      );

      if (match) {
        return match;
      }

      continue;
    }

    if (option.value === value) {
      return option;
    }
  }

  return null;
};

const encumbranceSelectStyles = createEncumbranceSelectStyles();

interface EncumbranceSelectFieldProps {
  inputId: string;
  ariaLabel: string;
  options: EncumbranceSelectOptions;
  value: EncumbranceSelectValue;
  onChange: (value: EncumbranceSelectValue) => void;
  isDisabled?: boolean;
  autoFocus?: boolean;
  menuPortalTarget?: HTMLElement;
}

const EncumbranceSelectField = ({
  inputId,
  ariaLabel,
  options,
  value,
  onChange,
  isDisabled = false,
  autoFocus = false,
  menuPortalTarget,
}: EncumbranceSelectFieldProps) => (
  <Select<EncumbranceSelectOption, false, EncumbranceSelectGroup>
    inputId={inputId}
    aria-label={ariaLabel}
    isSearchable={false}
    styles={encumbranceSelectStyles}
    menuPortalTarget={menuPortalTarget}
    menuPosition="fixed"
    openMenuOnFocus
    value={findEncumbranceSelectOption(options, value)}
    options={options}
    onChange={(nextOption: SingleValue<EncumbranceSelectOption>) => {
      if (nextOption) {
        onChange(nextOption.value);
      }
    }}
    isDisabled={isDisabled}
    autoFocus={autoFocus}
  />
);

const documentFilePickerTypes: BrowserFilePickerAcceptType[] = [
  {
    description: 'AD&D Encumbrance Files',
    accept: {
      'application/json': ['.json'],
    },
  },
];

const getBrowserFilePickerWindow = (): BrowserFilePickerWindow | null =>
  typeof window === 'undefined' ? null : (window as BrowserFilePickerWindow);

const supportsBrowserFileSystemAccess = (): boolean => {
  const browserWindow = getBrowserFilePickerWindow();

  return Boolean(
    browserWindow &&
      typeof browserWindow.showOpenFilePicker === 'function' &&
      typeof browserWindow.showSaveFilePicker === 'function'
  );
};

const isFilePickerAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

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

const getSuggestedDocumentFileName = (
  nextDocument: EncumbranceDocument
): string => {
  const kindLabel =
    nextDocument.kind === 'adnd-encumbrance-dm' ? 'dm' : 'player';
  const baseName =
    nextDocument.kind === 'adnd-encumbrance-dm'
      ? nextDocument.characters.length > 1
        ? 'party'
        : nextDocument.characters[0]?.name || 'character'
      : nextDocument.character.name || 'character';

  return `${slugify(baseName)}-encumbrance-${kindLabel}.json`;
};

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
): number =>
  (typeof item.valueGpOverride === 'number'
    ? item.valueGpOverride
    : itemInfo.valueGp) * item.quantity;

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

interface InventoryRowRecord {
  character: EncumbranceCharacterSheet;
  item: EncumbranceInventoryItem;
  itemInfo: EncumbranceCatalogItem;
  displayName: string;
  itemOwnLoadGp: number;
  itemVisibleValueGp: number | null;
  noteLines: RowNoteLine[];
  depth: number;
  sequence: number;
  ownerLabel: string;
  containerStatusLabel?: string;
  containerUsage?: string;
  containerSummary?: ReturnType<typeof getContainerLoadSummary>;
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

const compareInventoryRowRecords = (
  left: InventoryRowRecord,
  right: InventoryRowRecord,
  activeSorts: InventorySortKey[]
): number => {
  for (let index = activeSorts.length - 1; index >= 0; index -= 1) {
    const sortKey = activeSorts[index];

    if (sortKey === 'day') {
      const dayDifference = left.item.day - right.item.day;
      if (dayDifference !== 0) {
        return dayDifference;
      }

      continue;
    }

    const leftValue = sortKey === 'owner' ? left.ownerLabel : left.displayName;
    const rightValue =
      sortKey === 'owner' ? right.ownerLabel : right.displayName;
    const valueDifference = leftValue.localeCompare(rightValue, undefined, {
      sensitivity: 'base',
    });

    if (valueDifference !== 0) {
      return valueDifference;
    }
  }

  return left.sequence - right.sequence;
};

const countResolvedCharacterFields = (plan: PlayerMergePlan): number =>
  plan.characterFields.filter((field) => field.selectedSource === 'player')
    .length;

const countResolvedItemUpdates = (plan: PlayerMergePlan): number =>
  plan.items.filter(
    (item) =>
      item.kind === 'updated' &&
      item.fields.some((field) => field.selectedSource === 'player')
  ).length;

const countRemovalReviews = (plan: PlayerMergePlan): number =>
  plan.items.filter((item) => item.kind === 'removed').length;

const countMergeConflicts = (plan: PlayerMergePlan): number =>
  plan.characterFields.filter((field) => field.isConflict).length +
  plan.items.reduce((count, item) => {
    if (item.kind === 'issue') {
      return count + 1;
    }

    return count + item.fields.filter((field) => field.isConflict).length;
  }, 0);

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
  const [inventorySorts, setInventorySorts] = useState<InventorySortKey[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItemDraft, setEditingItemDraft] =
    useState<InventoryEditDraft | null>(null);
  const [pendingRemovalState, setPendingRemovalState] =
    useState<PendingRemovalState | null>(null);
  const [pendingMergeReview, setPendingMergeReview] =
    useState<PendingMergeReviewState | null>(null);
  const [showFileMenu, setShowFileMenu] = useState<boolean>(false);
  const [currentDocumentFileHandle, setCurrentDocumentFileHandle] =
    useState<BrowserFileHandle | null>(null);
  const [playerFileHandlesByCharacterId, setPlayerFileHandlesByCharacterId] =
    useState<Record<string, BrowserFileHandle>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mergeFileInputRef = useRef<HTMLInputElement | null>(null);
  const fileMenuRef = useRef<HTMLDivElement | null>(null);
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
  const activeInventorySorts = useMemo(
    () =>
      inventorySorts.filter(
        (sortKey) => sortKey !== 'owner' || isAllCharactersView
      ),
    [inventorySorts, isAllCharactersView]
  );
  const hasActiveInventorySorts = activeInventorySorts.length > 0;
  const supportsNativeFileHandles = supportsBrowserFileSystemAccess();
  const selectMenuPortalTarget =
    typeof window === 'undefined' ? undefined : window.document.body;

  useEffect(() => {
    if (
      !pendingRemovalState &&
      !editingItemDraft &&
      !showAddModal &&
      !characterEditDraft &&
      !pendingMergeReview
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (pendingMergeReview) {
          setPendingMergeReview(null);
          return;
        }

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
  }, [
    characterEditDraft,
    editingItemDraft,
    pendingMergeReview,
    pendingRemovalState,
    showAddModal,
  ]);

  useEffect(() => {
    if (!isAllCharactersView) {
      setInventorySorts((currentSorts) =>
        currentSorts.filter((sortKey) => sortKey !== 'owner')
      );
    }
  }, [isAllCharactersView]);

  useEffect(() => {
    if (!showFileMenu) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        fileMenuRef.current &&
        !fileMenuRef.current.contains(event.target as Node)
      ) {
        setShowFileMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowFileMenu(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFileMenu]);

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

  const selectableCatalogOptionGroups = useMemo(
    () =>
      (Object.keys(categoryLabels) as EquipmentCategory[]).map((category) => ({
        label: categoryLabels[category],
        options: selectableCatalogGroups[category].map((item) => ({
          value: item.id,
          label: item.name,
        })),
      })),
    [selectableCatalogGroups]
  );

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
  const editingTransferOptions =
    mode === 'dm' && editingItemDraft && dmCharacters.length > 1
      ? dmCharacters.map((character) => ({
          id: character.id,
          label: getCharacterDisplayName(character.name),
        }))
      : [];
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
  const storedInOptions: EncumbranceSelectOption[] = [
    {
      value: '',
      label: 'On person',
    },
    ...containerItems.map((containerItem) => {
      const containerInfo = getInventoryItemInfo(containerItem, catalogById);
      const isAllowed = containerInfo
        ? canStoreItemInContainer(
            addPreviewItem || customPreviewItem,
            containerInfo
          )
        : true;

      return {
        value: containerItem.id,
        label: containerInfo
          ? getInventoryItemDisplayName(containerItem, containerInfo)
          : 'Container',
        isDisabled: !isAllowed,
      };
    }),
  ];
  const editingStoredInOptions: EncumbranceSelectOption[] = [
    {
      value: '',
      label: 'On person',
    },
    ...editingParentOptions.map((containerItem) => {
      const containerInfo = getInventoryItemInfo(containerItem, catalogById);

      return {
        value: containerItem.id,
        label: containerInfo
          ? getInventoryItemDisplayName(containerItem, containerInfo)
          : 'Container',
      };
    }),
  ];
  const heldByOptions: EncumbranceSelectOption[] = editingTransferOptions.map(
    (character) => ({
      value: character.id,
      label: character.label,
    })
  );
  const mergeReviewPlan = pendingMergeReview?.plan;
  const mergeAppliedCharacterFieldCount = mergeReviewPlan
    ? countResolvedCharacterFields(mergeReviewPlan)
    : 0;
  const mergeAppliedItemUpdateCount = mergeReviewPlan
    ? countResolvedItemUpdates(mergeReviewPlan)
    : 0;
  const mergeAddedItemCount = mergeReviewPlan
    ? mergeReviewPlan.items.filter((item) => item.kind === 'added').length
    : 0;
  const mergeRemovalReviewCount = mergeReviewPlan
    ? countRemovalReviews(mergeReviewPlan)
    : 0;
  const mergeConflictCount = mergeReviewPlan
    ? countMergeConflicts(mergeReviewPlan)
    : 0;

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
      valueGp:
        typeof item.valueGpOverride === 'number'
          ? item.valueGpOverride
          : itemInfo.valueGp,
    });
  };

  const closeEditModal = () => {
    setEditingItemDraft(null);
  };

  const openAddModal = () => {
    setAddMode('catalog');
    setAddItemDetailsDraft(defaultAddItemDetailsDraft('catalog'));
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setAddMode('catalog');
    setAddItemDetailsDraft(defaultAddItemDetailsDraft('catalog'));
    setShowAddModal(false);
  };

  const closeFileMenu = () => {
    setShowFileMenu(false);
  };

  const createFileMenuAction =
    (action: () => void | Promise<void>) => async () => {
      closeFileMenu();
      await action();
    };

  const closeMergeReviewModal = () => {
    setPendingMergeReview(null);
  };

  const writeDocumentToFileHandle = async (
    handle: BrowserFileHandle,
    nextDocument: EncumbranceDocument
  ) => {
    const descriptor: BrowserFilePermissionDescriptor = {
      mode: 'readwrite',
    };

    if (handle.queryPermission) {
      const currentPermission = await handle.queryPermission(descriptor);

      if (
        currentPermission !== 'granted' &&
        handle.requestPermission &&
        (await handle.requestPermission(descriptor)) !== 'granted'
      ) {
        throw new Error('File access was not granted.');
      }
    } else if (
      handle.requestPermission &&
      (await handle.requestPermission(descriptor)) !== 'granted'
    ) {
      throw new Error('File access was not granted.');
    }

    const writable = await handle.createWritable();
    await writable.write(stringifyEncumbranceDocument(nextDocument));
    await writable.close();
  };

  const loadDocumentFromText = (
    text: string,
    nextHandle: BrowserFileHandle | null = null
  ) => {
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
    setCurrentDocumentFileHandle(nextHandle);
    setPlayerFileHandlesByCharacterId({});
    setShowAllCharacters(false);
    setCharacterEditDraft(null);
    setShowAddModal(false);
    setEditingItemDraft(null);
    setPendingRemovalState(null);
    setPendingMergeReview(null);
    setSelectedContainerId('');
    setSelectedQuantity(1);
    setAddItemDetailsDraft(defaultAddItemDetailsDraft());
  };

  const loadCurrentDocumentFromFileHandle = async (
    handle: BrowserFileHandle
  ) => {
    const file = await handle.getFile();
    const text = await file.text();
    loadDocumentFromText(text, handle);
  };

  const importPlayerChangesFromText = (
    text: string,
    fileName: string,
    nextHandle: BrowserFileHandle | null = null
  ) => {
    if (document.kind !== 'adnd-encumbrance-dm') {
      throw new Error('Import Player is only available in DM view.');
    }

    const parsed = parseEncumbranceDocument(text);

    if (parsed.kind !== 'adnd-encumbrance-player') {
      throw new Error('Import Player can only use exported player files.');
    }

    const mergePlan = buildPlayerMergePlan(document, parsed);
    setCharacterEditDraft(null);
    setShowAddModal(false);
    setEditingItemDraft(null);
    setPendingRemovalState(null);
    setSelectedContainerId('');
    setSelectedQuantity(1);
    setAddItemDetailsDraft(defaultAddItemDetailsDraft());
    setPendingMergeReview({
      fileName,
      plan: mergePlan,
    });

    if (nextHandle) {
      setPlayerFileHandlesByCharacterId((currentHandles) => ({
        ...currentHandles,
        [mergePlan.characterId]: nextHandle,
      }));
    }
  };

  const importPlayerChangesFromFileHandle = async (
    handle: BrowserFileHandle
  ) => {
    const file = await handle.getFile();
    const text = await file.text();
    importPlayerChangesFromText(text, file.name || handle.name, handle);
  };

  const updateMergeReviewFieldSelection = (
    itemId: string | null,
    fieldKey: string,
    selectedSource: PlayerMergeChoiceSource
  ) => {
    setPendingMergeReview((currentReview) => {
      if (!currentReview) {
        return currentReview;
      }

      if (itemId === null) {
        return {
          ...currentReview,
          plan: {
            ...currentReview.plan,
            characterFields: currentReview.plan.characterFields.map((field) =>
              field.key === fieldKey
                ? {
                    ...field,
                    selectedSource,
                  }
                : field
            ),
          },
        };
      }

      return {
        ...currentReview,
        plan: {
          ...currentReview.plan,
          items: currentReview.plan.items.map((item) => {
            if (
              item.kind === 'issue' ||
              item.kind === 'removed' ||
              item.itemId !== itemId
            ) {
              return item;
            }

            return {
              ...item,
              fields: item.fields.map((field) =>
                field.key === fieldKey
                  ? {
                      ...field,
                      selectedSource,
                    }
                  : field
              ),
            };
          }),
        },
      };
    });
  };

  const updateMergeRemovalSelection = (
    itemId: string,
    selectedAction: PlayerMergeRemovalChoice
  ) => {
    setPendingMergeReview((currentReview) => {
      if (!currentReview) {
        return currentReview;
      }

      return {
        ...currentReview,
        plan: {
          ...currentReview.plan,
          items: currentReview.plan.items.map((item) =>
            item.kind === 'removed' && item.itemId === itemId
              ? {
                  ...item,
                  selectedAction,
                }
              : item
          ),
        },
      };
    });
  };

  const applyPendingMergeReview = () => {
    if (!pendingMergeReview || document.kind !== 'adnd-encumbrance-dm') {
      return;
    }

    const mergedDocument = applyPlayerMergePlan(
      document,
      pendingMergeReview.plan
    );
    setDocument(mergedDocument);
    setPendingMergeReview(null);
    setCharacterEditDraft(null);
    setShowAddModal(false);
    setEditingItemDraft(null);
    setPendingRemovalState(null);
    setSelectedContainerId('');
    setSelectedQuantity(1);
    setAddItemDetailsDraft(defaultAddItemDetailsDraft());
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
    const normalizedValue = Math.max(0, Number(draft.valueGp) || 0);
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
      valueGpOverride:
        normalizedValue !== itemInfo.valueGp ? normalizedValue : undefined,
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

  const transferEditingItem = (nextCharacterId: string) => {
    if (
      !editingItemDraft ||
      !editingItem ||
      nextCharacterId === editingItemDraft.characterId
    ) {
      return;
    }

    transferInventoryItem(
      editingItemDraft.itemId,
      editingItemDraft.characterId,
      nextCharacterId
    );
    setEditingItemDraft((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            characterId: nextCharacterId,
            containerId: '',
          }
        : currentDraft
    );
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

  const transferInventoryItem = (
    itemId: string,
    sourceCharacterId: string,
    targetCharacterId: string
  ) => {
    if (sourceCharacterId === targetCharacterId) {
      return;
    }

    setDocument((currentDocument) => {
      if (currentDocument.kind !== 'adnd-encumbrance-dm') {
        return currentDocument;
      }

      const sourceCharacter = currentDocument.characters.find(
        (character) => character.id === sourceCharacterId
      );
      const targetCharacter = currentDocument.characters.find(
        (character) => character.id === targetCharacterId
      );

      if (!sourceCharacter || !targetCharacter) {
        return currentDocument;
      }

      const descendantIds = getDescendantIds(sourceCharacter.inventory, itemId);
      const movedIds = new Set([itemId, ...descendantIds]);
      const movedItems = sourceCharacter.inventory
        .filter((item) => movedIds.has(item.id))
        .map((item) => ({
          ...item,
          containerId:
            item.containerId && movedIds.has(item.containerId)
              ? item.containerId
              : null,
        }));

      return {
        ...currentDocument,
        characters: currentDocument.characters.map((character) => {
          if (character.id === sourceCharacterId) {
            return {
              ...character,
              inventory: character.inventory.filter(
                (item) => !movedIds.has(item.id)
              ),
            };
          }

          if (character.id === targetCharacterId) {
            return {
              ...character,
              inventory: [...character.inventory, ...movedItems],
            };
          }

          return character;
        }),
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

  const toggleInventorySort = (sortKey: InventorySortKey) => {
    setInventorySorts((currentSorts) =>
      currentSorts.includes(sortKey)
        ? currentSorts.filter((currentSortKey) => currentSortKey !== sortKey)
        : [...currentSorts, sortKey]
    );
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

  const triggerImport = async () => {
    if (!supportsBrowserFileSystemAccess()) {
      fileInputRef.current?.click();
      return;
    }

    const browserWindow = getBrowserFilePickerWindow();

    if (!browserWindow?.showOpenFilePicker) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const [handle] = await browserWindow.showOpenFilePicker({
        excludeAcceptAllOption: true,
        multiple: false,
        types: documentFilePickerTypes,
      });

      if (!handle) {
        return;
      }

      await loadCurrentDocumentFromFileHandle(handle);
    } catch (error) {
      if (isFilePickerAbortError(error)) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Unable to load the file.';

      console.error(message);
      window.alert(message);
    }
  };

  const triggerMergeImport = async () => {
    if (!supportsBrowserFileSystemAccess()) {
      mergeFileInputRef.current?.click();
      return;
    }

    const browserWindow = getBrowserFilePickerWindow();

    if (!browserWindow?.showOpenFilePicker) {
      mergeFileInputRef.current?.click();
      return;
    }

    const rememberedHandle =
      document.kind === 'adnd-encumbrance-dm' && !isAllCharactersView
        ? playerFileHandlesByCharacterId[activeCharacter.id] || null
        : null;

    try {
      if (rememberedHandle) {
        await importPlayerChangesFromFileHandle(rememberedHandle);
        return;
      }

      const [handle] = await browserWindow.showOpenFilePicker({
        excludeAcceptAllOption: true,
        multiple: false,
        types: documentFilePickerTypes,
      });

      if (!handle) {
        return;
      }

      await importPlayerChangesFromFileHandle(handle);
    } catch (error) {
      if (isFilePickerAbortError(error)) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to import player changes.';

      console.error(message);
      window.alert(message);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      loadDocumentFromText(text);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load the file.';

      console.error(message);
      window.alert(message);
    } finally {
      event.target.value = '';
    }
  };

  const handleMergeImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || document.kind !== 'adnd-encumbrance-dm') {
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      importPlayerChangesFromText(text, file.name);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to import player changes.';

      console.error(message);
      window.alert(message);
    } finally {
      event.target.value = '';
    }
  };

  const downloadDocument = (nextDocument: EncumbranceDocument) => {
    const blob = new Blob([stringifyEncumbranceDocument(nextDocument)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = getSuggestedDocumentFileName(nextDocument);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const pickSaveFileHandle = async (
    nextDocument: EncumbranceDocument,
    pickerId: string
  ): Promise<BrowserFileHandle | null> => {
    const browserWindow = getBrowserFilePickerWindow();

    if (!browserWindow?.showSaveFilePicker) {
      return null;
    }

    try {
      return await browserWindow.showSaveFilePicker({
        excludeAcceptAllOption: true,
        id: pickerId,
        suggestedName: getSuggestedDocumentFileName(nextDocument),
        types: documentFilePickerTypes,
      });
    } catch (error) {
      if (isFilePickerAbortError(error)) {
        return null;
      }

      throw error;
    }
  };

  const exportCurrentDocument = async () => {
    downloadDocument(document);
  };

  const saveCurrentDocument = async () => {
    if (!supportsNativeFileHandles) {
      downloadDocument(document);
      return;
    }

    try {
      const handle =
        currentDocumentFileHandle ||
        (await pickSaveFileHandle(
          document,
          document.kind === 'adnd-encumbrance-dm'
            ? 'encumbrance-dm-document'
            : 'encumbrance-player-document'
        ));

      if (!handle) {
        return;
      }

      await writeDocumentToFileHandle(handle, document);
      setCurrentDocumentFileHandle(handle);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save the file.';

      console.error(message);
      window.alert(message);
    }
  };

  const saveCurrentDocumentAs = async () => {
    if (!supportsNativeFileHandles) {
      downloadDocument(document);
      return;
    }

    try {
      const handle = await pickSaveFileHandle(
        document,
        document.kind === 'adnd-encumbrance-dm'
          ? 'encumbrance-dm-document'
          : 'encumbrance-player-document'
      );

      if (!handle) {
        return;
      }

      await writeDocumentToFileHandle(handle, document);
      setCurrentDocumentFileHandle(handle);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save the file.';

      console.error(message);
      window.alert(message);
    }
  };

  const savePlayerDocument = async () => {
    const playerDocument = redactEncumbranceDocument(
      document,
      activeCharacter.id
    );

    if (!supportsNativeFileHandles) {
      downloadDocument(playerDocument);
      return;
    }

    try {
      const existingHandle =
        document.kind === 'adnd-encumbrance-dm'
          ? playerFileHandlesByCharacterId[activeCharacter.id] || null
          : null;
      const handle =
        existingHandle ||
        (await pickSaveFileHandle(
          playerDocument,
          `encumbrance-player-export-${activeCharacter.id}`
        ));

      if (!handle) {
        return;
      }

      await writeDocumentToFileHandle(handle, playerDocument);
      setPlayerFileHandlesByCharacterId((currentHandles) => ({
        ...currentHandles,
        [activeCharacter.id]: handle,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save the player file.';

      console.error(message);
      window.alert(message);
    }
  };

  const savePlayerDocumentAs = async () => {
    const playerDocument = redactEncumbranceDocument(
      document,
      activeCharacter.id
    );

    if (!supportsNativeFileHandles) {
      downloadDocument(playerDocument);
      return;
    }

    try {
      const handle = await pickSaveFileHandle(
        playerDocument,
        `encumbrance-player-export-${activeCharacter.id}`
      );

      if (!handle) {
        return;
      }

      await writeDocumentToFileHandle(handle, playerDocument);
      setPlayerFileHandlesByCharacterId((currentHandles) => ({
        ...currentHandles,
        [activeCharacter.id]: handle,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save the player file.';

      console.error(message);
      window.alert(message);
    }
  };

  const exportPlayerCopy = async () => {
    const playerDocument = redactEncumbranceDocument(
      document,
      activeCharacter.id
    );

    downloadDocument(playerDocument);
  };

  const resetDocument = () => {
    setDocument(createEmptyEncumbranceDocument(getDocumentKindForMode(mode)));
    setCurrentDocumentFileHandle(null);
    setPlayerFileHandlesByCharacterId({});
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

  const buildInventoryRowRecord = (
    character: EncumbranceCharacterSheet,
    item: EncumbranceInventoryItem,
    depth: number,
    sequence: number
  ): InventoryRowRecord | null => {
    const itemInfo = getInventoryItemInfo(item, catalogById);
    if (!itemInfo) {
      return null;
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

    return {
      character,
      item,
      itemInfo,
      displayName,
      itemOwnLoadGp,
      itemVisibleValueGp,
      noteLines,
      depth,
      sequence,
      ownerLabel: getCharacterOwnerLabel(character.name),
      containerStatusLabel,
      containerUsage,
      containerSummary,
    };
  };

  const renderInventoryRow = (
    rowRecord: InventoryRowRecord,
    flattened = false
  ) => (
    <button
      type="button"
      className={`${styles['inventoryRowButton']} ${
        isAllCharactersView ? styles['inventoryRowButtonParty'] : ''
      } ${
        rowRecord.containerSummary?.isOverCapacity
          ? styles['inventoryRowWarning']
          : ''
      }`}
      onClick={() => openEditItem(rowRecord.item.id, rowRecord.character.id)}
      aria-label={`Edit ${rowRecord.displayName}${
        isAllCharactersView
          ? ` for ${getCharacterDisplayName(rowRecord.character.name)}`
          : ''
      }`}
      aria-haspopup="dialog"
    >
      {isAllCharactersView && (
        <div className={styles['inventoryCellSummary']}>
          <span className={styles['inventoryLabel']}>Owner</span>
          <span className={styles['inventorySummaryValue']}>
            {rowRecord.ownerLabel}
          </span>
        </div>
      )}
      <div
        className={styles['inventoryCellPrimary']}
        style={
          flattened
            ? undefined
            : {
                paddingLeft: `calc(0.3rem + ${rowRecord.depth * 0.9}rem)`,
              }
        }
      >
        <span className={styles['inventoryLabel']}>Item</span>
        {isAllCharactersView && (
          <div className={styles['inventoryOwnerInline']}>
            {rowRecord.ownerLabel}
          </div>
        )}
        <div className={styles['inventoryNameRow']}>
          <span className={styles['inventoryName']}>
            {rowRecord.displayName}
          </span>
          {rowRecord.itemInfo.isContainer && (
            <span className={styles['inventoryBadge']}>Container</span>
          )}
          {rowRecord.containerStatusLabel && (
            <span
              className={`${styles['inventoryBadge']} ${
                rowRecord.containerSummary?.isOverCapacity
                  ? styles['inventoryBadgeWarning']
                  : ''
              }`}
            >
              {rowRecord.containerStatusLabel}
            </span>
          )}
        </div>
        {rowRecord.containerSummary &&
          rowRecord.containerStatusLabel &&
          rowRecord.containerUsage && (
            <div className={styles['inventoryStatusText']}>
              {rowRecord.containerStatusLabel === 'Full'
                ? `At capacity: ${rowRecord.containerUsage}`
                : `Container status: ${rowRecord.containerUsage}`}
            </div>
          )}
        {rowRecord.noteLines.length > 0 && (
          <span
            className={`${styles['inventoryNotesPreview']} ${styles['inventoryNotesInline']}`}
          >
            {rowRecord.noteLines.map((noteLine, index) => (
              <span
                key={`${rowRecord.item.id}-inline-note-${index}`}
                className={`${styles['inventoryNoteLine']} ${
                  noteLine.tone === 'dm' ? styles['inventoryNoteLineDm'] : ''
                }`}
              >
                {noteLine.text}
              </span>
            ))}
          </span>
        )}
        <div className={styles['inventoryCompactMeta']}>
          <span className={styles['inventoryCompactMetaItem']}>
            <span className={styles['inventoryCompactMetaLabel']}>Day</span>
            <span>{rowRecord.item.day}</span>
          </span>
          <span className={styles['inventoryCompactMetaItem']}>
            <span className={styles['inventoryCompactMetaLabel']}>Qty</span>
            <span>{rowRecord.item.quantity}</span>
          </span>
          <span className={styles['inventoryCompactMetaItem']}>
            <span className={styles['inventoryCompactMetaLabel']}>Load</span>
            <span>{rowRecord.itemOwnLoadGp} gp</span>
          </span>
          <span className={styles['inventoryCompactMetaItem']}>
            <span className={styles['inventoryCompactMetaLabel']}>
              {mode === 'dm' ? 'Value' : 'Known value'}
            </span>
            <span>{formatOptionalGpValue(rowRecord.itemVisibleValueGp)}</span>
          </span>
        </div>
      </div>
      <div className={styles['inventoryCellSummary']}>
        <span className={styles['inventoryLabel']}>Day</span>
        <span className={styles['inventorySummaryValue']}>
          {rowRecord.item.day}
        </span>
      </div>
      <div className={styles['inventoryCellSummary']}>
        <span className={styles['inventoryLabel']}>Qty</span>
        <span className={styles['inventorySummaryValue']}>
          {rowRecord.item.quantity}
        </span>
      </div>
      <div className={styles['inventoryCellSummary']}>
        <span className={styles['inventoryLabel']}>Load</span>
        <span className={styles['inventorySummaryValue']}>
          {rowRecord.itemOwnLoadGp} gp
        </span>
      </div>
      <div className={styles['inventoryCellSummary']}>
        <span className={styles['inventoryLabel']}>Value</span>
        <span className={styles['inventorySummaryValue']}>
          {formatOptionalGpValue(rowRecord.itemVisibleValueGp)}
        </span>
      </div>
      <div
        className={`${styles['inventoryCellSummary']} ${styles['inventoryNotesCell']}`}
      >
        <span className={styles['inventoryLabel']}>Notes</span>
        {rowRecord.noteLines.length > 0 ? (
          <span className={styles['inventoryNotesPreview']}>
            {rowRecord.noteLines.map((noteLine, index) => (
              <span
                key={`${rowRecord.item.id}-note-${index}`}
                className={`${styles['inventoryNoteLine']} ${
                  noteLine.tone === 'dm' ? styles['inventoryNoteLineDm'] : ''
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
  );

  const collectInventoryRowRecords = (
    character: EncumbranceCharacterSheet,
    containerId: string | null,
    depth = 0,
    sequenceRef = { value: 0 }
  ): InventoryRowRecord[] =>
    character.inventory
      .filter((item) => item.containerId === containerId)
      .flatMap((item) => {
        const rowRecord = buildInventoryRowRecord(
          character,
          item,
          depth,
          sequenceRef.value
        );
        sequenceRef.value += 1;
        const childRecords = collectInventoryRowRecords(
          character,
          item.id,
          depth + 1,
          sequenceRef
        );

        return rowRecord ? [rowRecord, ...childRecords] : childRecords;
      });

  const renderInventoryRows = (
    character: EncumbranceCharacterSheet,
    containerId: string | null,
    depth = 0
  ): JSX.Element[] =>
    character.inventory
      .filter((item) => item.containerId === containerId)
      .flatMap((item) => {
        const rowRecord = buildInventoryRowRecord(character, item, depth, 0);
        const childRows = renderInventoryRows(character, item.id, depth + 1);

        if (!rowRecord) {
          return childRows;
        }

        return [
          <div
            key={`${character.id}-${item.id}`}
            className={styles['inventoryRowShell']}
          >
            {renderInventoryRow(rowRecord)}
          </div>,
          ...childRows,
        ];
      });

  const flatInventoryRows = (() => {
    const sequenceRef = { value: 0 };

    return visibleCharacters.flatMap((character) =>
      collectInventoryRowRecords(character, null, 0, sequenceRef)
    );
  })();

  const displayedInventoryRows = hasActiveInventorySorts
    ? [...flatInventoryRows]
        .sort((left, right) =>
          compareInventoryRowRecords(left, right, activeInventorySorts)
        )
        .map((rowRecord) => (
          <div
            key={`${rowRecord.character.id}-${rowRecord.item.id}`}
            className={styles['inventoryRowShell']}
          >
            {renderInventoryRow(rowRecord, true)}
          </div>
        ))
    : visibleCharacters.flatMap((character) =>
        renderInventoryRows(character, null)
      );
  const getInventorySortPriority = (
    sortKey: InventorySortKey
  ): number | null => {
    const sortIndex = activeInventorySorts.indexOf(sortKey);

    return sortIndex === -1 ? null : activeInventorySorts.length - sortIndex;
  };
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
    editingItemDraft?.valueGp !== undefined
      ? editingItemDraft.valueGp * editingDraftQuantity
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
  const renderMergeFieldReview = (
    field: PlayerMergeFieldReview,
    itemId: string | null = null
  ) => {
    const canChoose = field.isConflict;

    const renderValueCard = (
      source: PlayerMergeChoiceSource,
      label: string,
      value: string
    ) => {
      const isSelected = field.selectedSource === source;
      const className = `${styles['mergeValueCard']} ${
        isSelected ? styles['mergeValueCardSelected'] : ''
      } ${canChoose ? styles['mergeValueCardSelectable'] : ''}`;

      if (canChoose) {
        return (
          <button
            key={source}
            type="button"
            className={className}
            onClick={() =>
              updateMergeReviewFieldSelection(itemId, field.key, source)
            }
          >
            <span className={styles['mergeValueLabel']}>{label}</span>
            <span className={styles['mergeValueText']}>{value}</span>
          </button>
        );
      }

      return (
        <div key={source} className={className}>
          <span className={styles['mergeValueLabel']}>{label}</span>
          <span className={styles['mergeValueText']}>{value}</span>
        </div>
      );
    };

    return (
      <div key={field.key} className={styles['mergeFieldReview']}>
        <div className={styles['mergeFieldHeader']}>
          <span className={styles['mergeFieldLabel']}>{field.label}</span>
          <span
            className={`${styles['mergeFieldStatus']} ${
              field.isConflict
                ? styles['mergeFieldStatusConflict']
                : styles['mergeFieldStatusApplied']
            }`}
          >
            {field.isConflict
              ? 'Conflict'
              : field.selectedSource === 'player'
              ? 'Will import'
              : 'Keep DM'}
          </span>
        </div>
        <div className={styles['mergeValueGrid']}>
          {renderValueCard('player', 'Player', field.playerDisplay)}
          {renderValueCard('dm', 'DM', field.dmDisplay)}
        </div>
      </div>
    );
  };

  const renderMergeItemReview = (item: PlayerMergeItemReview) => {
    if (item.kind === 'issue') {
      return (
        <section
          key={`merge-issue-${item.itemId}`}
          className={`${styles['mergeReviewCard']} ${styles['mergeReviewCardIssue']}`}
        >
          <div className={styles['mergeReviewCardHeader']}>
            <div>
              <div className={styles['mergeReviewCardTitle']}>
                {item.itemName}
              </div>
              <div className={styles['mergeReviewCardSubtitle']}>
                {item.ownerName}
              </div>
            </div>
            <span
              className={`${styles['mergeReviewBadge']} ${styles['mergeReviewBadgeIssue']}`}
            >
              Needs review
            </span>
          </div>
          <p className={styles['mergeReviewMessage']}>{item.message}</p>
        </section>
      );
    }

    if (item.kind === 'removed') {
      const renderRemovalCard = (
        choice: PlayerMergeRemovalChoice,
        label: string,
        value: string
      ) => {
        const isSelected = item.selectedAction === choice;
        return (
          <button
            key={choice}
            type="button"
            className={`${styles['mergeValueCard']} ${
              styles['mergeValueCardSelectable']
            } ${isSelected ? styles['mergeValueCardSelected'] : ''}`}
            onClick={() => updateMergeRemovalSelection(item.itemId, choice)}
          >
            <span className={styles['mergeValueLabel']}>{label}</span>
            <span className={styles['mergeValueText']}>{value}</span>
          </button>
        );
      };

      return (
        <section key={item.itemId} className={styles['mergeReviewCard']}>
          <div className={styles['mergeReviewCardHeader']}>
            <div>
              <div className={styles['mergeReviewCardTitle']}>
                {item.itemName}
              </div>
              <div className={styles['mergeReviewCardSubtitle']}>
                {item.ownerName}
              </div>
            </div>
            <span
              className={`${styles['mergeReviewBadge']} ${styles['mergeReviewBadgeRemoval']}`}
            >
              Removal request
            </span>
          </div>
          <div className={styles['mergeFieldReview']}>
            <div className={styles['mergeFieldHeader']}>
              <span className={styles['mergeFieldLabel']}>Status</span>
              <span className={styles['mergeFieldStatus']}>Choose one</span>
            </div>
            <div className={styles['mergeValueGrid']}>
              {renderRemovalCard('remove', 'Player', 'Remove from party file')}
              {renderRemovalCard('keep', 'DM', 'Keep in party file')}
            </div>
          </div>
          {item.fields.length > 0 && (
            <div className={styles['mergeFieldList']}>
              {item.fields.map((field) =>
                renderMergeFieldReview(field, item.itemId)
              )}
            </div>
          )}
        </section>
      );
    }

    const badgeLabel =
      item.kind === 'added'
        ? 'New item'
        : item.fields.some((field) => field.isConflict)
        ? 'Conflict'
        : 'Will import';

    const badgeClass =
      item.kind === 'added'
        ? styles['mergeReviewBadgeAdded']
        : item.fields.some((field) => field.isConflict)
        ? styles['mergeReviewBadgeConflict']
        : styles['mergeReviewBadgeApplied'];

    return (
      <section key={item.itemId} className={styles['mergeReviewCard']}>
        <div className={styles['mergeReviewCardHeader']}>
          <div>
            <div className={styles['mergeReviewCardTitle']}>
              {item.itemName}
            </div>
            <div className={styles['mergeReviewCardSubtitle']}>
              {item.ownerName}
            </div>
          </div>
          <span className={`${styles['mergeReviewBadge']} ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
        <div className={styles['mergeFieldList']}>
          {item.fields.map((field) =>
            renderMergeFieldReview(field, item.itemId)
          )}
        </div>
        {item.notes.length > 0 && (
          <div className={styles['mergeNotesList']}>
            {item.notes.map((note) => (
              <div key={note} className={styles['mergeNote']}>
                {note}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };
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
            <div className={styles['menuContainer']} ref={fileMenuRef}>
              <button
                type="button"
                className={`${styles['button']} ${styles['buttonCompact']}`}
                aria-haspopup="menu"
                aria-expanded={showFileMenu}
                aria-controls="encumbrance-file-menu"
                onClick={() => setShowFileMenu((currentValue) => !currentValue)}
              >
                File
              </button>
              {showFileMenu && (
                <div
                  id="encumbrance-file-menu"
                  role="menu"
                  aria-label="File"
                  className={styles['menuPanel']}
                >
                  {mode === 'dm' && (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles['menuItem']}
                      onClick={createFileMenuAction(resetDocument)}
                    >
                      New File
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className={styles['menuItem']}
                    onClick={createFileMenuAction(triggerImport)}
                  >
                    Load File
                  </button>
                  {supportsNativeFileHandles && (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles['menuItem']}
                      onClick={createFileMenuAction(saveCurrentDocument)}
                    >
                      Save
                    </button>
                  )}
                  {supportsNativeFileHandles && (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles['menuItem']}
                      onClick={createFileMenuAction(saveCurrentDocumentAs)}
                    >
                      Save As...
                    </button>
                  )}
                  <div
                    role="separator"
                    aria-hidden="true"
                    className={styles['menuDivider']}
                  />
                  {mode === 'dm' && (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles['menuItem']}
                      onClick={createFileMenuAction(triggerMergeImport)}
                    >
                      Import Player
                    </button>
                  )}
                  {mode === 'dm' && supportsNativeFileHandles && (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles['menuItem']}
                      onClick={createFileMenuAction(savePlayerDocument)}
                      disabled={isAllCharactersView}
                      title={
                        isAllCharactersView
                          ? 'Select a character to save a player file.'
                          : undefined
                      }
                    >
                      Save Player
                    </button>
                  )}
                  {mode === 'dm' && supportsNativeFileHandles && (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles['menuItem']}
                      onClick={createFileMenuAction(savePlayerDocumentAs)}
                      disabled={isAllCharactersView}
                      title={
                        isAllCharactersView
                          ? 'Select a character to save a player file.'
                          : undefined
                      }
                    >
                      Save Player As...
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className={styles['menuItem']}
                    onClick={createFileMenuAction(exportCurrentDocument)}
                  >
                    {mode === 'dm' ? 'Export DM File' : 'Export File'}
                  </button>
                  {mode === 'dm' && (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles['menuItem']}
                      onClick={createFileMenuAction(exportPlayerCopy)}
                      disabled={isAllCharactersView}
                      title={
                        isAllCharactersView
                          ? 'Select a character to export a player file.'
                          : undefined
                      }
                    >
                      Export Player
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          aria-label="Load File"
          accept=".json,application/json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <input
          ref={mergeFileInputRef}
          type="file"
          aria-label="Import Player File"
          accept=".json,application/json"
          onChange={handleMergeImport}
          style={{ display: 'none' }}
        />

        <div
          className={`${styles['gridLayout']} ${
            mode === 'dm' ? styles['gridLayoutCompact'] : ''
          }`}
        >
          <section
            className={`${styles['card']} ${styles['characterCard']} ${
              mode === 'dm' ? styles['cardTight'] : ''
            }`}
          >
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
              <div
                className={`${styles['characterSummary']} ${
                  mode === 'dm' ? styles['characterSummaryCompact'] : ''
                }`}
              >
                <div
                  className={`${styles['characterSummaryName']} ${
                    mode === 'dm' ? styles['characterSummaryNameCompact'] : ''
                  }`}
                >
                  {characterSummaryName}
                </div>
                <div
                  className={`${styles['characterSummaryRow']} ${
                    mode === 'dm' ? styles['characterSummaryRowCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['characterSummaryChip']} ${
                      mode === 'dm' ? styles['characterSummaryChipCompact'] : ''
                    }`}
                  >
                    {visibleCharacterCount} characters
                  </span>
                  <span
                    className={`${styles['characterSummaryText']} ${
                      mode === 'dm' ? styles['characterSummaryTextCompact'] : ''
                    }`}
                  >
                    Select a tab to edit a character.
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
                <div
                  className={`${styles['characterSummary']} ${
                    mode === 'dm' ? styles['characterSummaryCompact'] : ''
                  }`}
                >
                  <div
                    className={`${styles['characterSummaryName']} ${
                      mode === 'dm' ? styles['characterSummaryNameCompact'] : ''
                    }`}
                  >
                    {characterSummaryName}
                  </div>
                  <div
                    className={`${styles['characterSummaryRow']} ${
                      mode === 'dm' ? styles['characterSummaryRowCompact'] : ''
                    }`}
                  >
                    <span
                      className={`${styles['characterSummaryChip']} ${
                        mode === 'dm'
                          ? styles['characterSummaryChipCompact']
                          : ''
                      }`}
                    >
                      STR {characterSummaryStrength}
                    </span>
                    {mode === 'dm' && hasDmNotes && (
                      <span
                        className={`${styles['characterSummaryText']} ${styles['characterSummaryTextCompact']}`}
                      >
                        Private notes saved
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )}
          </section>

          <section
            className={`${styles['card']} ${
              mode === 'dm' ? styles['cardTight'] : ''
            }`}
          >
            <div className={styles['cardTitle']}>Encumbrance</div>
            {isAllCharactersView ? (
              <div
                className={`${styles['summaryGrid']} ${
                  mode === 'dm' ? styles['summaryGridCompact'] : ''
                }`}
              >
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Characters
                  </span>
                  <strong>{visibleCharacterCount}</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Items
                  </span>
                  <strong>{visibleItemCount}</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Containers
                  </span>
                  <strong>{visibleContainerCount}</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Total
                  </span>
                  <strong>{visibleTotalEncumbranceGp} gp</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    {mode === 'dm' ? 'Value' : 'Known value'}
                  </span>
                  <strong>{formatGpValue(visibleTotalValueGp)} gp</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Warnings
                  </span>
                  <strong>{visibleContainerWarningCount}</strong>
                </div>
              </div>
            ) : (
              <div
                className={`${styles['summaryGrid']} ${
                  mode === 'dm' ? styles['summaryGridCompact'] : ''
                }`}
              >
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Total
                  </span>
                  <strong>{totalEncumbranceGp} gp</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    12&quot; Capacity
                  </span>
                  <strong>{carryingCapacityGp} gp</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    {mode === 'dm' ? 'Value' : 'Known value'}
                  </span>
                  <strong>{formatGpValue(totalValueGp)} gp</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Band
                  </span>
                  <strong>{loadBand.label}</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Move
                  </span>
                  <strong>{loadBand.movement}</strong>
                </div>
                <div
                  className={`${styles['summaryValue']} ${
                    mode === 'dm' ? styles['summaryValueCompact'] : ''
                  }`}
                >
                  <span
                    className={`${styles['summaryLabel']} ${
                      mode === 'dm' ? styles['summaryLabelCompact'] : ''
                    }`}
                  >
                    Warnings
                  </span>
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
            {isAllCharactersView && (
              <button
                type="button"
                className={`${styles['inventoryHeaderSortButton']} ${
                  getInventorySortPriority('owner') !== null
                    ? styles['inventoryHeaderSortButtonActive']
                    : ''
                }`}
                onClick={() => toggleInventorySort('owner')}
                aria-label="Sort by Owner"
                aria-pressed={getInventorySortPriority('owner') !== null}
              >
                <span>Owner</span>
                {getInventorySortPriority('owner') !== null && (
                  <span className={styles['inventorySortPriority']}>
                    {getInventorySortPriority('owner')}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              className={`${styles['inventoryHeaderSortButton']} ${
                getInventorySortPriority('item') !== null
                  ? styles['inventoryHeaderSortButtonActive']
                  : ''
              }`}
              onClick={() => toggleInventorySort('item')}
              aria-label="Sort by Item"
              aria-pressed={getInventorySortPriority('item') !== null}
            >
              <span>Item</span>
              {getInventorySortPriority('item') !== null && (
                <span className={styles['inventorySortPriority']}>
                  {getInventorySortPriority('item')}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`${styles['inventoryHeaderSortButton']} ${
                getInventorySortPriority('day') !== null
                  ? styles['inventoryHeaderSortButtonActive']
                  : ''
              }`}
              onClick={() => toggleInventorySort('day')}
              aria-label="Sort by Day"
              aria-pressed={getInventorySortPriority('day') !== null}
            >
              <span>Day</span>
              {getInventorySortPriority('day') !== null && (
                <span className={styles['inventorySortPriority']}>
                  {getInventorySortPriority('day')}
                </span>
              )}
            </button>
            <span>Qty</span>
            <span>Load</span>
            <span>{mode === 'dm' ? 'Value' : 'Known value'}</span>
            <span className={styles['inventoryNotesHeader']}>Notes</span>
          </div>
          <div className={styles['inventoryList']}>
            {displayedInventoryRows.length > 0 ? (
              displayedInventoryRows
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
            {pendingMergeReview && mergeReviewPlan && (
              <>
                <div
                  className={styles['modalShadow']}
                  onClick={closeMergeReviewModal}
                />
                <div
                  className={`${styles['modal']} ${styles['mergeReviewModal']}`}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="encumbrance-merge-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    id="encumbrance-merge-title"
                    className={styles['modalTitle']}
                  >
                    Review Player Changes
                  </div>
                  <div
                    className={`${styles['modalBody']} ${styles['liveEditModalBody']}`}
                  >
                    <p className={styles['modalText']}>
                      Review{' '}
                      <span className={styles['modalItemName']}>
                        {pendingMergeReview.fileName}
                      </span>{' '}
                      against the current DM record for{' '}
                      <span className={styles['modalItemName']}>
                        {mergeReviewPlan.characterName}
                      </span>
                      .
                    </p>
                    <div className={styles['mergeSummaryGrid']}>
                      <div className={styles['mergeSummaryItem']}>
                        <span className={styles['mergeSummaryLabel']}>
                          Character fields
                        </span>
                        <span className={styles['mergeSummaryValue']}>
                          {mergeAppliedCharacterFieldCount}
                        </span>
                      </div>
                      <div className={styles['mergeSummaryItem']}>
                        <span className={styles['mergeSummaryLabel']}>
                          Item updates
                        </span>
                        <span className={styles['mergeSummaryValue']}>
                          {mergeAppliedItemUpdateCount}
                        </span>
                      </div>
                      <div className={styles['mergeSummaryItem']}>
                        <span className={styles['mergeSummaryLabel']}>
                          Items added
                        </span>
                        <span className={styles['mergeSummaryValue']}>
                          {mergeAddedItemCount}
                        </span>
                      </div>
                      <div className={styles['mergeSummaryItem']}>
                        <span className={styles['mergeSummaryLabel']}>
                          Removal requests
                        </span>
                        <span className={styles['mergeSummaryValue']}>
                          {mergeRemovalReviewCount}
                        </span>
                      </div>
                      <div className={styles['mergeSummaryItem']}>
                        <span className={styles['mergeSummaryLabel']}>
                          Conflicts
                        </span>
                        <span className={styles['mergeSummaryValue']}>
                          {mergeConflictCount}
                        </span>
                      </div>
                    </div>
                    {mergeReviewPlan.characterFields.length > 0 && (
                      <section className={styles['mergeSection']}>
                        <div className={styles['mergeSectionTitle']}>
                          Character
                        </div>
                        <div className={styles['mergeFieldList']}>
                          {mergeReviewPlan.characterFields.map((field) =>
                            renderMergeFieldReview(field)
                          )}
                        </div>
                      </section>
                    )}
                    {mergeReviewPlan.items.length > 0 && (
                      <section className={styles['mergeSection']}>
                        <div className={styles['mergeSectionTitle']}>
                          Item Changes
                        </div>
                        <div className={styles['mergeReviewList']}>
                          {mergeReviewPlan.items.map((item) =>
                            renderMergeItemReview(item)
                          )}
                        </div>
                      </section>
                    )}
                    {mergeReviewPlan.characterFields.length === 0 &&
                      mergeReviewPlan.items.length === 0 && (
                        <p className={styles['modalText']}>
                          No player-visible changes were found in this file.
                        </p>
                      )}
                  </div>
                  <div className={styles['modalActions']}>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonCompact']}`}
                      onClick={closeMergeReviewModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonCompact']} ${styles['buttonPrimary']}`}
                      onClick={applyPendingMergeReview}
                    >
                      Apply Import
                    </button>
                  </div>
                </div>
              </>
            )}
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
                        <EncumbranceSelectField
                          inputId="encumbrance-character-strength"
                          ariaLabel="Strength"
                          options={strengthScoreOptions}
                          value={characterEditDraft.strengthScore}
                          onChange={(nextValue) =>
                            updateCharacterEditDraft((currentDraft) => ({
                              ...currentDraft,
                              strengthScore: Number(nextValue) || 8,
                              exceptional:
                                Number(nextValue) === 18
                                  ? currentDraft.exceptional
                                  : 'none',
                            }))
                          }
                          menuPortalTarget={selectMenuPortalTarget}
                        />
                      </label>
                      {characterEditDraft.strengthScore === 18 && (
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>
                            Exceptional
                          </span>
                          <EncumbranceSelectField
                            inputId="encumbrance-character-exceptional"
                            ariaLabel="Exceptional"
                            options={exceptionalStrengthOptions}
                            value={characterEditDraft.exceptional}
                            onChange={(nextValue) =>
                              updateCharacterEditDraft((currentDraft) => ({
                                ...currentDraft,
                                exceptional:
                                  nextValue as ExceptionalStrengthTier,
                              }))
                            }
                            menuPortalTarget={selectMenuPortalTarget}
                          />
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
                        onClick={() => {
                          setAddMode('catalog');
                          setAddItemDetailsDraft(
                            defaultAddItemDetailsDraft('catalog')
                          );
                        }}
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
                        onClick={() => {
                          setAddMode('custom');
                          setAddItemDetailsDraft(
                            defaultAddItemDetailsDraft('custom')
                          );
                        }}
                      >
                        Custom Item
                      </button>
                    </div>
                    <div className={styles['modalSection']}>
                      <div className={styles['modalFields']}>
                        {addMode === 'catalog' ? (
                          <label className={styles['modalFieldWide']}>
                            <span className={styles['fieldLabel']}>Item</span>
                            <EncumbranceSelectField
                              inputId="encumbrance-add-item"
                              ariaLabel="Item"
                              options={selectableCatalogOptionGroups}
                              value={selectedCatalogId}
                              onChange={(nextValue) => {
                                const nextCatalogId = `${nextValue}`;
                                setSelectedCatalogId(nextCatalogId);
                                const nextItem =
                                  encumbranceCatalogById.get(nextCatalogId);
                                if (nextItem?.isContainer) {
                                  setSelectedQuantity(1);
                                }
                              }}
                              menuPortalTarget={selectMenuPortalTarget}
                            />
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
                              <EncumbranceSelectField
                                inputId="encumbrance-add-category"
                                ariaLabel="Category"
                                options={customCategorySelectOptions}
                                value={customItemDraft.category}
                                onChange={(nextValue) =>
                                  updateCustomItemDraft(
                                    'category',
                                    nextValue as CustomCategory
                                  )
                                }
                                menuPortalTarget={selectMenuPortalTarget}
                              />
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
                          <EncumbranceSelectField
                            inputId="encumbrance-add-stored-in"
                            ariaLabel="Stored in"
                            options={storedInOptions}
                            value={selectedContainerId}
                            onChange={(nextValue) =>
                              setSelectedContainerId(`${nextValue}`)
                            }
                            menuPortalTarget={selectMenuPortalTarget}
                          />
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
                                <EncumbranceSelectField
                                  inputId="encumbrance-add-carried-weight"
                                  ariaLabel="Carried weight"
                                  options={carriedWeightSelectOptions}
                                  value={
                                    customItemDraft.ignoresContentsWeightForEncumbrance
                                      ? 'own'
                                      : 'count'
                                  }
                                  onChange={(nextValue) =>
                                    updateCustomItemDraft(
                                      'ignoresContentsWeightForEncumbrance',
                                      nextValue === 'own'
                                    )
                                  }
                                  menuPortalTarget={selectMenuPortalTarget}
                                />
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
                            <EncumbranceSelectField
                              inputId="encumbrance-add-magic-known"
                              ariaLabel="Magic known to player"
                              options={magicKnowledgeOptions}
                              value={addItemDetailsDraft.playerMagicKnowledge}
                              onChange={(nextValue) =>
                                setAddItemDetailsDraft((currentDraft) => {
                                  const nextKnowledge =
                                    nextValue as MagicKnowledge;
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
                              menuPortalTarget={selectMenuPortalTarget}
                            />
                          </label>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Value known to player
                            </span>
                            <EncumbranceSelectField
                              inputId="encumbrance-add-value-known"
                              ariaLabel="Value known to player"
                              options={valueKnowledgeOptions}
                              value={
                                addItemDetailsDraft.playerKnowsValue
                                  ? 'yes'
                                  : 'no'
                              }
                              onChange={(nextValue) =>
                                setAddItemDetailsDraft((currentDraft) => ({
                                  ...currentDraft,
                                  playerKnowsValue: nextValue === 'yes',
                                }))
                              }
                              menuPortalTarget={selectMenuPortalTarget}
                            />
                          </label>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Magical truth
                            </span>
                            <EncumbranceSelectField
                              inputId="encumbrance-add-magical-truth"
                              ariaLabel="Magical truth"
                              options={magicalTruthOptions}
                              value={
                                addItemDetailsDraft.isMagical ? 'yes' : 'no'
                              }
                              onChange={(nextValue) =>
                                setAddItemDetailsDraft((currentDraft) => ({
                                  ...currentDraft,
                                  isMagical: nextValue === 'yes',
                                  fullyIdentified:
                                    nextValue === 'yes'
                                      ? currentDraft.fullyIdentified
                                      : false,
                                }))
                              }
                              menuPortalTarget={selectMenuPortalTarget}
                            />
                          </label>
                          {addItemDetailsDraft.isMagical && (
                            <label className={styles['fieldGroup']}>
                              <span className={styles['fieldLabel']}>
                                Fully identified
                              </span>
                              <EncumbranceSelectField
                                inputId="encumbrance-add-fully-identified"
                                ariaLabel="Fully identified"
                                options={fullyIdentifiedOptions}
                                value={
                                  addItemDetailsDraft.fullyIdentified
                                    ? 'yes'
                                    : 'no'
                                }
                                onChange={(nextValue) =>
                                  setAddItemDetailsDraft((currentDraft) => ({
                                    ...currentDraft,
                                    fullyIdentified: nextValue === 'yes',
                                    playerMagicKnowledge:
                                      nextValue === 'yes'
                                        ? 'known-magical'
                                        : currentDraft.playerMagicKnowledge,
                                  }))
                                }
                                menuPortalTarget={selectMenuPortalTarget}
                              />
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
                        {editingTransferOptions.length > 0 && (
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Held by
                            </span>
                            <EncumbranceSelectField
                              inputId="encumbrance-edit-held-by"
                              ariaLabel="Held by"
                              options={heldByOptions}
                              value={editingItemDraft.characterId}
                              onChange={(nextValue) =>
                                transferEditingItem(`${nextValue}`)
                              }
                              menuPortalTarget={selectMenuPortalTarget}
                            />
                          </label>
                        )}
                        <label className={styles['fieldGroup']}>
                          <span className={styles['fieldLabel']}>
                            Stored in
                          </span>
                          <EncumbranceSelectField
                            inputId="encumbrance-edit-stored-in"
                            ariaLabel="Stored in"
                            options={editingStoredInOptions}
                            value={editingItemDraft.containerId}
                            onChange={(nextValue) =>
                              updateEditingItemDraft((currentDraft) => ({
                                ...currentDraft,
                                containerId: `${nextValue}`,
                              }))
                            }
                            menuPortalTarget={selectMenuPortalTarget}
                          />
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
                              Monetary value
                            </span>
                            <input
                              className={styles['fieldControl']}
                              type="number"
                              min={0}
                              step={0.01}
                              value={editingItemDraft.valueGp}
                              onChange={(event) =>
                                updateEditingItemDraft((currentDraft) => ({
                                  ...currentDraft,
                                  valueGp: Math.max(
                                    0,
                                    Number(event.target.value) || 0
                                  ),
                                }))
                              }
                            />
                          </label>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Value known to player
                            </span>
                            <EncumbranceSelectField
                              inputId="encumbrance-edit-value-known"
                              ariaLabel="Value known to player"
                              options={valueKnowledgeOptions}
                              value={
                                editingItemDraft.playerKnowsValue ? 'yes' : 'no'
                              }
                              onChange={(nextValue) =>
                                updateEditingItemDraft((currentDraft) => ({
                                  ...currentDraft,
                                  playerKnowsValue: nextValue === 'yes',
                                }))
                              }
                              menuPortalTarget={selectMenuPortalTarget}
                            />
                          </label>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Magical truth
                            </span>
                            <EncumbranceSelectField
                              inputId="encumbrance-edit-magical-truth"
                              ariaLabel="Magical truth"
                              options={magicalTruthOptions}
                              value={editingItemDraft.isMagical ? 'yes' : 'no'}
                              onChange={(nextValue) =>
                                updateEditingItemDraft((currentDraft) => ({
                                  ...currentDraft,
                                  isMagical: nextValue === 'yes',
                                  fullyIdentified:
                                    nextValue === 'yes'
                                      ? currentDraft.fullyIdentified
                                      : false,
                                }))
                              }
                              menuPortalTarget={selectMenuPortalTarget}
                            />
                          </label>
                          <label className={styles['fieldGroup']}>
                            <span className={styles['fieldLabel']}>
                              Magic known to player
                            </span>
                            <EncumbranceSelectField
                              inputId="encumbrance-edit-magic-known"
                              ariaLabel="Magic known to player"
                              options={magicKnowledgeOptions}
                              value={editingItemDraft.playerMagicKnowledge}
                              onChange={(nextValue) =>
                                updateEditingItemDraft((currentDraft) => {
                                  const nextKnowledge =
                                    nextValue as MagicKnowledge;

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
                              menuPortalTarget={selectMenuPortalTarget}
                            />
                          </label>
                          {editingCustomItemInfo?.isContainer && (
                            <label className={styles['fieldGroup']}>
                              <span className={styles['fieldLabel']}>
                                Carried weight
                              </span>
                              <EncumbranceSelectField
                                inputId="encumbrance-edit-carried-weight"
                                ariaLabel="Carried weight"
                                options={carriedWeightSelectOptions}
                                value={
                                  editingCustomItemInfo.ignoresContentsWeightForEncumbrance
                                    ? 'own'
                                    : 'count'
                                }
                                onChange={(nextValue) =>
                                  updateCustomInventoryItem(
                                    editingItemDraft.characterId,
                                    editingItemDraft.itemId,
                                    (currentItem) => ({
                                      ...currentItem,
                                      ignoresContentsWeightForEncumbrance:
                                        nextValue === 'own',
                                    })
                                  )
                                }
                                menuPortalTarget={selectMenuPortalTarget}
                              />
                            </label>
                          )}
                          {editingItemDraft.isMagical && (
                            <label className={styles['fieldGroup']}>
                              <span className={styles['fieldLabel']}>
                                Fully identified
                              </span>
                              <EncumbranceSelectField
                                inputId="encumbrance-edit-fully-identified"
                                ariaLabel="Fully identified"
                                options={fullyIdentifiedOptions}
                                value={
                                  editingItemDraft.fullyIdentified
                                    ? 'yes'
                                    : 'no'
                                }
                                onChange={(nextValue) =>
                                  updateEditingItemDraft((currentDraft) => ({
                                    ...currentDraft,
                                    fullyIdentified: nextValue === 'yes',
                                    playerMagicKnowledge:
                                      nextValue === 'yes'
                                        ? 'known-magical'
                                        : currentDraft.playerMagicKnowledge,
                                  }))
                                }
                                menuPortalTarget={selectMenuPortalTarget}
                              />
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
                              ? editingItemDraft.valueGp
                              : editingItemDraft.playerKnowsValue
                              ? editingItemDraft.valueGp
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
