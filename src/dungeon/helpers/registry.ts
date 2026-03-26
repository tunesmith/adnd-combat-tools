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
import { renderDetailTree } from '../adapters/render';
import {
  applyResolvedOutcome,
  deriveDoorChainContext,
  findPendingWithAncestors,
  normalizeOutcomeTree,
} from './outcomeTree';
import { isTableContext } from './tableContext';
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
  ALL_TABLE_HEADINGS,
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

const TABLE_HEADINGS: Record<TableId, string> = ALL_TABLE_HEADINGS;

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

type OutcomeRollApplication = {
  outcome: DungeonOutcomeNode;
  snapshot: OutcomeRenderSnapshot;
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
    const snapshot = createOutcomeRenderSnapshot(normalizedApplied, {
      autoResolve: false,
    });
    if (!snapshot) return undefined;
    return { outcome: normalizedApplied, snapshot };
  });
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
  const slotKey = readSlotKeyHint(context);
  if (slotKey) {
    const slotMatch = findPendingWithAncestors(existing, (pending) => {
      const pendingBase = String(pending.table.split(':')[0] ?? '');
      if (pendingBase !== base) return false;
      return readSlotKeyHint(pending.context) === slotKey;
    });
    if (slotMatch) {
      return slotMatch.pending.id ?? slotMatch.pending.table;
    }
  }

  const tableMatch = findPendingWithAncestors(
    existing,
    (pending) => pending.table === requestedId
  );
  if (tableMatch) {
    return tableMatch.pending.id ?? tableMatch.pending.table;
  }

  const firstByBase = findPendingWithAncestors(existing, (pending) => {
    const pendingBase = String(pending.table.split(':')[0] ?? '');
    return pendingBase === base;
  });
  if (!firstByBase) return requestedId;
  const firstTarget = firstByBase.pending.id ?? firstByBase.pending.table;
  const secondByBase = findPendingWithAncestors(existing, (pending) => {
    const pendingBase = String(pending.table.split(':')[0] ?? '');
    const target = pending.id ?? pending.table;
    return pendingBase === base && target !== firstTarget;
  });
  if (!secondByBase) {
    return firstTarget;
  }
  return requestedId;
}

function readSlotKeyHint(context: unknown): string | undefined {
  if (!isTableContext(context)) return undefined;
  const candidate = context as { slotKey?: unknown; parentSlotKey?: unknown };
  if (typeof candidate.slotKey === 'string' && candidate.slotKey.length > 0) {
    return candidate.slotKey;
  }
  if (
    typeof candidate.parentSlotKey === 'string' &&
    candidate.parentSlotKey.length > 0
  ) {
    return candidate.parentSlotKey;
  }
  return undefined;
}

type FeedLike = {
  id: string;
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
  renderCache?: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
  pendingCount?: number;
};

type FeedResolution<T extends FeedLike> = {
  nextFeedItem: T;
  keyVariants: string[];
};

function updateResolvedBlock<T extends FeedLike>(
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

function buildFeedResolution<T extends FeedLike>(opts: {
  feedItem: T;
  feedItemId: string;
  preview: DungeonTablePreview;
  usedRoll: number | undefined;
  targetKey: string;
  heading: string;
  session?: DungeonRandomSession;
}): FeedResolution<T> | undefined {
  const keyVariants = collectKeyVariants(opts.targetKey, opts.preview.id);
  const extraKeyVariants = new Set<string>();

  if (opts.feedItem.outcome) {
    const applied = applyOutcomeRoll({
      outcome: opts.feedItem.outcome,
      tableId: opts.preview.id,
      targetId: opts.targetKey,
      roll: opts.usedRoll,
      context: opts.preview.context,
      session: opts.session,
    });
    if (applied) {
      const { outcome, snapshot } = applied;
      const previewTargets = collectPreviewTargetsForTable(
        snapshot.detail,
        opts.preview.id
      ).filter((key) => key === opts.targetKey);
      for (const key of previewTargets) extraKeyVariants.add(key);
      return {
        nextFeedItem: {
          ...opts.feedItem,
          outcome,
          pendingCount: snapshot.pendingCount,
          messages: snapshot.detail,
          renderCache: {
            ...opts.feedItem.renderCache,
            detail: snapshot.detail,
            compact: snapshot.compact,
          },
        },
        keyVariants: Array.from(
          new Set([...keyVariants, ...Array.from(extraKeyVariants)])
        ),
      };
    }
  }

  const tableResult = withDungeonRandomSession(opts.session, () =>
    resolveRegistryTable({
      tableId: opts.preview.id,
      roll: opts.usedRoll,
      context: opts.preview.context,
      outcome: opts.feedItem.outcome,
      targetId: opts.targetKey,
    })
  );
  if (!tableResult) return undefined;

  const previewTargets = collectPreviewTargetsForTable(
    tableResult.messages,
    opts.preview.id
  ).filter((key) => key === opts.targetKey);
  for (const key of previewTargets) extraKeyVariants.add(key);
  return {
    nextFeedItem: updateResolvedBlock(
      opts.feedItem,
      opts.feedItemId,
      opts.targetKey,
      tableResult.messages,
      opts.heading
    ),
    keyVariants: Array.from(
      new Set([...keyVariants, ...Array.from(extraKeyVariants)])
    ),
  };
}

function markResolvedKeys(
  feedItemId: string,
  keyVariants: string[],
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
): void {
  if (setCollapsed) {
    setCollapsed((prev) => {
      const next = { ...prev };
      for (const key of keyVariants) next[`${feedItemId}:${key}`] = true;
      return next;
    });
  }
  if (setResolved) {
    setResolved((prev) => {
      const next = { ...prev };
      for (const key of keyVariants) next[`${feedItemId}:${key}`] = true;
      return next;
    });
  }
}

export function resolveViaRegistry<T extends FeedLike>(
  tp: DungeonTablePreview,
  feedItemId: string,
  usedRoll: number | undefined,
  setFeed?: React.Dispatch<React.SetStateAction<T[]>>,
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  currentFeedItem?: T,
  session?: DungeonRandomSession
): boolean {
  const base = String(tp.id.split(':')[0] ?? '');
  if (!isTableId(base)) return false;

  const heading = TABLE_HEADINGS[base] ?? base;
  const targetKey = tp.targetId ?? tp.id;

  if (currentFeedItem) {
    const resolution = buildFeedResolution({
      feedItem: currentFeedItem,
      feedItemId,
      preview: tp,
      usedRoll,
      targetKey,
      heading,
      session,
    });
    if (!resolution) return false;
    if (setFeed) {
      setFeed((prev) =>
        prev.map((fi) => (fi.id === feedItemId ? resolution.nextFeedItem : fi))
      );
    }
    markResolvedKeys(
      feedItemId,
      resolution.keyVariants,
      setCollapsed,
      setResolved
    );
    return true;
  }

  let resolved = false;

  if (setFeed) {
    setFeed((prev) =>
      prev.map((fi) => {
        if (fi.id !== feedItemId) return fi;
        const resolution = buildFeedResolution({
          feedItem: fi,
          feedItemId,
          preview: tp,
          usedRoll,
          targetKey,
          heading,
          session,
        });
        if (!resolution) return fi;
        resolved = true;
        markResolvedKeys(
          feedItemId,
          resolution.keyVariants,
          setCollapsed,
          setResolved
        );
        return resolution.nextFeedItem;
      })
    );
  }
  if (!resolved) return false;
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
