import {
  renderDetailTree,
  toDetailRender,
} from '../../../../../dungeon/adapters/render';
import {
  resolvePeriodicDoorOnly,
  resolveTrickTrap,
  resolveIllusionaryWallNature,
  resolveGasTrapEffect,
} from '../../../../../dungeon/domain/resolvers';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import type { DungeonRenderNode } from '../../../../../types/dungeon';
import { ChamberRoomContents } from '../../../../../tables/dungeon/chamberRoomContents';

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

  test('illusionary wall detail tree includes preview and resolved description', () => {
    const trap = resolveTrickTrap({ roll: 19 }) as OutcomeEventNode;
    const nature = resolveIllusionaryWallNature({
      roll: 12,
    }) as OutcomeEventNode;
    const chamberPending = nature.children?.find(
      (child) =>
        child.type === 'pending-roll' && child.table === 'chamberDimensions'
    );
    expect(chamberPending).toBeDefined();
    if (!chamberPending || chamberPending.type !== 'pending-roll') {
      throw new Error('Expected chamber dimensions pending roll');
    }
    expect(chamberPending.context).toEqual(
      expect.objectContaining({
        kind: 'chamberDimensions',
        forcedContents: ChamberRoomContents.MonsterAndTreasure,
      })
    );
    const resolved: OutcomeEventNode = { ...trap, children: [nature] };
    const nodes = renderDetailTree(resolved);
    const paragraphs = nodes.filter(isParagraph).map((p) => p.text);
    expect(paragraphs).toContain('There is an illusionary wall. ');
    expect(paragraphs).toContain('It conceals a chamber. ');
    const previews = nodes.filter(isPreview);
    expect(previews.map((preview) => preview.id)).toContain(
      'illusionaryWallNature'
    );
  });

  test('gas trap detail tree includes preview and resolved description', () => {
    const trap = resolveTrickTrap({ roll: 17 }) as OutcomeEventNode;
    const gas = resolveGasTrapEffect({ roll: 20 }) as OutcomeEventNode;
    const resolved: OutcomeEventNode = { ...trap, children: [gas] };
    const nodes = renderDetailTree(resolved);
    const paragraphs = nodes.filter(isParagraph).map((p) => p.text);
    expect(paragraphs).toContain(
      "Gas; party has detected it, but must breathe it to continue along corridor, as it covers 60' ahead. Mark map accordingly regardless of turning back or not. (See TABLE VII. A.) "
    );
    expect(paragraphs).toContain(
      'Poison: killed unless saving throw versus poison is made. '
    );
    const previews = nodes.filter(isPreview);
    expect(previews.map((preview) => preview.id)).toContain('gasTrapEffect');
  });
});
