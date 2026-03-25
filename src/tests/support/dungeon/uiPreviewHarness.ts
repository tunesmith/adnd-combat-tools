import { runDungeonStep } from '../../../dungeon/services/adapters';
import { countPendingNodes } from '../../../dungeon/helpers/outcomeTree';
import {
  buildRenderCache,
  selectMessagesForMode,
  type RenderCache,
} from '../../../dungeon/helpers/renderCache';
import { resolveViaRegistry } from '../../../dungeon/helpers/registry';
import type {
  DungeonAction,
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../../types/dungeon';
import type {
  OutcomeEventNode,
  PendingRoll,
} from '../../../dungeon/domain/outcome';

type FeedSnapshot = {
  id: string;
  action: DungeonAction;
  roll: number;
  outcome: OutcomeEventNode;
  messages: DungeonRenderNode[];
  renderCache: RenderCache;
  pendingCount: number;
};

export function createFeedSnapshot(options: {
  action: DungeonAction;
  roll: number;
  detailMode?: boolean;
  dungeonLevel?: number;
}): FeedSnapshot {
  const step = runDungeonStep(options.action, {
    roll: options.roll,
    detailMode: options.detailMode ?? true,
    level: options.dungeonLevel,
  });
  if (!step.outcome || step.outcome.type !== 'event') {
    throw new Error('Expected an event outcome from runDungeonStep.');
  }
  const outcome = step.outcome;
  const renderCache: RenderCache =
    step.renderCache ?? buildRenderCache(outcome);
  const detailMode = options.detailMode ?? true;
  const messages = selectMessagesForMode(
    options.action,
    detailMode,
    renderCache,
    step.messages
  );
  return {
    id: 'feed',
    action: options.action,
    roll: options.roll,
    outcome,
    messages,
    renderCache,
    pendingCount: step.pendingCount ?? countPendingNodes(outcome),
  };
}

export function resolvePreview(
  feed: FeedSnapshot,
  previewId: string,
  roll: number
): FeedSnapshot {
  const preview = findPreview(feed.messages, previewId);
  if (!preview) {
    throw new Error(`Preview ${previewId} not found in feed messages.`);
  }
  let nextFeed = feed;
  resolveViaRegistry(
    preview,
    feed.id,
    roll,
    (updater) => {
      const base = [
        {
          id: feed.id,
          messages: feed.messages,
          outcome: feed.outcome,
          renderCache: feed.renderCache,
          pendingCount: feed.pendingCount,
        },
      ];
      const updated = typeof updater === 'function' ? updater(base) : updater;
      const next = updated[0];
      if (!next || !next.outcome || next.outcome.type !== 'event') {
        throw new Error('Registry update did not return an event outcome.');
      }
      const renderCache: RenderCache =
        next.renderCache ?? buildRenderCache(next.outcome);
      nextFeed = {
        id: next.id,
        action: feed.action,
        roll: feed.roll,
        outcome: next.outcome,
        messages: next.messages,
        renderCache,
        pendingCount: next.pendingCount ?? countPendingNodes(next.outcome),
      };
      return updated;
    },
    undefined,
    undefined,
    {
      id: feed.id,
      messages: feed.messages,
      outcome: feed.outcome,
      renderCache: feed.renderCache,
      pendingCount: feed.pendingCount,
    }
  );
  return nextFeed;
}

export function renderCompact(feed: FeedSnapshot): DungeonRenderNode[] {
  return selectMessagesForMode(
    feed.action,
    false,
    feed.renderCache,
    feed.messages
  );
}

export function renderDetail(feed: FeedSnapshot): DungeonRenderNode[] {
  return selectMessagesForMode(
    feed.action,
    true,
    feed.renderCache,
    feed.messages
  );
}

export function listPendingPreviewTargets(feed: FeedSnapshot): string[] {
  const pendingTargets = new Set<string>(collectPendingTargets(feed.outcome));
  return renderDetail(feed)
    .filter((n): n is DungeonTablePreview => n.kind === 'table-preview')
    .map((preview) =>
      preview.targetId && preview.targetId.length > 0
        ? preview.targetId
        : preview.id
    )
    .filter((id) => pendingTargets.has(id));
}

export function resolvePendingPreview(
  feed: FeedSnapshot,
  tableBase: string,
  roll: number
): FeedSnapshot {
  const pendingPreview = getPendingPreviews(feed).find((preview) => {
    const base = preview.id.split(':')[0];
    return base === tableBase;
  });
  if (!pendingPreview) {
    throw new Error(`No pending preview found for table ${tableBase}.`);
  }
  const key =
    pendingPreview.targetId && pendingPreview.targetId.length > 0
      ? pendingPreview.targetId
      : pendingPreview.id;
  return resolvePreview(feed, key, roll);
}

function findPreview(
  nodes: DungeonRenderNode[],
  id: string
): DungeonTablePreview | undefined {
  for (const node of nodes) {
    if (node.kind !== 'table-preview') continue;
    if (node.id === id) return node;
    if (node.targetId && node.targetId === id) return node;
  }
  return undefined;
}

function getPendingPreviews(feed: FeedSnapshot): DungeonTablePreview[] {
  const pendingTargets = new Set<string>(collectPendingTargets(feed.outcome));
  return renderDetail(feed)
    .filter((n): n is DungeonTablePreview => n.kind === 'table-preview')
    .filter((preview) => {
      const key =
        preview.targetId && preview.targetId.length > 0
          ? preview.targetId
          : preview.id;
      return pendingTargets.has(key);
    });
}

function collectPendingTargets(node: OutcomeEventNode): string[] {
  const acc: string[] = [];
  const walk = (current: OutcomeEventNode | PendingRoll) => {
    if (current.type === 'pending-roll') {
      acc.push(current.id ?? current.table);
      return;
    }
    current.children?.forEach((child) => walk(child));
  };
  walk(node);
  return acc;
}
