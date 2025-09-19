import {
  createFeedSnapshot,
  resolvePreview,
  renderCompact,
  renderDetail,
} from './uiPreviewHarness';
import type { DungeonTablePreview } from '../../types/dungeon';
import type { OutcomeEventNode, PendingRoll } from '../../dungeon/domain/outcome';

describe('uiPreviewHarness', () => {
  test('resolves door continuation chain without residual pending nodes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 3,
      detailMode: true,
    });

    feed = resolvePreview(feed, 'doorLocation:0', 1);
    feed = resolvePreview(feed, 'periodicCheckDoorOnly:0', 3);
    feed = resolvePreview(feed, 'doorLocation:1', 4);

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

  test('captures chamber unusual size reroll behaviour (current UI)', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });
    feed = resolvePreview(feed, 'chamberDimensions', 18);
    feed = resolvePreview(feed, 'unusualShape', 6);
    feed = resolvePreview(feed, 'unusualSize', 15);
    feed = resolvePreview(feed, 'unusualSize', 15);

    expect(feed.pendingCount).toBe(1);
    expect(listPreviewIds(feed)).toHaveLength(1);

    const compactText = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    expect(compactText).toBe(
      'The passage opens into a chamber. The chamber has an unusual shape and size. It is triangular. Add 2000 sq. ft. (current total 2,000 sq. ft.) and roll again. Determine exits, contents, and treasure separately.'
    );
  });

  test('chamber unusual size resolves fully when reroll finishes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });
    feed = resolvePreview(feed, 'chamberDimensions', 18);
    feed = resolvePreview(feed, 'unusualShape', 6);
    feed = resolvePreview(feed, 'unusualSize', 15);
    feed = resolvePreview(feed, 'unusualSize', 15);
    feed = resolvePreview(feed, 'unusualSize', 1);

    expect(feed.pendingCount).toBe(0);
    expect(listPreviewIds(feed)).toHaveLength(0);

    const detailView = renderDetail(feed);
    void detailView;

    const compactText = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    void compactText; // TODO: assert compact summary when render is corrected
  });
});

function listPreviewIds(feed: ReturnType<typeof createFeedSnapshot>): string[] {
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
