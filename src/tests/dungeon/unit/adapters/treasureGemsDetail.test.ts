import {
  renderTreasureCompactNodes,
  renderTreasureDetail,
} from '../../../../dungeon/features/treasure/treasure/treasureRender';
import type { OutcomeEventNode } from '../../../../dungeon/domain/outcome';
import type {
  TreasureEntry,
  TreasureGemLot,
} from '../../../../dungeon/domain/treasureValueTypes';
import { TreasureWithoutMonster } from '../../../../dungeon/features/treasure/treasure/treasureTable';

describe('gem rendering', () => {
  it('omits gem value-adjustment notes in compact output but keeps them in detail', () => {
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
    const compactList = nodes.find(
      (node): node is Extract<typeof node, { kind: 'inline-bullet-list' }> =>
        node.kind === 'inline-bullet-list'
    );

    expect(compactList?.intro).toBe('There are gems:');
    expect(compactList?.items.map((item) => item.text)).toEqual([
      '10 ornamental stones (very small; translucent banded agate — striped brown and blue and white and reddish) worth 10 gp each.',
      '1 gem stone (very large) worth 1,100 gp.',
    ]);

    const detailText = renderTreasureDetail(outcome, () => undefined)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text)
      .join(' ');

    expect(detailText).toContain(
      'There is 1 gem stone (very large) worth 1,100 gp (+10%).'
    );
  });
});
