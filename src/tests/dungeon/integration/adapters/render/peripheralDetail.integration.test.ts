import { toDetailRender } from '../../../../../dungeon/adapters/render';
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

  test('illusory wall trap includes concealed result', () => {
    const trap = resolveTrickTrap({ roll: 19 }) as OutcomeEventNode;
    const nature = resolveIllusoryWallNature({ roll: 12 }) as OutcomeEventNode;
    const resolved: OutcomeEventNode = { ...trap, children: [nature] };
    const paragraphs = toDetailRender(resolved).filter(isParagraph);
    expect(paragraphs.map((p) => p.text)).toEqual([
      'There is an illusionary wall. ',
      'It conceals a chamber with a monster and treasure. ',
    ]);
  });
});
