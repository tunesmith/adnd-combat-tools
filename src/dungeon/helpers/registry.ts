import type { DungeonRenderNode, TableContext } from '../../types/dungeon';
import {
  getDungeonTablePreviewTargetKey,
  isDungeonTablePreview,
} from '../../types/dungeon';
import type { DoorChainLaterality } from '../domain/navigationOutcome';
import type { DungeonOutcomeNode } from '../domain/outcome';
import { renderDetailTree } from '../adapters/render';
import {
  applyResolvedOutcome,
  deriveDoorChainContext,
  findPendingWithAncestors,
  normalizeOutcomeTree,
} from './outcomeTree';
import {
  getScopedTableBase,
  getPendingRollArgs,
  getPendingRollKind,
  getPendingRollTableId,
  getPendingRollTargetId,
} from '../domain/pendingRoll';
import {
  createOutcomeRenderSnapshot,
  type OutcomeRenderSnapshot,
} from './outcomePipeline';
import {
  withDungeonRandomSession,
  type DungeonRandomSession,
} from './dungeonRandom';
import {
  ALL_REGISTRY_OUTCOMES,
  ALL_TABLE_ID_LIST,
  postProcessOutcomeTree,
  type FeatureTableId,
} from '../features/bundle';

// Registry resolver type
type RegistryResolution = {
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
};

type RegistryResolver = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
  doorChain?: {
    existing: DoorChainLaterality[];
    sequence: number;
  };
}) => RegistryResolution;

type TableId = FeatureTableId;

const TABLE_ID_LIST: ReadonlyArray<TableId> = ALL_TABLE_ID_LIST;

function isTableId(x: string): x is TableId {
  return TABLE_ID_LIST.some((tableId) => tableId === x);
}

function fromOutcome(outcome: DungeonOutcomeNode): RegistryResolution {
  const normalized = normalizeOutcomeTree(outcome);
  const postProcessed = postProcessOutcomeTree(normalized);
  return {
    outcome: postProcessed,
    messages: renderDetailTree(postProcessed),
  };
}

const FEATURE_TABLE_RESOLVERS: Record<string, RegistryResolver> =
  Object.fromEntries(
    Object.entries(ALL_REGISTRY_OUTCOMES).map(([id, buildOutcome]) => [
      id,
      (opts) => fromOutcome(buildOutcome(opts)),
    ])
  );

const TABLE_RESOLVERS: Record<TableId, RegistryResolver> = {
  ...FEATURE_TABLE_RESOLVERS,
} as Record<TableId, RegistryResolver>;

function resolveRegistryTable(opts: {
  tableId: string;
  roll?: number;
  context?: TableContext;
  outcome?: DungeonOutcomeNode;
  targetId?: string;
}): RegistryResolution | undefined {
  const base = getScopedTableBase(opts.tableId);
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

type OutcomeRollApplication = {
  outcome: DungeonOutcomeNode;
  snapshot: OutcomeRenderSnapshot;
  targetId: string;
};

export function applyOutcomeRoll(opts: {
  outcome: DungeonOutcomeNode;
  tableId: string;
  targetId?: string;
  roll?: number;
  context?: TableContext;
  session?: DungeonRandomSession;
}): OutcomeRollApplication | undefined {
  return withDungeonRandomSession(opts.session, () => {
    const normalizedExisting = normalizeOutcomeTree(opts.outcome);
    const targetId =
      opts.targetId !== undefined
        ? findExplicitTargetId(normalizedExisting, opts.targetId)
        : resolvePendingTargetId(
            normalizedExisting,
            opts.tableId,
            opts.context
          );
    if (!targetId) return undefined;
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
    const snapshot = createOutcomeRenderSnapshot(normalizedApplied, {
      autoResolve: false,
    });
    if (!snapshot) return undefined;
    return { outcome: normalizedApplied, snapshot, targetId };
  });
}

type PendingOutcomeResolution = {
  outcome: DungeonOutcomeNode;
  snapshot: OutcomeRenderSnapshot;
  resolvedIds: string[];
  targetId: string;
};

export function resolvePendingOutcome(opts: {
  outcome: DungeonOutcomeNode;
  tableId: string;
  targetId?: string;
  roll?: number;
  context?: TableContext;
  session?: DungeonRandomSession;
}): PendingOutcomeResolution | undefined {
  const applied = applyOutcomeRoll({
    outcome: opts.outcome,
    tableId: opts.tableId,
    targetId: opts.targetId,
    roll: opts.roll,
    context: opts.context,
    session: opts.session,
  });
  if (!applied) return undefined;

  const resolvedIds = new Set(
    collectKeyVariants(applied.targetId, opts.tableId)
  );
  const previewTargets = collectPreviewTargetsForTable(
    applied.snapshot.detail,
    opts.tableId
  ).filter((key) => key === applied.targetId);
  for (const key of previewTargets) {
    resolvedIds.add(key);
  }

  return {
    outcome: applied.outcome,
    snapshot: applied.snapshot,
    resolvedIds: Array.from(resolvedIds),
    targetId: applied.targetId,
  };
}

function findExplicitTargetId(
  existing: DungeonOutcomeNode,
  requestedId: string
): string | undefined {
  return hasOutcomeTargetId(existing, requestedId) ? requestedId : undefined;
}

function hasOutcomeTargetId(
  node: DungeonOutcomeNode | undefined,
  targetId: string
): boolean {
  if (!node) return false;
  if (node.id === targetId) return true;
  if (node.type !== 'event' || !node.children) return false;
  return node.children.some((child) => hasOutcomeTargetId(child, targetId));
}

function resolvePendingTargetId(
  existing: DungeonOutcomeNode,
  tableId: string,
  context?: TableContext
): string | undefined {
  const base = getScopedTableBase(tableId);
  const slotKey = readSlotKeyHint(context);
  if (slotKey) {
    const slotMatch = findPendingWithAncestors(existing, (pending) => {
      const pendingBase = getPendingRollKind(pending);
      if (pendingBase !== base) return false;
      return readSlotKeyHint(getPendingRollArgs(pending)) === slotKey;
    });
    if (slotMatch) {
      return getPendingRollTargetId(slotMatch.pending);
    }
  }

  const tableMatch = findPendingWithAncestors(
    existing,
    (pending) => getPendingRollTableId(pending) === tableId
  );
  if (tableMatch) {
    return getPendingRollTargetId(tableMatch.pending);
  }

  const firstByBase = findPendingWithAncestors(existing, (pending) => {
    return getPendingRollKind(pending) === base;
  });
  if (!firstByBase) return undefined;
  const firstTarget = getPendingRollTargetId(firstByBase.pending);
  const secondByBase = findPendingWithAncestors(existing, (pending) => {
    const pendingBase = getPendingRollKind(pending);
    const target = getPendingRollTargetId(pending);
    return pendingBase === base && target !== firstTarget;
  });
  return secondByBase ? undefined : firstTarget;
}

function readSlotKeyHint(context?: TableContext): string | undefined {
  switch (context?.kind) {
    case 'treasureSwordPrimaryAbility':
    case 'treasureSwordExtraordinaryPower':
    case 'treasureSwordSpecialPurpose':
    case 'treasureSwordSpecialPurposePower':
    case 'treasureSwordDragonSlayerColor':
      return context.slotKey;
    default:
      return undefined;
  }
}

function collectPreviewTargetsForTable(
  nodes: DungeonRenderNode[] | undefined,
  tableId: string
): string[] {
  if (!nodes) return [];
  const targets = new Set<string>();
  for (const node of nodes) {
    if (!isDungeonTablePreview(node)) continue;
    if (node.id !== tableId) continue;
    targets.add(getDungeonTablePreviewTargetKey(node));
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
