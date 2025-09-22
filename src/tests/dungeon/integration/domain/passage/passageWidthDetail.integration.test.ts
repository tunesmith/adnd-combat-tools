import { resolvePassageWidth } from '../../../../../dungeon/domain/resolvers';
import { normalizeOutcomeTree } from '../../../../../dungeon/helpers/outcomeTree';
import { renderDetailTree } from '../../../../../dungeon/adapters/render';
import type { DungeonRenderNode } from '../../../../../types/dungeon';
import type { DungeonOutcomeNode } from '../../../../../dungeon/domain/outcome';

function detailNodesFor(node: DungeonOutcomeNode): DungeonRenderNode[] {
  const normalized = normalizeOutcomeTree(node);
  const event = normalized.type === 'event' ? normalized : undefined;
  if (!event) throw new Error('Expected event outcome');
  return renderDetailTree(event);
}

describe('Passage width detail behaviour', () => {
  test('Passage Width detail mode returns paragraph node', () => {
    const detailNodes = detailNodesFor(resolvePassageWidth({ roll: 1 }));
    const paras = detailNodes.filter(
      (
        m
      ): m is Extract<DungeonRenderNode, { kind: 'paragraph'; text: string }> =>
        m.kind === 'paragraph'
    );
    expect(paras.length).toBe(1);
    const first = paras[0];
    if (!first) throw new Error('Expected one paragraph');
    expect(typeof first.text).toBe('string');
  });
});
