import type { Dispatch, SetStateAction } from 'react';
import { runDungeonStep } from '../../dungeon/services/adapters';
import {
  renderDetailTree,
  toCompactRender,
} from '../../dungeon/adapters/render';
import { resolveViaRegistry } from '../../dungeon/helpers/registry';
import {
  countPendingNodes,
  normalizeOutcomeTree,
} from '../../dungeon/helpers/outcomeTree';
import { resolvePeriodicCheck } from '../../dungeon/domain/resolvers';
import type { DungeonOutcomeNode } from '../../dungeon/domain/outcome';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../types/dungeon';

type TestFeedItem = {
  id: string;
  action: 'passage' | 'door';
  roll: number;
  outcome?: DungeonOutcomeNode;
  renderCache: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
  messages: DungeonRenderNode[];
  pendingCount: number;
};

describe('dungeon feed toggling confidence', () => {
  it('reduces pending count as registry resolutions complete a passage chain', () => {
    const initial = runDungeonStep('passage', {
      roll: 12,
      level: 1,
      detailMode: true,
    });
    expect(initial.outcome).toBeDefined();
    let feedState: TestFeedItem[] = [buildFeedItem(initial)];
    const getFeed = () => feedState;
    expect(getFeed()[0]?.pendingCount).toBeGreaterThan(0);

    const updateFeed: Dispatch<SetStateAction<TestFeedItem[]>> = (updater) => {
      feedState = typeof updater === 'function' ? updater(feedState) : updater;
    };

    // passage turn -> passage width -> special passage -> chasm depth -> chasm construction
    resolvePreviewFor(getFeed, updateFeed, 'passageTurns', 1);
    expect(getFeed()[0]?.pendingCount).toBeGreaterThan(0);

    resolvePreviewFor(getFeed, updateFeed, 'passageWidth', 19);
    expect(getFeed()[0]?.pendingCount).toBeGreaterThan(0);

    resolvePreviewFor(getFeed, updateFeed, 'specialPassage', 20);
    expect(getFeed()[0]?.pendingCount).toBeGreaterThan(0);

    resolvePreviewFor(getFeed, updateFeed, 'chasmDepth', 6);
    expect(getFeed()[0]?.pendingCount).toBeGreaterThan(0);

    resolvePreviewFor(getFeed, updateFeed, 'chasmConstruction', 1);
    expect(getFeed()[0]?.pendingCount).toBe(0);
  });

  it('reports pending previews for unresolved passage outcomes', () => {
    const unresolved = normalizeOutcomeTree(
      resolvePeriodicCheck({ roll: 12, level: 1 })
    );
    const detailNodes = renderDetailTree(unresolved);
    const previews = detailNodes.filter(
      (node) => node.kind === 'table-preview'
    );
    expect(previews).toHaveLength(countPendingNodes(unresolved));
  });
});

function buildFeedItem(step: ReturnType<typeof runDungeonStep>): TestFeedItem {
  const detailRender = step.outcome
    ? renderDetailTree(step.outcome)
    : undefined;
  const compactRender = step.outcome
    ? toCompactRender(step.outcome)
    : undefined;
  return {
    id: 'test',
    action: step.action,
    roll: step.roll ?? 0,
    outcome: step.outcome,
    renderCache: {
      detail: detailRender,
      compact: compactRender,
    },
    messages: step.messages,
    pendingCount: countPendingNodes(step.outcome),
  };
}

function resolvePreviewFor(
  getFeed: () => TestFeedItem[],
  setFeed: Dispatch<SetStateAction<TestFeedItem[]>>,
  tableId: string,
  roll: number
): void {
  const feedItem = getFeed()[0];
  if (!feedItem) {
    throw new Error('missing feed item');
  }
  const preview = findPreview(feedItem.messages, tableId);
  if (!preview) {
    throw new Error(`Expected preview for ${tableId}`);
  }
  resolveViaRegistry(preview, feedItem.id, roll, setFeed);
}

function findPreview(
  messages: DungeonRenderNode[],
  tableId: string
): DungeonTablePreview | undefined {
  for (const message of messages) {
    if (message.kind === 'table-preview') {
      if (message.id === tableId || message.targetId === tableId) {
        return message;
      }
    }
  }
  return undefined;
}
