import type React from 'react';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
} from '../domain/outcome';
import type { ChamberRoomContents } from '../../tables/dungeon/chamberRoomContents';
import type { TreasureSword } from '../../tables/dungeon/treasureSwords';
import type { TreasureSwordAlignment } from '../../tables/dungeon/treasureSwordAlignment';
import {
  resolveChamberDimensions,
  resolveChamberRoomContents,
  resolveChamberRoomStairs,
  resolveRoomDimensions,
  resolveCircularContents,
  resolveCircularPool,
  resolveCircularMagicPool,
  resolveTransmuteType,
  resolvePoolAlignment,
  resolveTransporterLocation,
  resolveUnusualShape,
  resolveUnusualSize,
  resolveTreasure,
  resolveTreasureArmorShields,
  resolveTreasureSwords,
  resolveTreasureSwordAlignment,
  resolveTreasureSwordKind,
  resolveTreasureSwordUnusual,
  resolveTreasureSwordPrimaryAbility,
  resolveTreasureSwordExtraordinaryPower,
  resolveTreasureSwordSpecialPurpose,
  resolveTreasureSwordSpecialPurposePower,
  resolveTreasureSwordDragonSlayerColor,
  resolveTreasureMiscWeapons,
} from '../domain/resolvers';
import { renderDetailTree } from '../adapters/render';
import {
  applyResolvedOutcome,
  deriveDoorChainContext,
  findPendingWithAncestors,
  isTableContext,
  normalizeOutcomeTree,
  propagateSwordAlignmentInfo,
} from './outcomeTree';
import {
  createOutcomeRenderSnapshot,
  type OutcomeRenderSnapshot,
} from './outcomePipeline';
import {
  ALL_REGISTRY_OUTCOMES,
  ALL_TABLE_HEADINGS,
  ALL_TABLE_ID_LIST,
  type FeatureTableId,
} from '../features/bundle';
import {
  BASE_TABLE_HEADINGS,
  BASE_TABLE_ID_LIST,
  type BaseTableId,
} from '../features/baseTables/bundle';

// Registry resolver type
type RegistryResolution = {
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
};

export type RegistryResolver = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
  doorChain?: {
    existing: DoorChainLaterality[];
    sequence: number;
  };
}) => RegistryResolution;

export type TableId = FeatureTableId | BaseTableId;

const TABLE_ID_LIST: ReadonlyArray<TableId> = [
  ...ALL_TABLE_ID_LIST,
  ...BASE_TABLE_ID_LIST,
];

function isTableId(x: string): x is TableId {
  return TABLE_ID_LIST.some((tableId) => tableId === x);
}

export const TABLE_HEADINGS: Record<TableId, string> = {
  ...ALL_TABLE_HEADINGS,
  ...BASE_TABLE_HEADINGS,
} as Record<TableId, string>;

function fromOutcome(outcome: DungeonOutcomeNode): RegistryResolution {
  const normalized = normalizeOutcomeTree(outcome);
  const propagated = propagateSwordAlignmentInfo(normalized);
  return { outcome: propagated, messages: renderDetailTree(propagated) };
}

const BASE_TABLE_RESOLVERS: Record<string, RegistryResolver> = {
  roomDimensions: ({ roll, context }) => {
    // Prefer explicit level from context (carried from doorBeyond -> room)
    let level = 1;
    if (context && context.kind === 'chamberDimensions') {
      if (typeof context.level === 'number') level = context.level;
    }
    return fromOutcome(resolveRoomDimensions({ roll, level }));
  },
  chamberDimensions: ({ roll, context }) => {
    let forcedContents: ChamberRoomContents | undefined;
    let forcedLevel: number | undefined;
    if (context && context.kind === 'chamberDimensions') {
      if (typeof context.forcedContents === 'number') {
        forcedContents = context.forcedContents;
      }
      if (typeof context.level === 'number') {
        forcedLevel = context.level;
      }
    }
    return fromOutcome(
      resolveChamberDimensions({
        roll,
        context:
          forcedContents !== undefined || forcedLevel !== undefined
            ? { forcedContents, level: forcedLevel }
            : undefined,
      })
    );
  },
  chamberRoomContents: ({ roll, context, id }) => {
    let level: number;
    if (context && context.kind === 'chamberContents') {
      level = context.level;
    } else {
      level = readDungeonLevel(context, id, 1);
    }
    return fromOutcome(resolveChamberRoomContents({ roll, level }));
  },
  chamberRoomStairs: ({ roll }) =>
    fromOutcome(resolveChamberRoomStairs({ roll })),
  unusualShape: ({ roll }) => fromOutcome(resolveUnusualShape({ roll })),
  unusualSize: ({ roll, context }) => {
    const extra = context && context.kind === 'unusualSize' ? context.extra : 0;
    const isRoom =
      context && context.kind === 'unusualSize' ? context.isRoom : undefined;
    return fromOutcome(resolveUnusualSize({ roll, extra, isRoom }));
  },
  circularContents: ({ roll }) =>
    fromOutcome(resolveCircularContents({ roll })),
  circularPool: ({ roll }) => fromOutcome(resolveCircularPool({ roll })),
  circularMagicPool: ({ roll }) =>
    fromOutcome(resolveCircularMagicPool({ roll })),
  transmuteType: ({ roll }) => fromOutcome(resolveTransmuteType({ roll })),
  poolAlignment: ({ roll }) => fromOutcome(resolvePoolAlignment({ roll })),
  transporterLocation: ({ roll }) =>
    fromOutcome(resolveTransporterLocation({ roll })),
  treasure: ({ roll, context }) => {
    const treasureContext =
      context && context.kind === 'treasure'
        ? {
            level: context.level,
            withMonster: context.withMonster,
            rollIndex: context.rollIndex,
            totalRolls: context.totalRolls,
          }
        : {
            level: 1,
            withMonster: false,
            rollIndex: undefined,
            totalRolls: undefined,
          };
    return fromOutcome(
      resolveTreasure({
        roll,
        level: treasureContext.level,
        withMonster: treasureContext.withMonster,
        rollIndex: treasureContext.rollIndex,
        totalRolls: treasureContext.totalRolls,
      })
    );
  },
  treasureArmorShields: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureArmorShields({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureSwords: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureSwords({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureSwordKind: ({ roll }) =>
    fromOutcome(resolveTreasureSwordKind({ roll })),
  treasureSwordUnusual: ({ roll, context }) => {
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
    return fromOutcome(
      resolveTreasureSwordUnusual({
        roll,
        sword,
        rollIndex,
        languageRolls,
        primaryAbilityRolls,
        extraordinaryPowerRolls,
        dragonSlayerColorRoll,
      })
    );
  },
  treasureSwordPrimaryAbility: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            tableVariant?: unknown;
            ignoreHigh?: unknown;
            rollIndex?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    let tableVariant: 'standard' | 'restricted' = 'standard';
    if (parsed.tableVariant === 'restricted') {
      tableVariant = 'restricted';
    } else if (parsed.ignoreHigh === true) {
      tableVariant = 'restricted';
    }
    return fromOutcome(
      resolveTreasureSwordPrimaryAbility({
        roll,
        slotKey,
        rollIndex,
        tableVariant,
      })
    );
  },
  treasureSwordPrimaryAbilityRestricted: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            rollIndex?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    return fromOutcome(
      resolveTreasureSwordPrimaryAbility({
        roll,
        slotKey,
        rollIndex,
        tableVariant: 'restricted',
      })
    );
  },
  treasureSwordExtraordinaryPower: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            tableVariant?: unknown;
            ignoreHigh?: unknown;
            rollIndex?: unknown;
            alignment?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    let tableVariant: 'standard' | 'restricted' = 'standard';
    if (parsed.tableVariant === 'restricted') {
      tableVariant = 'restricted';
    } else if (parsed.ignoreHigh === true) {
      tableVariant = 'restricted';
    }
    const alignment =
      typeof parsed.alignment === 'number'
        ? (parsed.alignment as TreasureSwordAlignment)
        : undefined;
    return fromOutcome(
      resolveTreasureSwordExtraordinaryPower({
        roll,
        slotKey,
        rollIndex,
        tableVariant,
        alignment,
      })
    );
  },
  treasureSwordExtraordinaryPowerRestricted: ({ roll, context }) => {
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
    return fromOutcome(
      resolveTreasureSwordExtraordinaryPower({
        roll,
        slotKey,
        rollIndex,
        tableVariant: 'restricted',
        alignment,
      })
    );
  },
  treasureSwordDragonSlayerColor: ({ roll, context }) => {
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
    return fromOutcome(
      resolveTreasureSwordDragonSlayerColor({
        roll,
        slotKey,
        rollIndex,
        alignment,
      })
    );
  },
  treasureSwordSpecialPurpose: ({ roll, context }) => {
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
    const parentSlotKey: string | undefined =
      typeof parsed.parentSlotKey === 'string'
        ? parsed.parentSlotKey
        : undefined;
    const alignment: TreasureSwordAlignment | undefined =
      typeof parsed.alignment === 'number' ? parsed.alignment : undefined;
    return fromOutcome(
      resolveTreasureSwordSpecialPurpose({
        roll,
        slotKey,
        rollIndex,
        parentSlotKey,
        alignment,
      })
    );
  },
  treasureSwordSpecialPurposePower: ({ roll, context }) => {
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
    const parentSlotKey: string | undefined =
      typeof parsed.parentSlotKey === 'string'
        ? parsed.parentSlotKey
        : undefined;
    const alignment: TreasureSwordAlignment | undefined =
      typeof parsed.alignment === 'number' ? parsed.alignment : undefined;
    return fromOutcome(
      resolveTreasureSwordSpecialPurposePower({
        roll,
        slotKey,
        rollIndex,
        parentSlotKey,
        alignment,
      })
    );
  },
  treasureSwordAlignment: ({ roll }) =>
    fromOutcome(resolveTreasureSwordAlignment({ roll, variant: 'standard' })),
  treasureSwordAlignmentChaotic: ({ roll }) =>
    fromOutcome(resolveTreasureSwordAlignment({ roll, variant: 'chaotic' })),
  treasureSwordAlignmentLawful: ({ roll }) =>
    fromOutcome(resolveTreasureSwordAlignment({ roll, variant: 'lawful' })),
  treasureMiscWeapons: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureMiscWeapons({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
};

const FEATURE_TABLE_RESOLVERS: Record<string, RegistryResolver> =
  Object.fromEntries(
    Object.entries(ALL_REGISTRY_OUTCOMES).map(([id, buildOutcome]) => [
      id,
      (opts) => fromOutcome(buildOutcome(opts)),
    ])
  );

export const TABLE_RESOLVERS: Record<TableId, RegistryResolver> = {
  ...FEATURE_TABLE_RESOLVERS,
  ...BASE_TABLE_RESOLVERS,
} as Record<TableId, RegistryResolver>;

export function resolveRegistryTable(opts: {
  tableId: string;
  roll?: number;
  context?: TableContext;
  outcome?: DungeonOutcomeNode;
  targetId?: string;
}): RegistryResolution | undefined {
  const base = String(opts.tableId.split(':')[0] ?? '');
  if (!isTableId(base)) return undefined;
  const doorChain =
    (base === 'doorLocation' || base === 'periodicCheckDoorOnly') &&
    opts.outcome &&
    opts.targetId
      ? deriveDoorChainContext(opts.outcome, opts.targetId)
      : undefined;
  const resolver = TABLE_RESOLVERS[base];
  if (!resolver) return undefined;
  return resolver({
    roll: opts.roll,
    id: opts.tableId,
    context: opts.context,
    doorChain,
  });
}

export type OutcomeRollApplication = {
  outcome: DungeonOutcomeNode;
  snapshot: OutcomeRenderSnapshot;
};

export function applyOutcomeRoll(opts: {
  outcome: DungeonOutcomeNode;
  tableId: string;
  targetId?: string;
  roll?: number;
  context?: TableContext;
}): OutcomeRollApplication | undefined {
  const normalizedExisting = normalizeOutcomeTree(opts.outcome);
  const targetId = resolvePendingTargetId(
    normalizedExisting,
    opts.tableId,
    opts.targetId ?? opts.tableId,
    opts.context
  );
  const resolution = resolveRegistryTable({
    tableId: opts.tableId,
    roll: opts.roll,
    context: opts.context,
    outcome: normalizedExisting,
    targetId,
  });
  if (!resolution || !resolution.outcome) return undefined;
  const normalizedResolution = normalizeOutcomeTree(
    resolution.outcome,
    targetId
  );
  const applied = applyResolvedOutcome(
    normalizedExisting,
    targetId,
    normalizedResolution
  );
  const normalizedApplied = normalizeOutcomeTree(applied);
  const detailSnapshot = createOutcomeRenderSnapshot(normalizedApplied, {
    autoResolve: false,
  });
  const compactSnapshot = createOutcomeRenderSnapshot(normalizedApplied, {
    autoResolve: false,
  });
  if (!detailSnapshot || !compactSnapshot) return undefined;
  const snapshot: OutcomeRenderSnapshot = {
    normalized: detailSnapshot.normalized,
    compactOutcome: compactSnapshot.compactOutcome,
    detail: detailSnapshot.detail,
    detailResolved: compactSnapshot.detailResolved,
    compact: compactSnapshot.compact,
    pendingCount: detailSnapshot.pendingCount,
    resolvedPendingCount: compactSnapshot.resolvedPendingCount,
  };
  return { outcome: normalizedApplied, snapshot };
}

function resolvePendingTargetId(
  existing: DungeonOutcomeNode,
  tableId: string,
  requestedId: string,
  context?: TableContext
): string {
  const base = String(tableId.split(':')[0] ?? '');
  const exactMatch = findPendingWithAncestors(
    existing,
    (pending) =>
      (pending.id !== undefined && pending.id === requestedId) ||
      (pending.id === undefined && pending.table === requestedId)
  );
  if (exactMatch) return requestedId;
  if (
    base !== 'treasureSwordSpecialPurpose' &&
    base !== 'treasureSwordSpecialPurposePower' &&
    base !== 'treasureSwordDragonSlayerColor'
  ) {
    return requestedId;
  }
  const slotKey = extractSlotKey(base, context, requestedId);
  if (!slotKey) return requestedId;
  const slotMatch = findPendingWithAncestors(existing, (pending) => {
    const pendingBase = String(pending.table.split(':')[0] ?? '');
    if (pendingBase !== base) return false;
    const candidateSlot = readSlotKeyFromContext(base, pending.context);
    return candidateSlot === slotKey;
  });
  if (!slotMatch) return requestedId;
  return slotMatch.pending.id ?? slotMatch.pending.table;
}

function extractSlotKey(
  base: string,
  context: TableContext | undefined,
  requestedId: string
): string | undefined {
  const fromContext = readSlotKeyFromContext(base, context);
  if (fromContext) return fromContext;
  const idx = requestedId.indexOf(':');
  if (idx === -1) return undefined;
  const slot = requestedId.slice(idx + 1);
  return slot.length > 0 ? slot : undefined;
}

function readSlotKeyFromContext(
  base: string,
  context: unknown
): string | undefined {
  if (!isTableContext(context)) return undefined;
  if (
    base === 'treasureSwordSpecialPurpose' &&
    context.kind === 'treasureSwordSpecialPurpose'
  ) {
    if (typeof context.slotKey === 'string') return context.slotKey;
    if (typeof context.parentSlotKey === 'string') return context.parentSlotKey;
    return undefined;
  }
  if (
    base === 'treasureSwordSpecialPurposePower' &&
    context.kind === 'treasureSwordSpecialPurposePower'
  ) {
    if (typeof context.slotKey === 'string') return context.slotKey;
    if (typeof context.parentSlotKey === 'string') return context.parentSlotKey;
    return undefined;
  }
  if (
    base === 'treasureSwordDragonSlayerColor' &&
    context.kind === 'treasureSwordDragonSlayerColor'
  ) {
    if (typeof context.slotKey === 'string') return context.slotKey;
    return undefined;
  }
  return undefined;
}

function readDungeonLevel(
  context: TableContext | undefined,
  id: string,
  fallback: number
): number {
  if (context && context.kind === 'wandering') {
    return context.level;
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

export type FeedLike = {
  id: string;
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
  renderCache?: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
  pendingCount?: number;
};

export function updateResolvedBlock<T extends FeedLike>(
  fi: T,
  feedItemId: string,
  targetId: string,
  messages: DungeonRenderNode[],
  headingText: string
): T {
  if (fi.id !== feedItemId) return fi;
  const newMessages: DungeonRenderNode[] = [];
  let skippingOld = false;
  for (const node of fi.messages) {
    const nodeTargetId =
      node.kind === 'table-preview' ? node.targetId ?? node.id : undefined;
    if (node.kind === 'table-preview' && nodeTargetId === targetId) {
      newMessages.push(node);
      skippingOld = true;
      for (const m of messages) newMessages.push(m);
    } else {
      if (skippingOld) {
        if (node.kind === 'table-preview') {
          const compareId = node.targetId ?? node.id;
          if (compareId !== targetId) {
            skippingOld = false;
          }
        } else if (node.kind === 'heading' && node.text !== headingText) {
          skippingOld = false;
        } else if (node.kind === 'heading' && node.text === headingText) {
          // keep skipping
        } else if (node.kind === 'bullet-list' || node.kind === 'paragraph') {
          // skip
        } else {
          skippingOld = false;
        }
        if (!skippingOld) newMessages.push(node);
      } else {
        newMessages.push(node);
      }
    }
  }
  return { ...fi, messages: newMessages };
}

export function resolveViaRegistry<T extends FeedLike>(
  tp: DungeonTablePreview,
  feedItemId: string,
  usedRoll: number | undefined,
  setFeed?: React.Dispatch<React.SetStateAction<T[]>>,
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
): boolean {
  const base = String(tp.id.split(':')[0] ?? '');
  if (!isTableId(base)) return false;

  const heading = TABLE_HEADINGS[base] ?? base;
  const targetKey = tp.targetId ?? tp.id;
  const keyVariants = collectKeyVariants(targetKey, tp.id);
  let resolved = false;
  const extraKeyVariants = new Set<string>();

  if (setFeed) {
    setFeed((prev) =>
      prev.map((fi) =>
        fi.id !== feedItemId
          ? fi
          : (() => {
              const existingOutcome = fi.outcome;
              if (existingOutcome) {
                const applied = applyOutcomeRoll({
                  outcome: existingOutcome,
                  tableId: tp.id,
                  targetId: targetKey,
                  roll: usedRoll,
                  context: tp.context,
                });
                if (applied) {
                  resolved = true;
                  const { outcome, snapshot } = applied;
                  const previewTargets = collectPreviewTargetsForTable(
                    snapshot.detail,
                    tp.id
                  ).filter((key) => key === targetKey);
                  for (const key of previewTargets) extraKeyVariants.add(key);
                  if (setCollapsed) {
                    setCollapsed((prev) => {
                      const next = { ...prev };
                      for (const k of keyVariants)
                        next[`${feedItemId}:${k}`] = true;
                      for (const k of previewTargets)
                        next[`${feedItemId}:${k}`] = true;
                      return next;
                    });
                  }
                  if (setResolved) {
                    setResolved((prev) => {
                      const next = { ...prev };
                      for (const k of keyVariants)
                        next[`${feedItemId}:${k}`] = true;
                      for (const k of previewTargets)
                        next[`${feedItemId}:${k}`] = true;
                      return next;
                    });
                  }
                  return {
                    ...fi,
                    outcome,
                    pendingCount: snapshot.pendingCount,
                    messages: snapshot.detail,
                    renderCache: {
                      ...fi.renderCache,
                      detail: snapshot.detail,
                      compact: snapshot.compact,
                    },
                  } as T;
                }
              }
              const tableResult = resolveRegistryTable({
                tableId: tp.id,
                roll: usedRoll,
                context: tp.context,
                outcome: fi.outcome,
                targetId: targetKey,
              });
              if (!tableResult) return fi;
              resolved = true;
              const previewTargets = collectPreviewTargetsForTable(
                tableResult.messages,
                tp.id
              ).filter((key) => key === targetKey);
              for (const key of previewTargets) extraKeyVariants.add(key);
              if (setCollapsed) {
                setCollapsed((prev) => {
                  const next = { ...prev };
                  for (const k of keyVariants)
                    next[`${feedItemId}:${k}`] = true;
                  for (const k of previewTargets)
                    next[`${feedItemId}:${k}`] = true;
                  return next;
                });
              }
              if (setResolved) {
                setResolved((prev) => {
                  const next = { ...prev };
                  for (const k of keyVariants)
                    next[`${feedItemId}:${k}`] = true;
                  for (const k of previewTargets)
                    next[`${feedItemId}:${k}`] = true;
                  return next;
                });
              }
              return updateResolvedBlock(
                fi,
                feedItemId,
                targetKey,
                tableResult.messages,
                heading
              );
            })()
      )
    );
  }
  if (!resolved) return false;
  const combinedKeyVariantSet = new Set<string>(keyVariants);
  extraKeyVariants.forEach((key) => {
    combinedKeyVariantSet.add(key);
  });
  const combinedKeyVariants = Array.from(combinedKeyVariantSet);
  if (setCollapsed) {
    setCollapsed((prev) => {
      const next = { ...prev };
      for (const k of combinedKeyVariants) next[`${feedItemId}:${k}`] = true;
      return next;
    });
  }
  if (setResolved) {
    setResolved((prev) => {
      const next = { ...prev };
      for (const k of combinedKeyVariants) next[`${feedItemId}:${k}`] = true;
      return next;
    });
  }
  return true;
}

function collectPreviewTargetsForTable(
  nodes: DungeonRenderNode[] | undefined,
  tableId: string
): string[] {
  if (!nodes) return [];
  const targets = new Set<string>();
  for (const node of nodes) {
    if (node.kind !== 'table-preview') continue;
    if (node.id !== tableId) continue;
    const target =
      node.targetId && node.targetId.length > 0 ? node.targetId : node.id;
    targets.add(target);
  }
  return Array.from(targets);
}

function collectKeyVariants(primary: string, fallbackId?: string): string[] {
  const variants = new Set<string>();
  const add = (k?: string) => {
    if (!k || k.length === 0) return;
    variants.add(k);
    const norm = normalizeKey(k);
    if (norm) variants.add(norm);
  };
  add(primary);
  add(fallbackId);

  return Array.from(variants);
}

function normalizeKey(key: string): string | undefined {
  const idx = key.lastIndexOf(':');
  if (idx === -1) return undefined;
  const tail = key.slice(idx + 1);
  if (/^\d+$/.test(tail)) return key.slice(0, idx);
  return undefined;
}
