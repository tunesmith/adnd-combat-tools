import { resolvePassageWidth } from '../../../../../dungeon/features/navigation/passageWidth/passageWidthResolvers';
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

  test('Passage Width follows Appendix A boundary ranges', () => {
    const rolls = [
      { roll: 12, text: "The passage is 10' wide." },
      { roll: 13, text: "The passage is 20' wide." },
      { roll: 17, text: "The passage is 30' wide." },
      { roll: 18, text: "The passage is 5' wide." },
    ];

    for (const { roll, text } of rolls) {
      const detailNodes = detailNodesFor(resolvePassageWidth({ roll }));
      expect(
        detailNodes.some(
          (node) => node.kind === 'paragraph' && node.text.includes(text)
        )
      ).toBe(true);
    }

    const specialNodes = detailNodesFor(resolvePassageWidth({ roll: 19 }));
    expect(
      collectTablePreviewIds(specialNodes).includes('specialPassage')
    ).toBe(true);
  });
});

function collectTablePreviewIds(nodes: DungeonRenderNode[]): string[] {
  return nodes
    .filter(
      (
        node
      ): node is Extract<DungeonRenderNode, { kind: 'table-preview'; id: string }> =>
        node.kind === 'table-preview'
    )
    .map((node) => node.id);
}
