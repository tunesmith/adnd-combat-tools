export type EncumbranceMode = 'dm' | 'player';

export type EncumbranceDocumentKind =
  | 'adnd-encumbrance-dm'
  | 'adnd-encumbrance-player';

export type ExceptionalStrengthTier =
  | 'none'
  | '01-50'
  | '51-75'
  | '76-90'
  | '91-99'
  | '00';

export interface StrengthScore {
  score: number;
  exceptional: ExceptionalStrengthTier;
}

export type EquipmentCategory =
  | 'containers'
  | 'armor'
  | 'arms'
  | 'clothing'
  | 'herbs'
  | 'adventuring-gear'
  | 'provisions'
  | 'religious-items'
  | 'treasure'
  | 'coins';

export type AmmoKind = 'arrow' | 'bolt';
export type MagicKnowledge = 'unknown' | 'known-mundane' | 'known-magical';

export interface AmmoCapacityRule {
  ammoKind: AmmoKind;
  quantity: number;
}

export interface EncumbranceCatalogItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  encumbranceGp: number;
  valueGp: number;
  isContainer?: boolean;
  capacityGp?: number;
  ignoresContentsWeightForEncumbrance?: boolean;
  ammoKind?: AmmoKind;
  ammoCapacity?: AmmoCapacityRule;
}

export type EncumbranceCustomItem = EncumbranceCatalogItem;

interface EncumbranceInventoryItemBase {
  id: string;
  catalogId: string;
  quantity: number;
  containerId: string | null;
}

export type LegacyEncumbranceInventoryItem = EncumbranceInventoryItemBase;

export interface EncumbranceInventoryItemV4
  extends EncumbranceInventoryItemBase {
  notes: string;
  nameOverride?: string;
  encumbranceGpOverride?: number;
}

export interface EncumbranceInventoryItemV5
  extends EncumbranceInventoryItemBase {
  day: number;
  playerNotes: string;
  playerMagicKnowledge: MagicKnowledge;
  name?: string;
  dmNotes?: string;
  isMagical?: boolean;
  fullyIdentified?: boolean;
  encumbranceGpOverride?: number;
  valueGpOverride?: number;
}

export interface EncumbranceInventoryItem extends EncumbranceInventoryItemV5 {
  playerKnowsValue: boolean;
  customItem?: EncumbranceCustomItem;
}

interface LegacyEncumbranceCharacter {
  name: string;
  strength: StrengthScore;
}

export interface EncumbranceCharacterSheet {
  id: string;
  name: string;
  strength: StrengthScore;
  inventory: EncumbranceInventoryItem[];
}

export type EncumbrancePlayerCharacter = EncumbranceCharacterSheet;

export interface EncumbranceDmCharacter extends EncumbranceCharacterSheet {
  dmNotes: string;
}

interface LegacyEncumbranceDocumentBase {
  kind: EncumbranceDocumentKind;
  character: LegacyEncumbranceCharacter;
  inventory: LegacyEncumbranceInventoryItem[];
  dm?: {
    privateNotes: string;
  };
}

interface EncumbranceDocumentBaseV4 {
  kind: EncumbranceDocumentKind;
  character: LegacyEncumbranceCharacter;
  inventory: EncumbranceInventoryItemV4[];
  customItems: EncumbranceCustomItem[];
  dm?: {
    privateNotes: string;
  };
}

interface EncumbranceDocumentBase {
  kind: EncumbranceDocumentKind;
  character: LegacyEncumbranceCharacter;
  inventory: EncumbranceInventoryItem[];
  customItems: EncumbranceCustomItem[];
  dm?: {
    privateNotes: string;
  };
}

export interface EncumbranceDocumentV1 extends LegacyEncumbranceDocumentBase {
  version: 1;
}

export interface EncumbranceDocumentV2 extends LegacyEncumbranceDocumentBase {
  version: 2;
}

export interface EncumbranceDocumentV3 extends EncumbranceDocumentBaseV4 {
  version: 3;
}

export interface EncumbranceDocumentV4 extends EncumbranceDocumentBaseV4 {
  version: 4;
}

export interface EncumbranceDocumentV5 extends EncumbranceDocumentBase {
  version: 5;
}

export interface EncumbranceDocumentV6 extends EncumbranceDocumentBase {
  version: 6;
}

export interface EncumbrancePlayerDocumentV7 {
  kind: 'adnd-encumbrance-player';
  version: 7;
  character: EncumbrancePlayerCharacter;
  customItems: EncumbranceCustomItem[];
}

export interface EncumbranceDmDocumentV7 {
  kind: 'adnd-encumbrance-dm';
  version: 7;
  activeCharacterId: string;
  characters: EncumbranceDmCharacter[];
  customItems: EncumbranceCustomItem[];
}

export interface EncumbrancePlayerDocumentV8 {
  kind: 'adnd-encumbrance-player';
  version: 8;
  character: EncumbrancePlayerCharacter;
}

export interface EncumbranceDmDocumentV8 {
  kind: 'adnd-encumbrance-dm';
  version: 8;
  activeCharacterId: string;
  characters: EncumbranceDmCharacter[];
}

export interface EncumbrancePlayerDocumentV9 {
  kind: 'adnd-encumbrance-player';
  version: 9;
  character: EncumbrancePlayerCharacter;
  mergeBaseCharacter?: EncumbrancePlayerCharacter;
}

export interface EncumbranceDmDocumentV9 {
  kind: 'adnd-encumbrance-dm';
  version: 9;
  activeCharacterId: string;
  characters: EncumbranceDmCharacter[];
}

type LegacyEncumbranceDocument = EncumbranceDocumentV1 | EncumbranceDocumentV2;

export type AnyEncumbranceDocument =
  | LegacyEncumbranceDocument
  | EncumbranceDocumentV3
  | EncumbranceDocumentV4
  | EncumbranceDocumentV5
  | EncumbranceDocumentV6
  | EncumbrancePlayerDocumentV7
  | EncumbranceDmDocumentV7
  | EncumbrancePlayerDocumentV8
  | EncumbranceDmDocumentV8
  | EncumbrancePlayerDocumentV9
  | EncumbranceDmDocumentV9;

export type EncumbranceDocument =
  | EncumbrancePlayerDocumentV9
  | EncumbranceDmDocumentV9;

type LoadBandId = 'normal' | 'heavy' | 'very-heavy' | 'encumbered';

export interface LoadBand {
  id: LoadBandId;
  label: string;
  movement: string;
}

export interface ContainerLoadSummary {
  used: number;
  capacity: number;
  unitLabel: 'gp' | 'items';
  isOverCapacity: boolean;
  mismatchedItemIds: string[];
}
