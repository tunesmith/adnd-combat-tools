import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';
import { MonsterOne } from '../../../../../dungeon/features/monsters/monsterOne/monsterOneTables';
import { monsterOneTextForCommand } from '../../../../../dungeon/features/monsters/monsterOne/monsterOneResult';
import { MonsterSeven } from '../../../../../dungeon/features/monsters/monsterSeven/monsterSevenTables';
import { monsterSevenTextForCommand } from '../../../../../dungeon/features/monsters/monsterSeven/monsterSevenResult';

describe('Appendix C monster table transcription', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('monster level I elf count matches the DMG row of 3-11', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(8);

    expect(monsterOneTextForCommand(1, MonsterOne.Elf_3to11)).toBe(
      'There are 10 elves. '
    );
  });

  test('monster level VII spectre count is fixed at one', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(1);

    expect(monsterSevenTextForCommand(7, MonsterSeven.Spectre).text).toBe(
      'There is 1 spectre. '
    );
  });
});
