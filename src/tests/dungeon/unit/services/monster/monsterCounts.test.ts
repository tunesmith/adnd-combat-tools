import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';
import { getNumberOfMonsters } from '../../../../../dungeon/features/monsters/monsterCounts';

describe('getNumberOfMonsters', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('reduces higher-level monsters on shallower dungeon levels to a minimum of one', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(3);

    expect(getNumberOfMonsters(3, 1, 1, 3)).toBe(1);
  });

  test('keeps same-level monster counts at their base range', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(4);

    expect(getNumberOfMonsters(3, 3, 1, 6, 1)).toBe(5);
  });

  test('multiplies lower-level monster counts for each deeper dungeon level', () => {
    const rollDiceSpy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockReturnValue(7);

    expect(getNumberOfMonsters(1, 2, 1, 4)).toBe(7);
    expect(rollDiceSpy).toHaveBeenCalledWith(4, 2);
  });

  test('multiplies both dice and fixed bonuses on deeper dungeon levels', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(11);

    expect(getNumberOfMonsters(1, 3, 2, 6, 3)).toBe(20);
  });
});
