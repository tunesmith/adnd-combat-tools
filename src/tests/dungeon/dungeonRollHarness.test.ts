import {
  simulateCompactRunWithSequence,
  simulateDetailRun,
} from './dungeonRollHarness';
import { runDungeonStep } from '../../dungeon/services/adapters';
import { normalizeOutcomeTree, countPendingNodes } from '../../dungeon/helpers/outcomeTree';
import { buildRenderCache, selectMessagesForMode } from '../../dungeon/helpers/renderCache';
import { resolveViaRegistry } from '../../dungeon/helpers/registry';
import type { DungeonRenderNode, DungeonTablePreview } from '../../types/dungeon';
import type { OutcomeEventNode } from '../../dungeon/domain/outcome';

describe('dungeon roll harness', () => {
  test('tries out 3,1,3', () => {
    const rolls = '3,1,3';
    const detail = simulateDetailRun({
      action: 'passage',
      rolls,
      dungeonLevel: 1,
    });
    expect(detail.rollsUsed).toEqual([3, 1, 3]);
    expect(detail.final.pending.map((p) => p.table)).toEqual([
      'doorLocation:1',
    ]);
    expect(detail.final.detail.previewIds()).toContain('doorLocation:1');
  });
  test('produces consistent passage outputs across modes', () => {
    const rolls = '3,1,3,4';
    const detail = simulateDetailRun({
      action: 'passage',
      rolls,
      dungeonLevel: 1,
      resolveAll: true,
    });

    expect(detail.rollsUsed).toEqual([3, 1, 3, 4]);
    expect(detail.final.pending).toHaveLength(0);
    expect(detail.final.detail.previewIds()).toEqual([
      'doorLocation:0',
      'periodicCheckDoorOnly:0',
      'doorLocation:1',
    ]);
    expect(detail.final.detail.paragraphs()).toEqual([
      'A closed door is indicated.',
      'A door is to the Left.',
      "There are no other doors. The main passage extends -- check again in 30'.",
    ]);

    const compact = simulateCompactRunWithSequence({
      action: 'passage',
      rolls,
      dungeonLevel: 1,
    });

    expect(compact.pending).toHaveLength(0);
    expect(compact.rollsUsed).toEqual([3]);
    expect(compact.unusedRolls).toEqual([]);
    expect(compact.compact.paragraphs().map((p) => p.trim())).toEqual([
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'.",
    ]);
    const compactText = compact.compact.paragraphs().join(' ');
    expect((compactText.match(/A door is to the Left\./g) || []).length).toBe(1);

    expect(compact.compact.paragraphs().map((p) => p.trim())).toEqual(
      detail.final.compact.paragraphs().map((p) => p.trim())
    );
  });

  test('ui resolver clears follow-up door continuation', () => {
    const step = runDungeonStep('passage', { roll: 3, detailMode: true });
    if (!step.outcome || step.outcome.type !== 'event') {
      throw new Error('expected event outcome');
    }
    type FeedEntry = {
      id: string;
      action: 'passage';
      roll: number;
      outcome: OutcomeEventNode;
      renderCache: ReturnType<typeof buildRenderCache>;
      messages: DungeonRenderNode[];
      pendingCount: number;
    };
    const feedItem: FeedEntry = {
      id: 'feed',
      action: 'passage' as const,
      roll: 3,
      outcome: normalizeOutcomeTree(step.outcome) as OutcomeEventNode,
      renderCache: buildRenderCache(step.outcome),
      messages: step.messages,
      pendingCount: countPendingNodes(step.outcome),
    };
    let feed: FeedEntry[] = [feedItem];
    const setFeed = (
      value: ((prev: FeedEntry[]) => FeedEntry[]) | FeedEntry[]
    ) => {
      feed = typeof value === 'function' ? value(feed) : value;
    };

    const resolvePreviewById = (id: string, roll: number) => {
      const current = feed[0];
      if (!current) throw new Error('missing feed item');
      const preview = findPreview(current.messages, id);
      if (!preview) throw new Error(`preview ${id} not found`);
      resolveViaRegistry(preview, current.id, roll, setFeed as any);
    };

    resolvePreviewById('doorLocation:0', 1);
    resolvePreviewById('periodicCheckDoorOnly:0', 3);
    resolvePreviewById('doorLocation:1', 4);

    const finalItem = feed[0];
    if (!finalItem) throw new Error('missing final feed item');
    expect(finalItem.pendingCount).toBe(0);
    const compactNodes = selectMessagesForMode(
      finalItem.action,
      false,
      finalItem.renderCache,
      finalItem.messages
    );
    const compactText = compactNodes
      .filter((n): n is Extract<DungeonRenderNode, { kind: 'paragraph' }> => n.kind === 'paragraph')
      .map((n) => n.text);
    expect(compactText).toEqual([
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'. ",
    ]);
  });

  test('exposes pending preview metadata before resolution', () => {
    const detail = simulateDetailRun({
      action: 'passage',
      rolls: '3',
      dungeonLevel: 1,
      resolveAll: false,
    });

    expect(detail.initial.detail.previewIds()).toEqual(['doorLocation:0']);
    expect(detail.initial.pending.map((p) => p.table)).toEqual([
      'doorLocation:0',
    ]);
    expect(detail.initial.detail.paragraphs()).toEqual([
      'A closed door is indicated.',
    ]);
    expect(detail.final.pending.map((p) => p.table)).toEqual([
      'doorLocation:0',
    ]);
  });
});

function findPreview(nodes: DungeonRenderNode[], id: string): DungeonTablePreview | undefined {
  for (const node of nodes) {
    if (node.kind === 'table-preview' && node.id === id) return node;
  }
  return undefined;
}
