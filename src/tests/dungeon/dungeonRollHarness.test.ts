import {
  simulateCompactRunWithSequence,
  simulateDetailRun,
} from './dungeonRollHarness';
import {
  createFeedSnapshot,
  resolvePendingPreview,
  renderCompact,
  listPendingPreviewTargets,
} from './uiPreviewHarness';

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
    let feed = createFeedSnapshot({ action: 'passage', roll: 3, detailMode: true });

    feed = resolvePendingPreview(feed, 'doorLocation', 1);
    feed = resolvePendingPreview(feed, 'periodicCheckDoorOnly', 3);
    feed = resolvePendingPreview(feed, 'doorLocation', 4);

    expect(feed.pendingCount).toBe(0);
    expect(listPendingPreviewTargets(feed)).toHaveLength(0);

    const compactNodes = renderCompact(feed)
      .filter((n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph')
      .map((n) => n.text);
    expect(compactNodes).toEqual([
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
