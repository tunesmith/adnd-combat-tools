import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';
import * as dungeonRandom from '../../../../../dungeon/helpers/dungeonRandom';
import { getCharacterClass } from '../../../../../dungeon/helpers/character/class/getCharacterClass';
import { CharacterClass } from '../../../../../dungeon/models/characterClass';

describe('getCharacterClass', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses dungeon RNG to break monk or bard ties', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(100);
    const randomSpy = jest
      .spyOn(dungeonRandom, 'nextDungeonRandomInt')
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2);

    expect(getCharacterClass()).toBe(CharacterClass.Monk);
    expect(getCharacterClass()).toBe(CharacterClass.Bard);
    expect(randomSpy).toHaveBeenCalledWith(2);
  });
});
