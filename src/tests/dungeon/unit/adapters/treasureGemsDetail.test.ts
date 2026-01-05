import { renderTreasureCompactNodes } from '../../../../dungeon/features/treasure/treasure/treasureRender';
import type {
  OutcomeEventNode,
  TreasureEntry,
  TreasureGemLot,
} from '../../../../dungeon/domain/outcome';
import { TreasureWithoutMonster } from '../../../../dungeon/features/treasure/treasure/treasureTable';

describe('gem rendering', () => {
  it('lists detailed gem lot descriptions', () => {
    const lots: TreasureGemLot[] = [
      {
        count: 10,
        category: {
          id: 'ornamental',
          description: 'Ornamental Stones',
          typicalSize: 'very small',
        },
        baseValue: 10,
        baseValueStep: 4,
        finalBaseStep: 4,
        size: 'very small',
        value: 10,
        adjustment: { type: 'unchanged' },
        kind: {
          name: 'Banded Agate',
          description: 'striped brown and blue and white and reddish',
          property: 'translucent',
        },
      },
      {
        count: 1,
        category: {
          id: 'gem',
          description: 'Gem Stones',
          typicalSize: 'very large',
        },
        baseValue: 1000,
        baseValueStep: 8,
        finalBaseStep: 8,
        size: 'very large',
        value: 1100,
        adjustment: { type: 'increasePercent', percent: 10 },
      },
    ];

    const entry: TreasureEntry = {
      roll: 42,
      command: TreasureWithoutMonster.GemsPerLevel,
      quantity: 11,
      display: '11 gems',
      gems: lots,
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
      'There are 10 ornamental stones (very small; translucent banded agate — striped brown and blue and white and reddish) worth 10 gp each.'
    );
    expect(text).toContain(
      'There is 1 gem stone (very large) worth 1,100 gp (+10%).'
    );
  });
});
