import { runDungeonStep } from '../../dungeon/services/adapters';
import { normalizeOutcomeTree, countPendingNodes } from '../../dungeon/helpers/outcomeTree';
import { buildRenderCache, selectMessagesForMode } from '../../dungeon/helpers/renderCache';
import { resolveViaRegistry, type FeedLike } from '../../dungeon/helpers/registry';
import type {
  DungeonAction,
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../types/dungeon';
import type { OutcomeEventNode } from '../../dungeon/domain/outcome';

export type FeedSnapshot = {
  id: string;
  action: DungeonAction;
  roll: number;
  outcome: OutcomeEventNode;
  messages: DungeonRenderNode[];
  renderCache: ReturnType<typeof buildRenderCache>;
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
  const normalized = normalizeOutcomeTree(step.outcome) as OutcomeEventNode;
  return {
    id: 'feed',
    action: options.action,
    roll: options.roll,
    outcome: normalized,
    messages: step.messages,
    renderCache: buildRenderCache(normalized),
    pendingCount: countPendingNodes(normalized),
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
  resolveViaRegistry(preview, feed.id, roll, (updater) => {
    const base: FeedLike[] = [
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
    nextFeed = {
      id: next.id,
      action: feed.action,
      roll: feed.roll,
      outcome: normalizeOutcomeTree(next.outcome) as OutcomeEventNode,
      messages: next.messages,
      renderCache: buildRenderCache(next.outcome),
      pendingCount: countPendingNodes(next.outcome),
    };
    return updated;
  });
  return nextFeed;
}

export function renderCompact(feed: FeedSnapshot): DungeonRenderNode[] {
  return selectMessagesForMode(feed.action, false, feed.renderCache, feed.messages);
}

export function renderDetail(feed: FeedSnapshot): DungeonRenderNode[] {
  return selectMessagesForMode(feed.action, true, feed.renderCache, feed.messages);
}

function findPreview(
  nodes: DungeonRenderNode[],
  id: string
): DungeonTablePreview | undefined {
  for (const node of nodes) {
    if (node.kind === 'table-preview' && node.id === id) return node;
  }
  return undefined;
}
