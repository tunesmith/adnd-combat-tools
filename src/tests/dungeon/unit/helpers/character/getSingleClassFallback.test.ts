import { CharacterClass } from '../../../../../dungeon/models/characterClass';
import { CharacterRace } from '../../../../../tables/dungeon/monster/character/characterRace';
import * as classModule from '../../../../../dungeon/helpers/character/class/getCharacterClass';
import {
  getSingleClassCharacterForRace,
  LimitedClassFallbackError,
} from '../../../../../dungeon/helpers/character/getSingleClassCharacterForRace';

describe('getSingleClassCharacterForRace', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('throws LimitedClassFallbackError when race cannot take rolled class', () => {
    jest
      .spyOn(classModule, 'getCharacterClass')
      .mockReturnValue(CharacterClass.Paladin);

    expect(() =>
      getSingleClassCharacterForRace(CharacterRace.Dwarf, 5)
    ).toThrow(LimitedClassFallbackError);
  });
});
