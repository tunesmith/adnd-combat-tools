import * as dungeonLookup from '../../../../../../dungeon/helpers/dungeonLookup';
import { getCharacterLevel } from '../../../../../../dungeon/helpers/character/level/getCharacterLevel';

describe('getCharacterLevel', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test to avoid interference
  });

  test('returns max of monsterLevel and dungeonLevel for dungeon levels <= 4', () => {
    expect(getCharacterLevel(2, 4)).toBe(4); // dungeonLevel > monsterLevel
    expect(getCharacterLevel(4, 2)).toBe(4); // monsterLevel > dungeonLevel
  });

  test('returns roll - 1 if roll > dungeonLevel', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(5); // roll = 11
    expect(getCharacterLevel(5, 8)).toBe(10);
  });

  test('returns roll + 1 if roll < dungeonLevel and roll < 12', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(4); // roll = 10
    expect(getCharacterLevel(5, 11)).toBe(11);
  });

  test('returns roll + 1 if roll < dungeonLevel and dungeonLevel >= 16', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(6); // roll = 12
    expect(getCharacterLevel(5, 16)).toBe(13);
  });

  test('returns roll if roll < dungeonLevel and roll is 12 and dungeon level < 16', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(6); // roll = 12
    expect(getCharacterLevel(5, 13)).toBe(12);
  });

  test('returns roll unmodified if roll is dungeon level and dungeonLevel > 4', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(1); // roll = 7
    expect(getCharacterLevel(5, 7)).toBe(7); // No modification
  });
});
