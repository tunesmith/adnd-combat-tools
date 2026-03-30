import type { TreasureMagicCategory } from '../features/treasure/magicCategory/magicCategoryTable';
import type {
  TreasurePotion,
  TreasurePotionAnimalControl,
  TreasurePotionDragonControl,
  TreasurePotionGiantControl,
  TreasurePotionGiantStrength,
  TreasurePotionHumanControl,
  TreasurePotionUndeadControl,
} from '../features/treasure/potion/potionTables';
import type {
  TreasureProtectionType,
  TreasureProtectionGuardedBy,
  TreasureProtectionHiddenBy,
} from '../features/treasure/protection/protectionTables';
import type { TreasureWithoutMonster } from '../features/treasure/treasure/treasureTable';
import type { TreasureIounStoneType } from '../features/treasure/miscMagicE3/miscMagicE3Subtables';
import type { TreasureNecklacePrayerBead } from '../features/treasure/miscMagicE4/miscMagicE4Subtables';
import type {
  RobeOfUsefulItemsBasePatchType,
  RobeOfUsefulItemsExtraPatch,
} from '../features/treasure/miscMagicE5/miscMagicE5Subtables';
import type { TreasureMiscWeapon } from '../features/treasure/miscWeapons/miscWeaponsTable';

export type TreasureBeakerPotionDetails = {
  potion: TreasurePotion;
  animalControl?: TreasurePotionAnimalControl;
  dragonControl?: TreasurePotionDragonControl;
  giantControl?: TreasurePotionGiantControl;
  giantStrength?: TreasurePotionGiantStrength;
  humanControl?: TreasurePotionHumanControl;
  undeadControl?: TreasurePotionUndeadControl;
};

export type TreasureBeakerOfPlentifulPotionsDetails = {
  potions: TreasureBeakerPotionDetails[];
  cadence: 'threeTimesPerWeek' | 'twicePerWeek' | 'oncePerWeek';
};

export type TreasurePotionWaterBreathingDoses = 2 | 4;

export type TreasureJewelryPiece = {
  type: string;
  material: string;
  value: number;
  exceptionalQuality: boolean;
  exceptionalStone: boolean;
};

export type TreasureGemCategoryId =
  | 'ornamental'
  | 'semiPrecious'
  | 'fancy'
  | 'fancyPrecious'
  | 'gem'
  | 'jewel';

export type TreasureGemCategory = {
  id: TreasureGemCategoryId;
  description: string;
  typicalSize: string;
};

export type TreasureGemValueAdjustment =
  | { type: 'unchanged' }
  | { type: 'stepIncrease'; steps: number }
  | { type: 'stepDecrease'; steps: number }
  | { type: 'double' }
  | { type: 'increasePercent'; percent: number }
  | { type: 'decreasePercent'; percent: number };

type TreasureGemKindProperty = 'transparent' | 'translucent' | 'opaque';

export type TreasureGemKind = {
  name: string;
  description: string;
  property: TreasureGemKindProperty;
};

export type TreasureGemLot = {
  count: number;
  category: TreasureGemCategory;
  baseValue: number;
  baseValueStep: number;
  finalBaseStep: number;
  size: string;
  value: number;
  adjustment: TreasureGemValueAdjustment;
  kind?: TreasureGemKind;
};

export type TreasureEntry = {
  roll: number;
  command: TreasureWithoutMonster;
  quantity?: number;
  display?: string;
  gems?: TreasureGemLot[];
  jewelry?: TreasureJewelryPiece[];
  magicCategory?: TreasureMagicCategory;
  protection?: {
    type?: TreasureProtectionType;
    guardedBy?: TreasureProtectionGuardedBy;
    hiddenBy?: TreasureProtectionHiddenBy;
  };
};

export type TreasureIounStoneStatus = 'active' | 'duplicate' | 'dead';

type TreasureIounStone = {
  index: number;
  roll: number;
  type: TreasureIounStoneType;
  color: string;
  shape: string;
  effect: string;
  status: TreasureIounStoneStatus;
  duplicateOf?: number;
};

type TreasureNecklacePrayerBeadSpecial = {
  roll: number;
  type: TreasureNecklacePrayerBead;
};

export type TreasureNecklaceOfPrayerBeadsResult = {
  totalBeads: number;
  semiPrecious: number;
  fancy: number;
  specialBeads: TreasureNecklacePrayerBeadSpecial[];
};

export type TreasureIounStonesResult = {
  countRoll: number;
  stones: TreasureIounStone[];
};

type RobeOfUsefulItemsBasePatchResult = {
  type: RobeOfUsefulItemsBasePatchType;
  count: number;
};

type RobeOfUsefulItemsExtraPatchResult = {
  roll: number;
  item: Exclude<
    RobeOfUsefulItemsExtraPatch,
    RobeOfUsefulItemsExtraPatch.RollTwiceMore
  >;
};

export type RobeOfUsefulItemsResult = {
  basePatches: RobeOfUsefulItemsBasePatchResult[];
  extraPatchCountRolls: number[];
  requestedExtraPatchCount: number;
  extraPatches: RobeOfUsefulItemsExtraPatchResult[];
};

export type TreasureMiscWeaponResult = {
  item: TreasureMiscWeapon;
  quantity?: number;
};
