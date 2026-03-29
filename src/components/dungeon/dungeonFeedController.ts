import type React from 'react';
import { rollDice } from '../../dungeon/helpers/dungeonLookup';
import { resolvePendingOutcome } from '../../dungeon/helpers/registry';
import {
  withDungeonRandomSession,
  type DungeonRandomSession,
} from '../../dungeon/helpers/dungeonRandom';
import { doorBeyondMessages } from '../../dungeon/services/doorBeyondMessages';
import { passageMessages } from '../../dungeon/services/passageMessages';
import type { DungeonOutcomeNode } from '../../dungeon/domain/outcome';
import { getPendingRollTargetId } from '../../dungeon/domain/pendingRoll';
import type {
  DungeonAction,
  DungeonRollSource,
  RootDungeonTablePreview,
  TargetedDungeonTablePreview,
} from '../../types/dungeon';
import {
  isDungeonTablePreview,
  isTargetedDungeonTablePreview,
} from '../../types/dungeon';
import type { RenderCache } from '../../dungeon/helpers/renderCache';
import type { FeedItem, PreviewResolutionEntry } from './feedTypes';

export function getRootPreviewNodes(
  action: DungeonAction,
  dungeonLevel: number
): RootDungeonTablePreview[] {
  if (action === 'door') {
    const { messages } = doorBeyondMessages({ detailMode: true });
    return messages.filter(
      (message): message is RootDungeonTablePreview =>
        isDungeonTablePreview(message) &&
        !isTargetedDungeonTablePreview(message)
    );
  }
  const { messages } = passageMessages({
    detailMode: true,
    level: dungeonLevel,
  });
  return messages.filter(
    (message): message is RootDungeonTablePreview =>
      isDungeonTablePreview(message) && !isTargetedDungeonTablePreview(message)
  );
}

export function collectPendingTargetIds(
  node?: DungeonOutcomeNode
): ReadonlySet<string> {
  const targets = new Set<string>();

  const walk = (current?: DungeonOutcomeNode) => {
    if (!current) return;
    if (current.type === 'pending-roll') {
      targets.add(getPendingRollTargetId(current));
      return;
    }
    current.children?.forEach((child) => walk(child));
  };

  walk(node);
  return targets;
}

type FeedLike = {
  id: string;
  messages: RootDungeonTablePreview[] | FeedItem['messages'];
  outcome?: DungeonOutcomeNode;
  renderCache?: RenderCache;
  pendingCount?: number;
};

type FeedPreviewResolution<T extends FeedLike> = {
  nextFeedItem: T;
  resolvedIds: string[];
};

export function resolveFeedPreview<T extends FeedLike>(options: {
  preview: TargetedDungeonTablePreview;
  feedItem: T;
  usedRoll: number | undefined;
  session?: DungeonRandomSession;
}): FeedPreviewResolution<T> | undefined {
  if (!options.feedItem.outcome) return undefined;
  const resolution = resolvePendingOutcome({
    outcome: options.feedItem.outcome,
    tableId: options.preview.id,
    targetId: options.preview.targetId,
    roll: options.usedRoll,
    context: options.preview.context,
    session: options.session,
  });
  if (!resolution) return undefined;
  return {
    nextFeedItem: {
      ...options.feedItem,
      outcome: resolution.outcome,
      pendingCount: resolution.snapshot.pendingCount,
      messages: resolution.snapshot.detail,
      renderCache: {
        ...options.feedItem.renderCache,
        detail: resolution.snapshot.detail,
        compact: resolution.snapshot.compact,
      },
    },
    resolvedIds: resolution.resolvedIds,
  };
}

function markResolvedKeys(
  feedItemId: string,
  resolvedIds: string[],
  setCollapsed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setResolved: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
): void {
  setCollapsed((prev) => {
    const next = { ...prev };
    for (const key of resolvedIds) next[`${feedItemId}:${key}`] = true;
    return next;
  });
  setResolved((prev) => {
    const next = { ...prev };
    for (const key of resolvedIds) next[`${feedItemId}:${key}`] = true;
    return next;
  });
}

export function resolveDungeonFeedPreview(options: {
  preview: TargetedDungeonTablePreview;
  feedItemId: string;
  shouldRoll: boolean;
  explicitRoll?: number;
  feedSequence?: number;
  feedItem: FeedItem;
  session: DungeonRandomSession;
  overrides: Record<string, number | undefined>;
  setOverrides: React.Dispatch<
    React.SetStateAction<Record<string, number | undefined>>
  >;
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  setCollapsed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setResolved: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onResolved?: (entry: PreviewResolutionEntry) => void;
}): boolean {
  const targetKey = options.preview.targetId;
  let usedRoll: number | undefined =
    options.explicitRoll ?? options.overrides[targetKey];
  if (!options.shouldRoll && usedRoll === undefined) return false;
  if (options.shouldRoll && usedRoll === undefined) {
    usedRoll = withDungeonRandomSession(options.session, () =>
      rollDice(options.preview.sides)
    );
  }
  if (usedRoll === undefined) return false;
  if (options.overrides[targetKey] !== undefined) {
    options.setOverrides((prev) => ({ ...prev, [targetKey]: undefined }));
  }
  const resolution = resolveFeedPreview({
    preview: options.preview,
    feedItem: options.feedItem,
    usedRoll,
    session: options.session,
  });
  const didResolve = resolution !== undefined;
  if (resolution) {
    options.setFeed((prev) =>
      prev.map((fi) =>
        fi.id === options.feedItemId ? resolution.nextFeedItem : fi
      )
    );
    markResolvedKeys(
      options.feedItemId,
      resolution.resolvedIds,
      options.setCollapsed,
      options.setResolved
    );
  }
  if (
    !didResolve ||
    !options.onResolved ||
    options.feedSequence === undefined
  ) {
    return didResolve;
  }

  const rollSource: DungeonRollSource = options.shouldRoll ? 'auto' : 'manual';
  options.onResolved({
    feedStep: options.feedSequence,
    tableId: options.preview.id,
    targetId: targetKey,
    title: options.preview.title,
    roll: usedRoll,
    rollSource,
  });
  return true;
}
