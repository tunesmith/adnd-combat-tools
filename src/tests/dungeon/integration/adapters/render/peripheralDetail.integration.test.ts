import {
  renderDetailTree,
  toDetailRender,
} from '../../../../../dungeon/adapters/render';
import {
  resolvePeriodicDoorOnly,
  resolveTrickTrap,
  resolveIllusoryWallNature,
} from '../../../../../dungeon/domain/resolvers';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import type { DungeonRenderNode } from '../../../../../types/dungeon';

function isParagraph(
  node: DungeonRenderNode
): node is Extract<DungeonRenderNode, { kind: 'paragraph'; text: string }> {
  return node.kind === 'paragraph';
}

function isPreview(
  node: DungeonRenderNode
): node is Extract<DungeonRenderNode, { kind: 'table-preview' }> {
  return node.kind === 'table-preview';
}

describe('Detail helpers for door chains and traps', () => {
  test('periodic door only Ignore uses describe helper output', () => {
    const outcome = resolvePeriodicDoorOnly({
      roll: 1,
      existing: ['Left'],
      sequence: 1,
    }) as OutcomeEventNode;
    const paragraphs = toDetailRender(outcome).filter(isParagraph);
    expect(paragraphs.map((p) => p.text)).toEqual([
      "There are no other doors. The main passage extends -- check again in 30'. ",
    ]);
  });

  test('trick trap describes placeholder text with roll', () => {
    const outcome = resolveTrickTrap({ roll: 12 }) as OutcomeEventNode;
    const paragraphs = toDetailRender(outcome).filter(isParagraph);
    expect(paragraphs.map((p) => p.text)).toEqual([
      "Wall 10' behind slides across passage blocking it for 40–60 turns. ",
    ]);
  });

  test('illusory wall detail tree includes preview and resolved description', () => {
    const trap = resolveTrickTrap({ roll: 19 }) as OutcomeEventNode;
    const nature = resolveIllusoryWallNature({ roll: 12 }) as OutcomeEventNode;
    const resolved: OutcomeEventNode = { ...trap, children: [nature] };
    const nodes = renderDetailTree(resolved);
    const paragraphs = nodes.filter(isParagraph).map((p) => p.text);
    expect(paragraphs).toContain('There is an illusionary wall. ');
    expect(paragraphs).toContain(
      'It conceals a chamber with a monster and treasure. '
    );
    const previews = nodes.filter(isPreview);
    expect(previews.map((preview) => preview.id)).toContain(
      'illusoryWallNature'
    );
  });
});
