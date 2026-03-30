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
  | 'weapons'
  | 'ammunition'
  | 'gear'
  | 'provisions'
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

export interface EncumbranceInventoryItem extends EncumbranceInventoryItemBase {
  day: number;
  playerNotes: string;
  playerMagicKnowledge: MagicKnowledge;
  name?: string;
  dmNotes?: string;
  isMagical?: boolean;
  fullyIdentified?: boolean;
  encumbranceGpOverride?: number;
}

interface EncumbranceCharacter {
  name: string;
  strength: StrengthScore;
}

interface EncumbranceDmData {
  privateNotes: string;
}

interface LegacyEncumbranceDocumentBase {
  kind: EncumbranceDocumentKind;
  character: EncumbranceCharacter;
  inventory: LegacyEncumbranceInventoryItem[];
  dm?: EncumbranceDmData;
}

interface EncumbranceDocumentBaseV4 {
  kind: EncumbranceDocumentKind;
  character: EncumbranceCharacter;
  inventory: EncumbranceInventoryItemV4[];
  customItems: EncumbranceCustomItem[];
  dm?: EncumbranceDmData;
}

interface EncumbranceDocumentBase {
  kind: EncumbranceDocumentKind;
  character: EncumbranceCharacter;
  inventory: EncumbranceInventoryItem[];
  customItems: EncumbranceCustomItem[];
  dm?: EncumbranceDmData;
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

type LegacyEncumbranceDocument = EncumbranceDocumentV1 | EncumbranceDocumentV2;

export type AnyEncumbranceDocument =
  | LegacyEncumbranceDocument
  | EncumbranceDocumentV3
  | EncumbranceDocumentV4
  | EncumbranceDocumentV5;

export type EncumbranceDocument = EncumbranceDocumentV5;

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
