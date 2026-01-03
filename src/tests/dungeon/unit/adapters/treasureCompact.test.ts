import { renderTreasureCompactNodes } from '../../../../dungeon/adapters/render/treasure';
import { resolveTreasureSwords } from '../../../../dungeon/features/treasure/swords/swordsResolvers';
import type { OutcomeEventNode } from '../../../../dungeon/domain/outcome';
import { TreasureWithoutMonster } from '../../../../tables/dungeon/treasure';
import { TreasureMagicCategory } from '../../../../dungeon/features/treasure/magicCategory/magicCategoryTable';

function toEventNode(
  node: ReturnType<typeof resolveTreasureSwords>
): OutcomeEventNode {
  if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
    throw new Error('Expected treasureSwords event');
  }
  return node;
}

describe('renderTreasureCompactNodes', () => {
  it('includes sword primary abilities in compact summaries', () => {
    const swordsNode = toEventNode(
      resolveTreasureSwords({
        roll: 52,
        kindRoll: 40,
        unusualRoll: 80,
        alignmentRoll: 42,
        primaryAbilityRolls: [66],
      })
    );

    const magicNode: OutcomeEventNode = {
      type: 'event',
      roll: 37,
      event: {
        kind: 'treasureMagicCategory',
        result: TreasureMagicCategory.Swords,
        level: 1,
        treasureRoll: 37,
      },
      children: [swordsNode],
    };

    const treasureNode: OutcomeEventNode = {
      type: 'event',
      roll: 37,
      event: {
        kind: 'treasure',
        level: 1,
        withMonster: false,
        entries: [
          {
            roll: 37,
            command: TreasureWithoutMonster.Magic,
            magicCategory: TreasureMagicCategory.Swords,
          },
        ],
      },
      children: [magicNode],
    };

    const nodes = renderTreasureCompactNodes(treasureNode);
    const text = nodes
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text)
      .join(' ');

    expect(text).toContain(
      'The sword can detect gems, kind, and number in a 1/2" radius.'
    );
  });

  it('includes sword extraordinary powers in compact summaries', () => {
    const swordsNode = toEventNode(
      resolveTreasureSwords({
        roll: 18,
        kindRoll: 40,
        unusualRoll: 100,
        alignmentRoll: 42,
        primaryAbilityRolls: [34, 45, 66],
        extraordinaryPowerRolls: [42],
      })
    );

    const magicNode: OutcomeEventNode = {
      type: 'event',
      roll: 58,
      event: {
        kind: 'treasureMagicCategory',
        result: TreasureMagicCategory.Swords,
        level: 1,
        treasureRoll: 58,
      },
      children: [swordsNode],
    };

    const treasureNode: OutcomeEventNode = {
      type: 'event',
      roll: 58,
      event: {
        kind: 'treasure',
        level: 1,
        withMonster: false,
        entries: [
          {
            roll: 58,
            command: TreasureWithoutMonster.Magic,
            magicCategory: TreasureMagicCategory.Swords,
          },
        ],
      },
      children: [magicNode],
    };

    const nodes = renderTreasureCompactNodes(treasureNode);
    const text = nodes
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text)
      .join(' ');

    expect(text).toContain('The sword has heal — 1 time/day.');
  });
});
