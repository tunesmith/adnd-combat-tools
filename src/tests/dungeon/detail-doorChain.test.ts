import { renderDetailTree } from '../../dungeon/adapters/render';
import { resolvePeriodicCheck } from '../../dungeon/domain/resolvers';
import { normalizeOutcomeTree } from '../../dungeon/helpers/outcomeTree';
import { resolveSequenceWithRolls } from './detail-utils';
import type { DungeonRenderNode, DungeonTablePreview } from '../../types/dungeon';
import type { OutcomeEventNode } from '../../dungeon/domain/outcome';

function extractPreviews(nodes: DungeonRenderNode[]): DungeonTablePreview[] {
  return nodes.filter((node): node is DungeonTablePreview => node.kind === 'table-preview');
}

function asEvent(node: unknown): OutcomeEventNode {
  if (!node || typeof node !== 'object') {
    throw new Error('Expected outcome event node.');
    }
  const candidate = node as { type?: string };
  if (candidate.type !== 'event') {
    throw new Error('Expected an event outcome node.');
  }
  return node as OutcomeEventNode;
}

describe('door-chain detail rendering', () => {
  it('includes doorLocation:0 preview when the periodic check finds a door', () => {
    const outcome = asEvent(
      normalizeOutcomeTree(resolvePeriodicCheck({ roll: 3, level: 1 }))
    );
    const detailNodes = renderDetailTree(outcome);
    const previewIds = extractPreviews(detailNodes).map((preview) => preview.id);
    expect(previewIds).toContain('doorLocation:0');
  });

  it('schedules periodicCheckDoorOnly:0 after the first lateral door', () => {
    const outcome = asEvent(resolveSequenceWithRolls([3, 1], 1));
    const previews = extractPreviews(renderDetailTree(outcome));
    const target = previews.find((preview) => preview.id === 'periodicCheckDoorOnly:0');
    expect(target).toBeDefined();
  });

  it('does not enqueue a door-only periodic when the door is straight ahead', () => {
    const outcome = asEvent(resolveSequenceWithRolls([3, 20], 1));
    const previews = extractPreviews(renderDetailTree(outcome));
    expect(previews.some((preview) => preview.id.startsWith('periodicCheckDoorOnly'))).toBe(
      false
    );
  });

  it('increments periodic door-only sequence as the chain grows', () => {
    const outcome = asEvent(resolveSequenceWithRolls([3, 1, 3, 12], 1));
    const previews = extractPreviews(renderDetailTree(outcome));
    const ids = previews.map((preview) => preview.id);
    expect(ids).toContain('periodicCheckDoorOnly:1');
  });

  it('renders the ignore narrative when the periodic door-only check finds nothing', () => {
    const outcome = asEvent(resolveSequenceWithRolls([3, 1, 1], 1));
    const detailNodes = renderDetailTree(outcome);
    const paragraph = detailNodes.find(
      (node) =>
        node.kind === 'paragraph' &&
        node.text.startsWith("There are no other doors. The main passage extends")
    );
    expect(paragraph).toBeDefined();
  });
});
