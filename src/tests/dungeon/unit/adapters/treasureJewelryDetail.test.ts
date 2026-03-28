import {
  renderTreasureCompactNodes,
  renderTreasureDetail,
} from '../../../../dungeon/features/treasure/treasure/treasureRender';
import type {
  OutcomeEventNode,
  TreasureEntry,
} from '../../../../dungeon/domain/outcome';
import { TreasureWithoutMonster } from '../../../../dungeon/features/treasure/treasure/treasureTable';

describe('jewelry rendering', () => {
  it('keeps detail prose but renders compact jewelry as an emphasized bullet list', () => {
    const entry: TreasureEntry = {
      roll: 42,
      command: TreasureWithoutMonster.JewelryPerLevel,
      quantity: 2,
      display: '2 pieces of jewelry',
      jewelry: [
        {
          type: 'ring',
          material: 'gold with gems',
          value: 12400,
          exceptionalQuality: true,
          exceptionalStone: false,
        },
        {
          type: 'crown',
          material: 'platinum with gems',
          value: 208000,
          exceptionalQuality: false,
          exceptionalStone: true,
        },
      ],
    };

    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 42,
      event: {
        kind: 'treasure',
        level: 1,
        withMonster: false,
        entries: [entry],
      },
    };

    const nodes = renderTreasureCompactNodes(outcome);
    const compactList = nodes.find(
      (node): node is Extract<typeof node, { kind: 'inline-bullet-list' }> =>
        node.kind === 'inline-bullet-list'
    );

    expect(compactList?.intro).toBe('There is jewelry:');
    expect(compactList?.items.map((item) => item.text)).toEqual([
      '1 ring of exceptional workmanship, made of gold with gems, worth 12,400 gp.',
      '1 crown made of platinum with gems, set with an exceptional stone, worth 208,000 gp.',
    ]);
    const firstItem = compactList?.items[0];
    expect(firstItem?.inline?.[0]).toEqual({
      kind: 'strong',
      text: '1 ring',
    });
    expect(firstItem?.inline).toContainEqual({
      kind: 'strong',
      text: '12,400 gp',
    });

    const detailText = renderTreasureDetail(outcome, () => undefined)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text)
      .join(' ');

    expect(detailText).toContain(
      'There is a ring of exceptional workmanship made of gold with gems (12,400 gp).'
    );
    expect(detailText).toContain(
      'There is a crown made of platinum with gems set with an exceptional stone (208,000 gp).'
    );
  });
});
