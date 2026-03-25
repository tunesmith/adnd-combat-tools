import { toDetailRender } from '../../../../../dungeon/adapters/render';
import { resolveDoorBeyond } from '../../../../../dungeon/features/navigation/entry/entryResolvers';
import {
  resolveDoorLocation,
  resolvePeriodicDoorOnly,
} from '../../../../../dungeon/features/navigation/doorChain/doorChainResolvers';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import type { DungeonRenderNode } from '../../../../../types/dungeon';

function isParagraph(
  node: DungeonRenderNode
): node is Extract<DungeonRenderNode, { kind: 'paragraph'; text: string }> {
  return node.kind === 'paragraph';
}

describe('Door beyond helpers', () => {
  test('parallel passage branches reuse shared helper', () => {
    const outcome = resolveDoorBeyond({
      roll: 1,
      doorAhead: false,
    }) as OutcomeEventNode;
    const paragraphs = toDetailRender(outcome).filter(isParagraph);
    expect(paragraphs.map((p) => p.text)).toContain(
      "Beyond the door is a parallel passage, extending 30' in both directions. "
    );
  });

  test('door chain ignore path renders shared text', () => {
    const periodic = resolvePeriodicDoorOnly({
      roll: 1,
      existing: ['Left'],
    }) as OutcomeEventNode;
    const paragraphs = toDetailRender(periodic).filter(isParagraph);
    expect(paragraphs.map((p) => p.text)).toEqual([
      "There are no other doors. The main passage extends -- check again in 30'. ",
    ]);
    const location = resolveDoorLocation({
      roll: 1,
    }) as OutcomeEventNode;
    const detailLocation = toDetailRender(location).filter(isParagraph);
    expect(detailLocation.map((p) => p.text.trim())).toEqual([
      'A door is to the Left.',
    ]);
  });
});
