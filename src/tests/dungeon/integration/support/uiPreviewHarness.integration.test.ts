import type {
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../../dungeon/domain/outcome';
import {
  createFeedSnapshot,
  resolvePendingPreview,
  renderCompact,
  renderDetail,
  listPendingPreviewTargets,
} from '../../../support/dungeon/uiPreviewHarness';
import { resolveViaRegistry } from '../../../../dungeon/helpers/registry';
import type { OutcomeEvent } from '../../../../dungeon/domain/outcome';

describe('uiPreviewHarness', () => {
  test('resolves door continuation chain without residual pending nodes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 3,
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'doorLocation', 1);
    feed = resolvePendingPreview(feed, 'periodicCheckDoorOnly', 3);
    feed = resolvePendingPreview(feed, 'doorLocation', 4);

    expect(feed.pendingCount).toBe(0);
    const compact = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim());

    expect(compact).toEqual([
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'.",
    ]);
  });

  test('UI collapse maps update for door continuation resolution', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 3,
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'doorLocation', 1);

    // Locate the door continuation preview after resolving door location.
    const preview = renderDetail(feed).find(
      (node): node is DungeonTablePreview =>
        node.kind === 'table-preview' &&
        node.id.startsWith('periodicCheckDoorOnly')
    );
    expect(preview).toBeDefined();

    type FeedState = {
      id: string;
      messages: DungeonRenderNode[];
      outcome?: OutcomeEventNode;
      renderCache?: {
        detail?: DungeonRenderNode[];
        compact?: DungeonRenderNode[];
      };
      pendingCount?: number;
    };

    let state: FeedState[] = [
      {
        id: feed.id,
        messages: feed.messages,
        outcome: feed.outcome,
        renderCache: feed.renderCache,
        pendingCount: feed.pendingCount,
      },
    ];

    let collapsed: Record<string, boolean> = {};
    let resolvedMap: Record<string, boolean> = {};

    if (!preview) {
      throw new Error('Expected periodicCheckDoorOnly preview');
    }

    const result = resolveViaRegistry(
      preview,
      feed.id,
      3,
      (updater) => {
        state =
          typeof updater === 'function'
            ? (updater as (prev: FeedState[]) => FeedState[])(state)
            : (updater as FeedState[]);
      },
      (updater) => {
        collapsed =
          typeof updater === 'function'
            ? (
                updater as (
                  prev: Record<string, boolean>
                ) => Record<string, boolean>
              )(collapsed)
            : (updater as Record<string, boolean>);
      },
      (updater) => {
        resolvedMap =
          typeof updater === 'function'
            ? (
                updater as (
                  prev: Record<string, boolean>
                ) => Record<string, boolean>
              )(resolvedMap)
            : (updater as Record<string, boolean>);
      }
    );

    expect(result).toBe(true);
    const keyBase = `${feed.id}:${preview.targetId ?? preview.id}`;
    expect(collapsed[keyBase]).toBe(true);
    expect(resolvedMap[keyBase]).toBe(true);
  });

  test('captures chamber unusual size reroll behaviour (current UI)', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });
    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 6);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);

    expect(feed.pendingCount).toBe(2);
    const pendingTargets = listPendingPreviewTargets(feed);
    expect(pendingTargets).toHaveLength(2);
    expect(
      pendingTargets.some((target) => target.includes('chamberRoomContents'))
    ).toBe(true);
    expect(
      pendingTargets.some((target) => target.includes('unusualSize'))
    ).toBe(true);

    const compactText = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    expect(compactText).toContain(
      'Add 2000 sq. ft. (current total 4,000 sq. ft.) and roll again.'
    );
    expect(compactText).not.toContain(
      'Add 2000 sq. ft. (current total 2,000 sq. ft.) and roll again.'
    );
    expect(compactText).not.toContain('It is about 4,500 sq. ft.');
  });

  test('chamber unusual size resolves fully when reroll finishes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });
    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 6);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 1);

    expect(feed.pendingCount).toBe(2);
    const pendingAfter = listPendingPreviewTargets(feed);
    expect(pendingAfter).toHaveLength(2);
    expect(
      pendingAfter.some((target) => target.includes('chamberRoomContents'))
    ).toBe(true);
    expect(
      pendingAfter.some((target) => target.includes('numberOfExits'))
    ).toBe(true);

    const compactView = renderCompact(feed);
    const compactText = compactView
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    // expect(compactText).toContain(
    //   'Add 2000 sq. ft. (current total 2,000 sq. ft.) and roll again.'
    // );
    // expect(compactText).toContain(
    //   'Add 2000 sq. ft. (current total 4,000 sq. ft.) and roll again.'
    // );
    expect(compactText).toContain('It is about 4,500 sq. ft.');
    expect(compactText).toContain('TODO treasure.');
    // expect(compactText).toBe(
    //   'The passage opens into a chamber. The chamber has an unusual shape and size. It is triangular. It is about 4,500 sq. ft. Determine exits, contents, and treasure separately.'
    // );
  });

  test('illusory wall chamber skips contents preview when forcing monster result', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 19,
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'trickTrap', 19);
    feed = resolvePendingPreview(feed, 'illusoryWallNature', 12);

    const previewsBefore = renderDetail(feed).filter(
      (node): node is DungeonTablePreview => node.kind === 'table-preview'
    );
    const chamberPreviewBefore = previewsBefore.find((node) =>
      node.id.split(':')[0] === 'chamberDimensions'
    );
    expect(chamberPreviewBefore).toBeDefined();
    expect(chamberPreviewBefore?.context).toEqual(
      expect.objectContaining({ kind: 'chamberDimensions' })
    );
    feed = resolvePendingPreview(feed, 'chamberDimensions', 1);

    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent?.event.kind).toBe('chamberRoomContents');
    expect((contentsEvent?.event as any).autoResolved).toBe(true);

    const detail = renderDetail(feed);
    const previews = detail.filter(
      (node): node is DungeonTablePreview => node.kind === 'table-preview'
    );
    const hasContentsPreview = previews.some((preview) => {
      const previewBase = preview.id.split(':')[0];
      const targetBase = (preview.targetId ?? '')
        .split('.')
        .pop()
        ?.split(':')[0];
      return (
        previewBase === 'chamberRoomContents' ||
        targetBase === 'chamberRoomContents'
      );
    });
    expect(hasContentsPreview).toBe(false);
    const pendingTargets = listPendingPreviewTargets(feed);
    const pendingBases = pendingTargets.map((target) => {
      const last = target.split('.').pop() ?? target;
      return last.split(':')[0];
    });
    expect(pendingBases).not.toContain('chamberRoomContents');
  });
});

function findOutcomeEvent(
  node: OutcomeEventNode | undefined,
  kind: OutcomeEvent['kind']
): OutcomeEventNode | undefined {
  if (!node || node.type !== 'event') return undefined;
  if (node.event.kind === kind) return node;
  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'event') {
        const candidate = findOutcomeEvent(child, kind);
        if (candidate) return candidate;
      }
    }
  }
  return undefined;
}
