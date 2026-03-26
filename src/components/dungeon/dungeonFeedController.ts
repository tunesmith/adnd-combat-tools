import type React from 'react';
import { rollDice } from '../../dungeon/helpers/dungeonLookup';
import { resolveViaRegistry } from '../../dungeon/helpers/registry';
import {
  withDungeonRandomSession,
  type DungeonRandomSession,
} from '../../dungeon/helpers/dungeonRandom';
import { doorBeyondMessages } from '../../dungeon/services/doorBeyondMessages';
import { passageMessages } from '../../dungeon/services/passageMessages';
import type { DungeonOutcomeNode } from '../../dungeon/domain/outcome';
import type {
  DungeonAction,
  DungeonRenderNode,
  DungeonRollSource,
  TargetedDungeonTablePreview,
} from '../../types/dungeon';
import type { FeedItem, PreviewResolutionEntry } from './feedTypes';

export function getRootPreviewNodes(
  action: DungeonAction,
  dungeonLevel: number
): DungeonRenderNode[] {
  if (action === 'door') {
    const { messages } = doorBeyondMessages({ detailMode: true });
    return messages.filter((message) => message.kind === 'table-preview');
  }
  const { messages } = passageMessages({
    detailMode: true,
    level: dungeonLevel,
  });
  return messages.filter((message) => message.kind === 'table-preview');
}

export function collectPendingTargetIds(
  node?: DungeonOutcomeNode
): ReadonlySet<string> {
  const targets = new Set<string>();

  const walk = (current?: DungeonOutcomeNode) => {
    if (!current) return;
    if (current.type === 'pending-roll') {
      targets.add(current.id ?? current.table);
      return;
    }
    current.children?.forEach((child) => walk(child));
  };

  walk(node);
  return targets;
}

export function resolveDungeonFeedPreview(options: {
  preview: TargetedDungeonTablePreview;
  feedItemId: string;
  shouldRoll: boolean;
  feedSequence?: number;
  feedItem?: FeedItem;
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
  let usedRoll: number | undefined = options.overrides[targetKey];
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
  const didResolve = resolveViaRegistry(
    options.preview,
    options.feedItemId,
    usedRoll,
    options.setFeed,
    options.setCollapsed,
    options.setResolved,
    options.feedItem,
    options.session
  );
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
