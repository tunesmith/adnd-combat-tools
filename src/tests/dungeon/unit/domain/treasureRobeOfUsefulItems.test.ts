import { resolveTreasureRobeOfUsefulItems } from '../../../../dungeon/features/treasure/miscMagicE5/miscMagicE5Resolvers';
import { toRobeOfUsefulItemsSummary } from '../../../../dungeon/features/treasure/miscMagicE5/miscMagicE5SubtablesRender';
import * as dungeonLookup from '../../../../dungeon/helpers/dungeonLookup';

describe('resolveTreasureRobeOfUsefulItems', () => {
  it('aggregates duplicate patches and handles roll twice results', () => {
    const { result, unused } = withMockedDice(
      [
        1,
        1,
        1,
        1, // 4d4 -> 4 requested patches
        5, // Bag of 100 gold pieces
        98, // Roll twice more
        84, // War dogs
        90, // War dogs
        30, // Gems
        15, // Coffer
      ],
      () => resolveTreasureRobeOfUsefulItems()
    );

    expect(unused).toHaveLength(0);
    if (result.type !== 'event') {
      throw new Error('expected event node');
    }
    expect(result.event.kind).toBe('treasureRobeOfUsefulItems');
    if (result.event.kind !== 'treasureRobeOfUsefulItems') {
      throw new Error('unexpected event kind');
    }

    const summary = toRobeOfUsefulItemsSummary(result.event.result);
    expect(summary.basePatchCount).toBe(12);
    expect(summary.requestedExtraPatchCount).toBe(4);
    expect(summary.extraPatchCount).toBe(5);
    const warDogs = summary.entries.find(
      (entry) => entry.label === 'War dogs, pair'
    );
    expect(warDogs?.count).toBe(2);
  });
});

function withMockedDice<T>(
  rolls: number[],
  fn: () => T
): { result: T; unused: number[] } {
  const queue = [...rolls];
  const originalRollDice = dungeonLookup.rollDice;
  const spy = jest
    .spyOn(dungeonLookup, 'rollDice')
    .mockImplementation((sides: number, count = 1) => {
      let total = 0;
      for (let i = 0; i < count; i += 1) {
        if (queue.length === 0) {
          total += originalRollDice.call(dungeonLookup, sides, count - i);
          break;
        }
        const value = queue.shift();
        if (value === undefined) {
          throw new Error('Ran out of predetermined rolls for rollDice.');
        }
        if (value < 1 || value > sides) {
          throw new Error(
            `Predetermined roll ${value} is invalid for d${sides}.`
          );
        }
        total += value;
      }
      return total;
    });
  try {
    const result = fn();
    return { result, unused: [...queue] };
  } finally {
    spy.mockRestore();
  }
}
