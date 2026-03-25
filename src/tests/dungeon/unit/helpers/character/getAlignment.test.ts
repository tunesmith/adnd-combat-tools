import * as dungeonRandom from '../../../../../dungeon/helpers/dungeonRandom';
import { getAlignmentForClasses } from '../../../../../dungeon/helpers/character/getAlignment';
import { Alignment } from '../../../../../dungeon/models/allowedAlignmentsByClass';
import { CharacterClass } from '../../../../../dungeon/models/characterClass';

describe('getAlignmentForClasses', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses dungeon RNG when choosing among compatible alignments', () => {
    const randomSpy = jest
      .spyOn(dungeonRandom, 'nextDungeonRandomInt')
      .mockReturnValue(2);

    expect(getAlignmentForClasses([CharacterClass.Ranger])).toBe(
      Alignment.NeutralGood
    );
    expect(randomSpy).toHaveBeenCalledWith(3);
  });
});
