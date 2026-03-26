import { runDungeonStep } from '../../dungeon/services/adapters';
import type { DungeonRandomSession } from '../../dungeon/helpers/dungeonRandom';
import {
  buildRenderCache,
  selectMessagesForMode,
} from '../../dungeon/helpers/renderCache';
import { countPendingNodes } from '../../dungeon/helpers/outcomeTree';
import type {
  DungeonAction,
  DungeonReplayItem,
  DungeonRollSource,
} from '../../types/dungeon';
import type { FeedItem } from './feedTypes';

type RootStepReplayItem = Omit<
  Extract<DungeonReplayItem, { kind: 'root-step' }>,
  'kind'
>;

function createFeedItemId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function executeDungeonRootStep(options: {
  action: DungeonAction;
  roll: number;
  rollSource: DungeonRollSource;
  sequence: number;
  detailMode: boolean;
  level: number;
  session: DungeonRandomSession;
}): {
  feedItem: FeedItem;
  replayItem: RootStepReplayItem;
  announcement: string;
} {
  const step = runDungeonStep(options.action, {
    roll: options.roll,
    detailMode: options.detailMode,
    level: options.level,
    session: options.session,
  });
  const renderCache = step.renderCache ?? buildRenderCache(step.outcome);
  const pendingCount = step.pendingCount ?? countPendingNodes(step.outcome);
  const messages = selectMessagesForMode(
    options.action,
    options.detailMode,
    renderCache,
    step.messages
  );

  return {
    feedItem: {
      id: createFeedItemId(),
      sequence: options.sequence,
      action: options.action,
      roll: options.roll,
      level: options.level,
      outcome: step.outcome,
      renderCache,
      messages,
      pendingCount,
    },
    replayItem: {
      feedStep: options.sequence,
      action: options.action,
      roll: options.roll,
      rollSource: options.rollSource,
      detailMode: options.detailMode,
      level: options.level,
    },
    announcement: `${options.action} roll: ${options.roll}`,
  };
}
