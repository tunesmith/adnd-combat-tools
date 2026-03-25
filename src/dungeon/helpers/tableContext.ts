import type { TableContext } from '../../types/dungeon';

type TableContextKind = TableContext['kind'];
type TableContextOf<K extends TableContextKind> = Extract<
  TableContext,
  { kind: K }
>;
type TableContextCandidate = {
  kind?: unknown;
  length?: unknown;
  width?: unknown;
  isRoom?: unknown;
  existing?: unknown;
  level?: unknown;
  extra?: unknown;
  exitType?: unknown;
  index?: unknown;
  total?: unknown;
  origin?: unknown;
  forcedContents?: unknown;
  withMonster?: unknown;
  rollIndex?: unknown;
  totalRolls?: unknown;
  treasureRoll?: unknown;
  sword?: unknown;
  alignmentRoll?: unknown;
  languageRolls?: unknown;
  primaryAbilityRolls?: unknown;
  extraordinaryPowerRolls?: unknown;
  dragonSlayerColorRoll?: unknown;
  luckBladeWishes?: unknown;
  variant?: unknown;
  slotKey?: unknown;
  tableVariant?: unknown;
  ignoreHigh?: unknown;
  alignment?: unknown;
  parentSlotKey?: unknown;
  alignmentReady?: unknown;
};
type TableContextValidator<K extends TableContextKind> = (
  context: TableContextCandidate
) => context is TableContextOf<K>;

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === 'number';
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === 'boolean';
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isOptionalNumberArray(value: unknown): value is number[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((entry) => typeof entry === 'number'))
  );
}

function isExitType(value: unknown): value is 'door' | 'passage' {
  return value === 'door' || value === 'passage';
}

function isOrigin(value: unknown): value is 'room' | 'chamber' {
  return value === 'room' || value === 'chamber';
}

function isDoorChainLaterality(value: unknown): value is 'Left' | 'Right' {
  return value === 'Left' || value === 'Right';
}

function isDoorChainLateralityArray(
  value: unknown
): value is TableContextOf<'doorChain'>['existing'] {
  return Array.isArray(value) && value.every(isDoorChainLaterality);
}

function isSwordAlignmentVariant(
  value: unknown
): value is TableContextOf<'treasureSwordAlignment'>['variant'] {
  return value === 'standard' || value === 'chaotic' || value === 'lawful';
}

function isOptionalTableVariant(
  value: unknown
): value is 'standard' | 'restricted' | undefined {
  return value === undefined || value === 'standard' || value === 'restricted';
}

const TABLE_CONTEXT_VALIDATORS: {
  [K in TableContextKind]: TableContextValidator<K>;
} = {
  exits: (context): context is TableContextOf<'exits'> =>
    typeof context.length === 'number' &&
    typeof context.width === 'number' &&
    typeof context.isRoom === 'boolean',
  doorChain: (context): context is TableContextOf<'doorChain'> =>
    isDoorChainLateralityArray(context.existing),
  wandering: (context): context is TableContextOf<'wandering'> =>
    typeof context.level === 'number',
  unusualSize: (context): context is TableContextOf<'unusualSize'> =>
    typeof context.extra === 'number' && isOptionalBoolean(context.isRoom),
  exit: (context): context is TableContextOf<'exit'> =>
    isExitType(context.exitType) &&
    typeof context.index === 'number' &&
    typeof context.total === 'number' &&
    isOrigin(context.origin),
  exitDirection: (context): context is TableContextOf<'exitDirection'> =>
    typeof context.index === 'number' &&
    typeof context.total === 'number' &&
    isOrigin(context.origin),
  exitAlternative: (context): context is TableContextOf<'exitAlternative'> =>
    isExitType(context.exitType),
  chamberDimensions: (
    context
  ): context is TableContextOf<'chamberDimensions'> =>
    isOptionalNumber(context.forcedContents) && isOptionalNumber(context.level),
  chamberContents: (context): context is TableContextOf<'chamberContents'> =>
    typeof context.level === 'number',
  treasure: (context): context is TableContextOf<'treasure'> =>
    typeof context.level === 'number' &&
    typeof context.withMonster === 'boolean' &&
    isOptionalNumber(context.rollIndex) &&
    isOptionalNumber(context.totalRolls),
  treasureProtection: (
    context
  ): context is TableContextOf<'treasureProtection'> =>
    isOptionalNumber(context.treasureRoll),
  treasureContainer: (
    _context
  ): _context is TableContextOf<'treasureContainer'> => true,
  treasureMagic: (context): context is TableContextOf<'treasureMagic'> =>
    typeof context.level === 'number' &&
    typeof context.treasureRoll === 'number' &&
    isOptionalNumber(context.rollIndex),
  treasureSword: (context): context is TableContextOf<'treasureSword'> =>
    typeof context.sword === 'number' &&
    isOptionalNumber(context.rollIndex) &&
    isOptionalNumber(context.alignmentRoll) &&
    isOptionalNumberArray(context.languageRolls) &&
    isOptionalNumberArray(context.primaryAbilityRolls) &&
    isOptionalNumberArray(context.extraordinaryPowerRolls) &&
    isOptionalNumber(context.dragonSlayerColorRoll) &&
    isOptionalNumber(context.luckBladeWishes),
  treasureSwordAlignment: (
    context
  ): context is TableContextOf<'treasureSwordAlignment'> =>
    isSwordAlignmentVariant(context.variant) && isOptionalNumber(context.sword),
  treasureSwordPrimaryAbility: (
    context
  ): context is TableContextOf<'treasureSwordPrimaryAbility'> =>
    isOptionalString(context.slotKey) &&
    isOptionalNumber(context.rollIndex) &&
    isOptionalTableVariant(context.tableVariant) &&
    isOptionalBoolean(context.ignoreHigh),
  treasureSwordExtraordinaryPower: (
    context
  ): context is TableContextOf<'treasureSwordExtraordinaryPower'> =>
    isOptionalString(context.slotKey) &&
    isOptionalNumber(context.rollIndex) &&
    isOptionalTableVariant(context.tableVariant) &&
    isOptionalBoolean(context.ignoreHigh) &&
    isOptionalNumber(context.alignment),
  treasureSwordSpecialPurpose: (
    context
  ): context is TableContextOf<'treasureSwordSpecialPurpose'> =>
    isOptionalString(context.slotKey) &&
    isOptionalNumber(context.rollIndex) &&
    isOptionalString(context.parentSlotKey) &&
    isOptionalNumber(context.alignment) &&
    isOptionalBoolean(context.alignmentReady),
  treasureSwordSpecialPurposePower: (
    context
  ): context is TableContextOf<'treasureSwordSpecialPurposePower'> =>
    isOptionalString(context.slotKey) &&
    isOptionalNumber(context.rollIndex) &&
    isOptionalString(context.parentSlotKey) &&
    isOptionalNumber(context.alignment),
  treasureSwordDragonSlayerColor: (
    context
  ): context is TableContextOf<'treasureSwordDragonSlayerColor'> =>
    isOptionalString(context.slotKey) &&
    isOptionalNumber(context.rollIndex) &&
    isOptionalNumber(context.alignment) &&
    isOptionalBoolean(context.alignmentReady),
};

export function isTableContext(context: unknown): context is TableContext {
  if (!context || typeof context !== 'object') return false;
  const kind = (context as TableContextCandidate).kind;
  if (typeof kind !== 'string') return false;
  const validator = TABLE_CONTEXT_VALIDATORS[kind as TableContextKind];
  if (!validator) return false;
  return validator(context as TableContextCandidate);
}

export function readTableContext(context: unknown): TableContext | undefined {
  return isTableContext(context) ? context : undefined;
}

function isTableContextOfKind<K extends TableContextKind>(
  context: unknown,
  kind: K
): context is TableContextOf<K> {
  const parsed = readTableContext(context);
  return parsed !== undefined && parsed.kind === kind;
}

export function readTableContextOfKind<K extends TableContextKind>(
  context: unknown,
  kind: K
): TableContextOf<K> | undefined {
  return isTableContextOfKind(context, kind) ? context : undefined;
}

export function cloneTableContext(context: TableContext): TableContext {
  switch (context.kind) {
    case 'doorChain':
      return { ...context, existing: [...context.existing] };
    case 'treasureSword':
      return {
        ...context,
        languageRolls: context.languageRolls
          ? [...context.languageRolls]
          : undefined,
        primaryAbilityRolls: context.primaryAbilityRolls
          ? [...context.primaryAbilityRolls]
          : undefined,
        extraordinaryPowerRolls: context.extraordinaryPowerRolls
          ? [...context.extraordinaryPowerRolls]
          : undefined,
      };
    case 'wandering':
    case 'exits':
    case 'unusualSize':
    case 'exit':
    case 'exitDirection':
    case 'exitAlternative':
    case 'chamberDimensions':
    case 'chamberContents':
    case 'treasure':
    case 'treasureProtection':
    case 'treasureContainer':
    case 'treasureMagic':
    case 'treasureSwordAlignment':
    case 'treasureSwordPrimaryAbility':
    case 'treasureSwordExtraordinaryPower':
    case 'treasureSwordSpecialPurpose':
    case 'treasureSwordSpecialPurposePower':
    case 'treasureSwordDragonSlayerColor':
      return { ...context };
  }
}

export function freezeTableContext(context: TableContext): void {
  switch (context.kind) {
    case 'doorChain':
      Object.freeze(context.existing);
      break;
    case 'treasureSword':
      if (context.languageRolls) Object.freeze(context.languageRolls);
      if (context.primaryAbilityRolls) {
        Object.freeze(context.primaryAbilityRolls);
      }
      if (context.extraordinaryPowerRolls) {
        Object.freeze(context.extraordinaryPowerRolls);
      }
      break;
    default:
      break;
  }
  Object.freeze(context);
}
