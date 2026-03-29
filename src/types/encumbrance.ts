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
  | 'coins';

type AmmoKind = 'arrow' | 'bolt';

interface AmmoCapacityRule {
  ammoKind: AmmoKind;
  quantity: number;
}

export interface EncumbranceCatalogItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  encumbranceGp: number;
  isContainer?: boolean;
  capacityGp?: number;
  ammoKind?: AmmoKind;
  ammoCapacity?: AmmoCapacityRule;
}

export interface EncumbranceInventoryItem {
  id: string;
  catalogId: string;
  quantity: number;
  containerId: string | null;
}

interface EncumbranceCharacter {
  name: string;
  strength: StrengthScore;
}

interface EncumbranceDmData {
  privateNotes: string;
}

export interface EncumbranceDocument {
  kind: EncumbranceDocumentKind;
  version: 1;
  character: EncumbranceCharacter;
  inventory: EncumbranceInventoryItem[];
  dm?: EncumbranceDmData;
}

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
