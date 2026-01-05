import { renderTreasureCompactNodes } from '../../../../dungeon/features/treasure/treasure/treasureRender';
import type {
  OutcomeEventNode,
  TreasureEntry,
} from '../../../../dungeon/domain/outcome';
import { TreasureWithoutMonster } from '../../../../dungeon/features/treasure/treasure/treasureTable';

describe('jewelry rendering', () => {
  it('lists detailed jewelry descriptions', () => {
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
    const text = nodes
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text)
      .join(' ');

    expect(text).toContain(
      'There is a ring of exceptional workmanship made of gold with gems (12,400 gp).'
    );
    expect(text).toContain(
      'There is a crown made of platinum with gems set with an exceptional stone (208,000 gp).'
    );
  });
});
