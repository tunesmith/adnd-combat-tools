import type { DungeonTableDefinition, DetailRenderer } from '../types';
import { wrapResolver } from '../shared';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  resolveChamberDimensions,
  resolveChamberRoomContents,
  resolveChamberRoomStairs,
  resolveCircularContents,
  resolveCircularMagicPool,
  resolveCircularPool,
  resolvePoolAlignment,
  resolveRoomDimensions,
  resolveTransporterLocation,
  resolveTransmuteType,
  resolveTreasure,
  resolveTreasureSwords,
  resolveTreasureSwordAlignment,
  resolveTreasureSwordDragonSlayerColor,
  resolveTreasureSwordExtraordinaryPower,
  resolveTreasureSwordKind,
  resolveTreasureSwordPrimaryAbility,
  resolveTreasureSwordSpecialPurpose,
  resolveTreasureSwordSpecialPurposePower,
  resolveTreasureSwordUnusual,
  resolveUnusualShape,
  resolveUnusualSize,
} from '../../domain/resolvers';
import { ChamberRoomContents } from '../../../tables/dungeon/chamberRoomContents';
import type { TreasureSword } from '../../../tables/dungeon/treasureSwords';
import type { TreasureSwordAlignment } from '../../../tables/dungeon/treasureSwordAlignment';
import { createTreasureMagicContextHandlers } from '../treasure/shared';
import {
  buildChamberDimensionsPreview,
  renderChamberDimensionsCompact,
  renderChamberDimensionsDetail,
} from '../../adapters/render/chamberDimensions';
import {
  buildChamberRoomContentsPreview,
  renderChamberRoomContentsCompact,
  renderChamberRoomContentsDetail,
} from '../../adapters/render/chamberRoomContents';
import {
  buildChamberRoomStairsPreview,
  renderChamberRoomStairsCompact,
  renderChamberRoomStairsDetail,
} from '../../adapters/render/chamberRoomStairs';
import {
  buildCircularContentsPreview,
  renderCircularContentsCompact,
  renderCircularContentsDetail,
} from '../../adapters/render/circularContents';
import {
  buildCircularMagicPoolPreview,
  renderCircularMagicPoolCompact,
  renderCircularMagicPoolDetail,
} from '../../adapters/render/magicPool';
import {
  buildCircularPoolPreview,
  renderCircularPoolCompact,
  renderCircularPoolDetail,
} from '../../adapters/render/circularPools';
import {
  buildPoolAlignmentPreview,
  renderPoolAlignmentCompact,
  renderPoolAlignmentDetail,
} from '../../adapters/render/poolAlignment';
import {
  buildRoomDimensionsPreview,
  renderRoomDimensionsCompactNodes,
  renderRoomDimensionsDetail,
} from '../../adapters/render/roomDimensions';
import {
  buildTransporterLocationPreview,
  renderTransporterLocationCompact,
  renderTransporterLocationDetail,
} from '../../adapters/render/transporterLocation';
import {
  buildTransmuteTypePreview,
  renderTransmuteTypeCompact,
  renderTransmuteTypeDetail,
} from '../../adapters/render/transmuteType';
import {
  buildTreasurePreview,
  renderTreasureCompactNodes,
  renderTreasureDetail,
} from '../../adapters/render/treasure';
import {
  buildTreasureSwordsPreview,
  renderTreasureSwordsCompact,
  renderTreasureSwordsDetail,
  buildTreasureSwordAlignmentChaoticPreview,
  buildTreasureSwordAlignmentLawfulPreview,
  buildTreasureSwordAlignmentPreview,
  buildTreasureSwordDragonSlayerColorPreview,
  buildTreasureSwordExtraordinaryPowerPreview,
  buildTreasureSwordKindPreview,
  buildTreasureSwordPrimaryAbilityPreview,
  buildTreasureSwordSpecialPurposePowerPreview,
  buildTreasureSwordSpecialPurposePreview,
  buildTreasureSwordUnusualPreview,
  renderTreasureSwordAlignmentCompact,
  renderTreasureSwordAlignmentDetail,
  renderTreasureSwordDragonSlayerColorCompact,
  renderTreasureSwordDragonSlayerColorDetail,
  renderTreasureSwordExtraordinaryPowerCompact,
  renderTreasureSwordExtraordinaryPowerDetail,
  renderTreasureSwordKindCompact,
  renderTreasureSwordKindDetail,
  renderTreasureSwordPrimaryAbilityCompact,
  renderTreasureSwordPrimaryAbilityDetail,
  renderTreasureSwordSpecialPurposeCompact,
  renderTreasureSwordSpecialPurposeDetail,
  renderTreasureSwordSpecialPurposePowerCompact,
  renderTreasureSwordSpecialPurposePowerDetail,
  renderTreasureSwordUnusualCompact,
  renderTreasureSwordUnusualDetail,
} from '../../adapters/render/treasureSwords';
import {
  buildUnusualShapePreview,
  renderUnusualShapeCompact,
  renderUnusualShapeDetail,
} from '../../adapters/render/unusualShape';
import {
  buildUnusualSizePreview,
  renderUnusualSizeCompact,
  renderUnusualSizeDetail,
} from '../../adapters/render/unusualSize';

const withoutAppend =
  (
    renderer: (
      node: Parameters<DetailRenderer>[0]
    ) => ReturnType<DetailRenderer>
  ) =>
  (
    node: Parameters<DetailRenderer>[0],
    _append: Parameters<DetailRenderer>[1]
  ) =>
    renderer(node);

type TreasureSwordPrimaryAbilityOptions = Parameters<
  typeof resolveTreasureSwordPrimaryAbility
>[0];

type TreasureSwordExtraordinaryPowerOptions = Parameters<
  typeof resolveTreasureSwordExtraordinaryPower
>[0];

type TreasureSwordAlignmentOptions = Parameters<typeof resolveTreasureSwordAlignment>[0];

const treasureSwordsHandlers = createTreasureMagicContextHandlers(
  resolveTreasureSwords
);

function readDungeonLevelFromId(
  context: unknown,
  id: string,
  fallback: number
): number {
  if (context && typeof context === 'object') {
    const kind = (context as { kind?: unknown }).kind;
    if (kind === 'wandering' && typeof (context as { level?: unknown }).level === 'number') {
      return (context as { level: number }).level;
    }
  }
  const parts = id.split(':');
  if (parts.length >= 2) {
    const parsed = Number(parts[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

function deriveDungeonLevelFromAncestors(
  ancestors: OutcomeEventNode[]
): number | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (ancestor.event.kind === 'periodicCheck') {
      return ancestor.event.level;
    }
    if (ancestor.event.kind === 'doorBeyond') {
      const doorLevel = ancestor.event.level;
      if (typeof doorLevel === 'number') {
        return doorLevel;
      }
    }
  }
  return undefined;
}

function readChamberDimensionsContext(
  context: unknown
): { forcedContents?: ChamberRoomContents; level?: number } | undefined {
  if (!context || typeof context !== 'object') return undefined;
  const kind = (context as { kind?: unknown }).kind;
  if (kind !== 'chamberDimensions') return undefined;
  const forced = (context as { forcedContents?: unknown }).forcedContents;
  const levelValue = (context as { level?: unknown }).level;
  const result: {
    forcedContents?: ChamberRoomContents;
    level?: number;
  } = {};
  if (typeof forced === 'number') {
    const numeric = forced;
    if (
      numeric >= ChamberRoomContents.Empty &&
      numeric <= ChamberRoomContents.Treasure
    ) {
      result.forcedContents = numeric as ChamberRoomContents;
    }
  }
  if (typeof levelValue === 'number' && Number.isFinite(levelValue)) {
    result.level = levelValue;
  }
  return result;
}

function readUnusualSizeContext(
  context: unknown
): { extra: number; isRoom?: boolean } | undefined {
  if (!context || typeof context !== 'object') return undefined;
  const kind = (context as { kind?: unknown }).kind;
  if (kind !== 'unusualSize') return undefined;
  const extra = (context as { extra?: unknown }).extra;
  const isRoom = (context as { isRoom?: unknown }).isRoom;
  if (typeof extra !== 'number') return undefined;
  const normalizedIsRoom =
    isRoom === undefined || typeof isRoom === 'boolean'
      ? isRoom
      : undefined;
  return { extra, isRoom: normalizedIsRoom };
}

function findSwordFromAncestors(
  ancestors: OutcomeEventNode[]
): TreasureSword | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor || ancestor.type !== 'event') continue;
    if (ancestor.event.kind === 'treasureSwords') {
      return ancestor.event.result;
    }
  }
  return undefined;
}

function readTreasureSwordContext(
  context: unknown,
  ancestors: OutcomeEventNode[]
): {
  sword?: TreasureSword;
  rollIndex?: number;
  alignmentRoll?: number;
  languageRolls?: number[];
  primaryAbilityRolls?: number[];
  extraordinaryPowerRolls?: number[];
  dragonSlayerColorRoll?: number;
} {
  if (
    context &&
    typeof context === 'object' &&
    (context as { kind?: unknown }).kind === 'treasureSword'
  ) {
    const swordValue = (context as { sword?: unknown }).sword;
    const rollIndexValue = (context as { rollIndex?: unknown }).rollIndex;
    const alignmentRollValue = (context as { alignmentRoll?: unknown })
      .alignmentRoll;
    const languageRollsValue = (context as { languageRolls?: unknown })
      .languageRolls;
    const primaryAbilityRollsValue = (
      context as { primaryAbilityRolls?: unknown }
    ).primaryAbilityRolls;
    const extraordinaryPowerRollsValue = (
      context as { extraordinaryPowerRolls?: unknown }
    ).extraordinaryPowerRolls;
    const dragonSlayerColorRollValue = (
      context as { dragonSlayerColorRoll?: unknown }
    ).dragonSlayerColorRoll;
    return {
      sword:
        typeof swordValue === 'number'
          ? (swordValue as TreasureSword)
          : findSwordFromAncestors(ancestors),
      rollIndex:
        typeof rollIndexValue === 'number' ? rollIndexValue : undefined,
      alignmentRoll:
        typeof alignmentRollValue === 'number' ? alignmentRollValue : undefined,
      languageRolls: Array.isArray(languageRollsValue)
        ? [...(languageRollsValue as number[])]
        : undefined,
      primaryAbilityRolls: Array.isArray(primaryAbilityRollsValue)
        ? [...(primaryAbilityRollsValue as number[])]
        : undefined,
      extraordinaryPowerRolls: Array.isArray(extraordinaryPowerRollsValue)
        ? [...(extraordinaryPowerRollsValue as number[])]
        : undefined,
      dragonSlayerColorRoll:
        typeof dragonSlayerColorRollValue === 'number'
          ? dragonSlayerColorRollValue
          : undefined,
    };
  }
  return { sword: findSwordFromAncestors(ancestors) };
}

function readSwordPrimaryAbilityContext(context: unknown): {
  slotKey?: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
} {
  if (!context || typeof context !== 'object') {
    return {};
  }
  const candidate = context as {
    slotKey?: unknown;
    rollIndex?: unknown;
    tableVariant?: unknown;
    ignoreHigh?: unknown;
  };
  const slotKey =
    typeof candidate.slotKey === 'string' ? candidate.slotKey : undefined;
  const rollIndex =
    typeof candidate.rollIndex === 'number' ? candidate.rollIndex : undefined;
  let tableVariant: 'standard' | 'restricted' | undefined;
  if (
    candidate.tableVariant === 'restricted' ||
    candidate.ignoreHigh === true
  ) {
    tableVariant = 'restricted';
  } else if (candidate.tableVariant === 'standard') {
    tableVariant = 'standard';
  }
  return { slotKey, rollIndex, tableVariant };
}

function readSwordExtraordinaryPowerContext(context: unknown): {
  slotKey?: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
  alignment?: TreasureSwordAlignment;
} {
  if (!context || typeof context !== 'object') {
    return {};
  }
  const candidate = context as {
    slotKey?: unknown;
    rollIndex?: unknown;
    tableVariant?: unknown;
    ignoreHigh?: unknown;
    alignment?: unknown;
  };
  const slotKey =
    typeof candidate.slotKey === 'string' ? candidate.slotKey : undefined;
  const rollIndex =
    typeof candidate.rollIndex === 'number' ? candidate.rollIndex : undefined;
  let tableVariant: 'standard' | 'restricted' | undefined;
  if (
    candidate.tableVariant === 'restricted' ||
    candidate.ignoreHigh === true
  ) {
    tableVariant = 'restricted';
  } else if (candidate.tableVariant === 'standard') {
    tableVariant = 'standard';
  }
  const alignment =
    typeof candidate.alignment === 'number'
      ? (candidate.alignment as TreasureSwordAlignment)
      : undefined;
  return { slotKey, rollIndex, tableVariant, alignment };
}

const resolveTreasureSwordPrimaryAbilityRestricted = (
  options?: TreasureSwordPrimaryAbilityOptions
) =>
  resolveTreasureSwordPrimaryAbility({
    ...(options ?? {}),
    tableVariant: 'restricted',
  });

const resolveTreasureSwordExtraordinaryPowerRestricted = (
  options?: TreasureSwordExtraordinaryPowerOptions
) =>
  resolveTreasureSwordExtraordinaryPower({
    ...(options ?? {}),
    tableVariant: 'restricted',
  });

const resolveTreasureSwordAlignmentChaotic = (
  options?: TreasureSwordAlignmentOptions
) =>
  resolveTreasureSwordAlignment({
    ...(options ?? {}),
    variant: 'chaotic',
  });

const resolveTreasureSwordAlignmentLawful = (
  options?: TreasureSwordAlignmentOptions
) =>
  resolveTreasureSwordAlignment({
    ...(options ?? {}),
    variant: 'lawful',
  });

export const BASE_TABLE_DEFINITIONS: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'roomDimensions',
    heading: 'Room Dimensions',
    resolver: wrapResolver(resolveRoomDimensions),
    renderers: {
      renderDetail: renderRoomDimensionsDetail,
      renderCompact: withoutAppend(renderRoomDimensionsCompactNodes),
    },
    buildPreview: buildRoomDimensionsPreview,
    registry: ({ roll, context }) => {
      const level =
        context && context.kind === 'chamberDimensions' && context.level !== undefined
          ? context.level
          : 1;
      return resolveRoomDimensions({ roll, level });
    },
    resolvePending: (pending) => {
      const level =
        pending.context &&
        typeof pending.context === 'object' &&
        (pending.context as { kind?: unknown }).kind === 'chamberDimensions' &&
        typeof (pending.context as { level?: unknown }).level === 'number'
          ? (pending.context as { level: number }).level
          : 1;
      return resolveRoomDimensions({ level });
    },
  },
  {
    id: 'chamberDimensions',
    heading: 'Chamber Dimensions',
    resolver: wrapResolver(resolveChamberDimensions),
    renderers: {
      renderDetail: renderChamberDimensionsDetail,
      renderCompact: withoutAppend(renderChamberDimensionsCompact),
    },
    buildPreview: buildChamberDimensionsPreview,
    registry: ({ roll, context }) => {
      const parsed = readChamberDimensionsContext(context);
      const forcedContents = parsed?.forcedContents;
      const level = parsed?.level;
      const hasContext = forcedContents !== undefined || level !== undefined;
      return resolveChamberDimensions({
        roll,
        context: hasContext ? { forcedContents, level } : undefined,
      });
    },
    resolvePending: (pending, ancestors) => {
      const parsed = readChamberDimensionsContext(pending.context);
      const derivedLevel = deriveDungeonLevelFromAncestors(ancestors);
      const level = parsed?.level !== undefined ? parsed.level : derivedLevel;
      const forcedContents = parsed?.forcedContents;
      const hasContext = forcedContents !== undefined || level !== undefined;
      return resolveChamberDimensions(
        hasContext ? { context: { forcedContents, level } } : undefined
      );
    },
  },
  {
    id: 'chamberRoomContents',
    heading: 'Contents',
    resolver: wrapResolver(resolveChamberRoomContents),
    renderers: {
      renderDetail: renderChamberRoomContentsDetail,
      renderCompact: renderChamberRoomContentsCompact,
    },
    buildPreview: buildChamberRoomContentsPreview,
    registry: ({ roll, context, id }) => {
      const level =
        context && context.kind === 'chamberContents'
          ? context.level
          : readDungeonLevelFromId(context, id, 1);
      return resolveChamberRoomContents({ roll, level });
    },
    resolvePending: (pending, ancestors) => {
      const contextLevel =
        pending.context &&
        typeof pending.context === 'object' &&
        (pending.context as { kind?: unknown }).kind === 'chamberContents' &&
        typeof (pending.context as { level?: unknown }).level === 'number'
          ? (pending.context as { level: number }).level
          : undefined;
      const derivedLevel = deriveDungeonLevelFromAncestors(ancestors);
      const level = contextLevel ?? derivedLevel ?? 1;
      return resolveChamberRoomContents({ level });
    },
  },
  {
    id: 'chamberRoomStairs',
    heading: 'Stairway',
    resolver: wrapResolver(resolveChamberRoomStairs),
    renderers: {
      renderDetail: renderChamberRoomStairsDetail,
      renderCompact: withoutAppend(renderChamberRoomStairsCompact),
    },
    buildPreview: buildChamberRoomStairsPreview,
    resolvePending: () => resolveChamberRoomStairs({}),
  },
  {
    id: 'unusualShape',
    heading: 'Unusual Shape',
    resolver: wrapResolver(resolveUnusualShape),
    renderers: {
      renderDetail: renderUnusualShapeDetail,
      renderCompact: withoutAppend(renderUnusualShapeCompact),
    },
    buildPreview: buildUnusualShapePreview,
    resolvePending: () => resolveUnusualShape({}),
  },
  {
    id: 'unusualSize',
    heading: 'Unusual Size',
    resolver: wrapResolver(resolveUnusualSize),
    renderers: {
      renderDetail: renderUnusualSizeDetail,
      renderCompact: withoutAppend(renderUnusualSizeCompact),
    },
    buildPreview: buildUnusualSizePreview,
    registry: ({ roll, context }) => {
      const parsed = readUnusualSizeContext(context);
      const extra = parsed?.extra ?? 0;
      const isRoom = parsed?.isRoom;
      return resolveUnusualSize({ roll, extra, isRoom });
    },
    resolvePending: (pending) => {
      const parsed = readUnusualSizeContext(pending.context);
      return resolveUnusualSize({
        extra: parsed?.extra,
        isRoom: parsed?.isRoom,
      });
    },
  },
  {
    id: 'treasure',
    heading: 'Treasure',
    resolver: wrapResolver(resolveTreasure),
    renderers: {
      renderDetail: renderTreasureDetail,
      renderCompact: withoutAppend(renderTreasureCompactNodes),
    },
    buildPreview: buildTreasurePreview,
    registry: ({ roll, context }) => {
      const ctx = context && context.kind === 'treasure' ? context : undefined;
      return resolveTreasure({
        roll,
        level: ctx?.level ?? 1,
        withMonster: ctx?.withMonster ?? false,
        rollIndex: ctx?.rollIndex,
        totalRolls: ctx?.totalRolls,
      });
    },
    resolvePending: (pending, ancestors) => {
      const raw = pending.context;
      const ctx =
        raw &&
        typeof raw === 'object' &&
        (raw as { kind?: unknown }).kind === 'treasure'
          ? (raw as {
              level?: unknown;
              withMonster?: unknown;
              rollIndex?: unknown;
              totalRolls?: unknown;
            })
          : undefined;
      const level =
        (ctx && typeof ctx.level === 'number' ? ctx.level : undefined) ??
        deriveDungeonLevelFromAncestors(ancestors) ??
        1;
      const withMonster =
        ctx && typeof ctx.withMonster === 'boolean' ? ctx.withMonster : false;
      const rollIndex =
        ctx && typeof ctx.rollIndex === 'number' ? ctx.rollIndex : undefined;
      const totalRolls =
        ctx && typeof ctx.totalRolls === 'number' ? ctx.totalRolls : undefined;
      return resolveTreasure({ level, withMonster, rollIndex, totalRolls });
    },
  },
  {
    id: 'treasureSwords',
    heading: 'Swords (Table G)',
    resolver: wrapResolver(resolveTreasureSwords),
    renderers: {
      renderDetail: renderTreasureSwordsDetail,
      renderCompact: renderTreasureSwordsCompact,
    },
    buildPreview: buildTreasureSwordsPreview,
    ...treasureSwordsHandlers,
  },
  {
    id: 'treasureSwordKind',
    heading: 'Sword Type',
    resolver: wrapResolver(resolveTreasureSwordKind),
    renderers: {
      renderDetail: renderTreasureSwordKindDetail,
      renderCompact: renderTreasureSwordKindCompact,
    },
    buildPreview: buildTreasureSwordKindPreview,
    resolvePending: () => resolveTreasureSwordKind({}),
  },
  {
    id: 'treasureSwordUnusual',
    heading: 'Sword Unusual Traits',
    resolver: wrapResolver(resolveTreasureSwordUnusual),
    renderers: {
      renderDetail: renderTreasureSwordUnusualDetail,
      renderCompact: renderTreasureSwordUnusualCompact,
    },
    buildPreview: buildTreasureSwordUnusualPreview,
    registry: ({ roll, context }) => {
      let sword: TreasureSword | undefined;
      let rollIndex: number | undefined;
      let languageRolls: number[] | undefined;
      let primaryAbilityRolls: number[] | undefined;
      let extraordinaryPowerRolls: number[] | undefined;
      let dragonSlayerColorRoll: number | undefined;
      if (context && typeof context === 'object') {
        const candidate = context as {
          sword?: unknown;
          rollIndex?: unknown;
          languageRolls?: unknown;
          primaryAbilityRolls?: unknown;
          extraordinaryPowerRolls?: unknown;
          dragonSlayerColorRoll?: unknown;
        };
        if (typeof candidate.sword === 'number') {
          sword = candidate.sword as TreasureSword;
        }
        if (typeof candidate.rollIndex === 'number') {
          rollIndex = candidate.rollIndex;
        }
        if (Array.isArray(candidate.languageRolls)) {
          languageRolls = [...candidate.languageRolls];
        }
        if (Array.isArray(candidate.primaryAbilityRolls)) {
          primaryAbilityRolls = [...candidate.primaryAbilityRolls];
        }
        if (Array.isArray(candidate.extraordinaryPowerRolls)) {
          extraordinaryPowerRolls = [...candidate.extraordinaryPowerRolls];
        }
        if (typeof candidate.dragonSlayerColorRoll === 'number') {
          dragonSlayerColorRoll = candidate.dragonSlayerColorRoll;
        }
      }
      return resolveTreasureSwordUnusual({
        roll,
        sword,
        rollIndex,
        languageRolls,
        primaryAbilityRolls,
        extraordinaryPowerRolls,
        dragonSlayerColorRoll,
      });
    },
    resolvePending: (pending, ancestors) => {
      const options = readTreasureSwordContext(pending.context, ancestors);
      return resolveTreasureSwordUnusual(options);
    },
  },
  {
    id: 'treasureSwordPrimaryAbility',
    heading: 'Primary Ability',
    resolver: wrapResolver(resolveTreasureSwordPrimaryAbility),
    renderers: {
      renderDetail: renderTreasureSwordPrimaryAbilityDetail,
      renderCompact: renderTreasureSwordPrimaryAbilityCompact,
    },
    buildPreview: buildTreasureSwordPrimaryAbilityPreview,
    registry: ({ roll, context }) => {
      const parsed = readSwordPrimaryAbilityContext(context);
      return resolveTreasureSwordPrimaryAbility({
        roll,
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: parsed.tableVariant ?? 'standard',
      });
    },
    resolvePending: (pending) => {
      const parsed = readSwordPrimaryAbilityContext(pending.context);
      return resolveTreasureSwordPrimaryAbility({
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: parsed.tableVariant ?? 'standard',
      });
    },
  },
  {
    id: 'treasureSwordPrimaryAbilityRestricted',
    heading: 'Primary Ability (01-92)',
    resolver: wrapResolver(resolveTreasureSwordPrimaryAbilityRestricted),
    renderers: {
      renderDetail: renderTreasureSwordPrimaryAbilityDetail,
      renderCompact: renderTreasureSwordPrimaryAbilityCompact,
    },
    buildPreview: buildTreasureSwordPrimaryAbilityPreview,
    registry: ({ roll, context }) => {
      const parsed = readSwordPrimaryAbilityContext(context);
      return resolveTreasureSwordPrimaryAbility({
        roll,
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: 'restricted',
      });
    },
    resolvePending: (pending) => {
      const parsed = readSwordPrimaryAbilityContext(pending.context);
      return resolveTreasureSwordPrimaryAbility({
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: 'restricted',
      });
    },
  },
  {
    id: 'treasureSwordExtraordinaryPower',
    heading: 'Extraordinary Power',
    resolver: wrapResolver(resolveTreasureSwordExtraordinaryPower),
    renderers: {
      renderDetail: renderTreasureSwordExtraordinaryPowerDetail,
      renderCompact: renderTreasureSwordExtraordinaryPowerCompact,
    },
    buildPreview: buildTreasureSwordExtraordinaryPowerPreview,
    registry: ({ roll, context }) => {
      const parsed = readSwordExtraordinaryPowerContext(context);
      return resolveTreasureSwordExtraordinaryPower({
        roll,
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: parsed.tableVariant ?? 'standard',
        alignment: parsed.alignment,
      });
    },
  },
  {
    id: 'treasureSwordExtraordinaryPowerRestricted',
    heading: 'Extraordinary Power (01-97)',
    resolver: wrapResolver(resolveTreasureSwordExtraordinaryPowerRestricted),
    renderers: {
      renderDetail: renderTreasureSwordExtraordinaryPowerDetail,
      renderCompact: renderTreasureSwordExtraordinaryPowerCompact,
    },
    buildPreview: buildTreasureSwordExtraordinaryPowerPreview,
    registry: ({ roll, context }) => {
      const parsed = readSwordExtraordinaryPowerContext(context);
      return resolveTreasureSwordExtraordinaryPower({
        roll,
        slotKey: parsed.slotKey,
        rollIndex: parsed.rollIndex,
        tableVariant: 'restricted',
        alignment: parsed.alignment,
      });
    },
  },
  {
    id: 'treasureSwordDragonSlayerColor',
    heading: 'Dragon Slayer Target',
    resolver: wrapResolver(resolveTreasureSwordDragonSlayerColor),
    renderers: {
      renderDetail: renderTreasureSwordDragonSlayerColorDetail,
      renderCompact: renderTreasureSwordDragonSlayerColorCompact,
    },
    buildPreview: buildTreasureSwordDragonSlayerColorPreview,
    registry: ({ roll, context }) => {
      const parsed =
        context && typeof context === 'object'
          ? (context as {
              slotKey?: unknown;
              rollIndex?: unknown;
              alignment?: unknown;
            })
          : {};
      const slotKey =
        typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
      const rollIndex =
        typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
      const alignment =
        typeof parsed.alignment === 'number'
          ? (parsed.alignment as TreasureSwordAlignment)
          : undefined;
      return resolveTreasureSwordDragonSlayerColor({
        roll,
        slotKey,
        rollIndex,
        alignment,
      });
    },
  },
  {
    id: 'treasureSwordSpecialPurpose',
    heading: 'Sword Special Purpose',
    resolver: wrapResolver(resolveTreasureSwordSpecialPurpose),
    renderers: {
      renderDetail: renderTreasureSwordSpecialPurposeDetail,
      renderCompact: renderTreasureSwordSpecialPurposeCompact,
    },
    buildPreview: buildTreasureSwordSpecialPurposePreview,
    registry: ({ roll, context }) => {
      const parsed =
        context && typeof context === 'object'
          ? (context as {
              slotKey?: unknown;
              rollIndex?: unknown;
              parentSlotKey?: unknown;
              alignment?: unknown;
            })
          : {};
      const slotKey =
        typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
      const rollIndex =
        typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
      const parentSlotKey =
        typeof parsed.parentSlotKey === 'string'
          ? parsed.parentSlotKey
          : undefined;
      const alignment =
        typeof parsed.alignment === 'number'
          ? (parsed.alignment as TreasureSwordAlignment)
          : undefined;
      return resolveTreasureSwordSpecialPurpose({
        roll,
        slotKey,
        rollIndex,
        parentSlotKey,
        alignment,
      });
    },
  },
  {
    id: 'treasureSwordSpecialPurposePower',
    heading: 'Sword Special Purpose Power',
    resolver: wrapResolver(resolveTreasureSwordSpecialPurposePower),
    renderers: {
      renderDetail: renderTreasureSwordSpecialPurposePowerDetail,
      renderCompact: renderTreasureSwordSpecialPurposePowerCompact,
    },
    buildPreview: buildTreasureSwordSpecialPurposePowerPreview,
    registry: ({ roll, context }) => {
      const parsed =
        context && typeof context === 'object'
          ? (context as {
              slotKey?: unknown;
              rollIndex?: unknown;
              parentSlotKey?: unknown;
              alignment?: unknown;
            })
          : {};
      const slotKey =
        typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
      const rollIndex =
        typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
      const parentSlotKey =
        typeof parsed.parentSlotKey === 'string'
          ? parsed.parentSlotKey
          : undefined;
      const alignment =
        typeof parsed.alignment === 'number'
          ? (parsed.alignment as TreasureSwordAlignment)
          : undefined;
      return resolveTreasureSwordSpecialPurposePower({
        roll,
        slotKey,
        rollIndex,
        parentSlotKey,
        alignment,
      });
    },
  },
  {
    id: 'treasureSwordAlignment',
    heading: 'Sword Alignment',
    resolver: wrapResolver(resolveTreasureSwordAlignment),
    renderers: {
      renderDetail: renderTreasureSwordAlignmentDetail,
      renderCompact: renderTreasureSwordAlignmentCompact,
    },
    buildPreview: buildTreasureSwordAlignmentPreview,
    resolvePending: () => resolveTreasureSwordAlignment({ variant: 'standard' }),
  },
  {
    id: 'treasureSwordAlignmentChaotic',
    heading: 'Sword Alignment (Chaotic)',
    resolver: wrapResolver(resolveTreasureSwordAlignmentChaotic),
    renderers: {
      renderDetail: renderTreasureSwordAlignmentDetail,
      renderCompact: renderTreasureSwordAlignmentCompact,
    },
    buildPreview: buildTreasureSwordAlignmentChaoticPreview,
    resolvePending: () => resolveTreasureSwordAlignment({ variant: 'chaotic' }),
  },
  {
    id: 'treasureSwordAlignmentLawful',
    heading: 'Sword Alignment (Lawful)',
    resolver: wrapResolver(resolveTreasureSwordAlignmentLawful),
    renderers: {
      renderDetail: renderTreasureSwordAlignmentDetail,
      renderCompact: renderTreasureSwordAlignmentCompact,
    },
    buildPreview: buildTreasureSwordAlignmentLawfulPreview,
    resolvePending: () => resolveTreasureSwordAlignment({ variant: 'lawful' }),
  },
  {
    id: 'circularContents',
    heading: 'Circular Contents',
    resolver: wrapResolver(resolveCircularContents),
    renderers: {
      renderDetail: renderCircularContentsDetail,
      renderCompact: renderCircularContentsCompact,
    },
    buildPreview: buildCircularContentsPreview,
    resolvePending: () => resolveCircularContents({}),
  },
  {
    id: 'circularPool',
    heading: 'Pool',
    resolver: wrapResolver(resolveCircularPool),
    renderers: {
      renderDetail: renderCircularPoolDetail,
      renderCompact: renderCircularPoolCompact,
    },
    buildPreview: buildCircularPoolPreview,
    resolvePending: (_pending, ancestors) => {
      const level = deriveDungeonLevelFromAncestors(ancestors) ?? 1;
      return resolveCircularPool({ level });
    },
  },
  {
    id: 'circularMagicPool',
    heading: 'Magic Pool Effect',
    resolver: wrapResolver(resolveCircularMagicPool),
    renderers: {
      renderDetail: renderCircularMagicPoolDetail,
      renderCompact: renderCircularMagicPoolCompact,
    },
    buildPreview: buildCircularMagicPoolPreview,
    resolvePending: () => resolveCircularMagicPool({}),
  },
  {
    id: 'transmuteType',
    heading: 'Transmutation Type',
    resolver: wrapResolver(resolveTransmuteType),
    renderers: {
      renderDetail: renderTransmuteTypeDetail,
      renderCompact: withoutAppend(renderTransmuteTypeCompact),
    },
    buildPreview: buildTransmuteTypePreview,
    resolvePending: () => resolveTransmuteType({}),
  },
  {
    id: 'poolAlignment',
    heading: 'Pool Alignment',
    resolver: wrapResolver(resolvePoolAlignment),
    renderers: {
      renderDetail: renderPoolAlignmentDetail,
      renderCompact: withoutAppend(renderPoolAlignmentCompact),
    },
    buildPreview: buildPoolAlignmentPreview,
    resolvePending: () => resolvePoolAlignment({}),
  },
  {
    id: 'transporterLocation',
    heading: 'Transporter Location',
    resolver: wrapResolver(resolveTransporterLocation),
    renderers: {
      renderDetail: renderTransporterLocationDetail,
      renderCompact: withoutAppend(renderTransporterLocationCompact),
    },
    buildPreview: buildTransporterLocationPreview,
    resolvePending: () => resolveTransporterLocation({}),
  },
];
