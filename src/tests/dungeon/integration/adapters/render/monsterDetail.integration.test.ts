import { toCompactRender, toDetailRender } from '../../../../../dungeon/adapters/render';
import type { DungeonRenderNode } from '../../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import { MonsterOne } from '../../../../../tables/dungeon/monster/monsterOne';
import { MonsterLevel } from '../../../../../tables/dungeon/monster/monsterLevel';

function isParagraph(
  node: DungeonRenderNode
): node is Extract<DungeonRenderNode, { kind: 'paragraph'; text: string }> {
  return node.kind === 'paragraph';
}

function isPreview(
  node: DungeonRenderNode
): node is Extract<DungeonRenderNode, { kind: 'table-preview'; id: string }> {
  return node.kind === 'table-preview';
}

describe('Monster describe helpers', () => {
  test('monsterOne detail and compact reuse text', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 7,
      event: {
        kind: 'monsterOne',
        result: MonsterOne.Orc_7to12,
        dungeonLevel: 1,
        text: 'There are 6 orcs.',
      },
    };
    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text)).toEqual(['There are 6 orcs.']);

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toEqual([
      'There are 6 orcs.',
    ]);
  });

  test('monsterOne pending child renders preview in both modes', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 34,
      event: {
        kind: 'monsterOne',
        result: MonsterOne.Human,
        dungeonLevel: 1,
        text: undefined,
      },
      children: [
        {
          type: 'pending-roll',
          table: 'human',
          id: 'human:0',
          context: { kind: 'wandering', level: 1 },
        },
      ],
    };

    const detailPreviews = toDetailRender(outcome).filter(isPreview);
    expect(detailPreviews.map((p) => p.id)).toContain('human');

    const compactPreviews = toCompactRender(outcome).filter(isPreview);
    expect(compactPreviews.map((p) => p.id)).toContain('human');
  });

  test('monsterLevel produces placeholder when above level six', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 20,
      event: {
        kind: 'monsterLevel',
        result: MonsterLevel.Seven,
        dungeonLevel: 8,
      },
    };

    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text)).toEqual([
      '(TODO: Monster Level Seven preview)',
    ]);

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toEqual([
      '(TODO: Monster Level Seven preview)',
    ]);
  });
});
