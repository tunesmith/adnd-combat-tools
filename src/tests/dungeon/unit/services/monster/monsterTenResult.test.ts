import {
  MonsterTen,
  DragonTen,
} from '../../../../../tables/dungeon/monster/monsterTen';
import {
  monsterTenTextForCommand,
  dragonTenTextForCommand,
} from '../../../../../dungeon/services/monster/monsterTenResult';
import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';

describe('monsterTenTextForCommand', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('demon prince instructs selection', () => {
    const result = monsterTenTextForCommand(10, MonsterTen.DemonPrince);
    expect(result.text).toContain('Select one or find randomly.');
  });

  test('arch-devil instructs selection', () => {
    const result = monsterTenTextForCommand(10, MonsterTen.DevilArch);
    expect(result.text).toContain('Select one or find randomly.');
  });

  test('vampire includes former magic-user note with rolled level', () => {
    jest.spyOn(dungeonLookup, 'rollDice').mockReturnValue(4);
    const result = monsterTenTextForCommand(10, MonsterTen.Vampire);
    expect(result.text).toContain('Former magic-user, with full powers');
    expect(result.text).toContain('12th-level');
  });

  test('attendant note appears when deeper than level ten', () => {
    const result = monsterTenTextForCommand(12, MonsterTen.Beholder);
    expect(result.text).toContain('2 attendants may be indicated');
  });
});

describe('dragonTenTextForCommand', () => {
  test('chromatic entry references Tiamat', () => {
    expect(dragonTenTextForCommand(10, DragonTen.Chromatic_Tiamat)).toContain(
      'Tiamat'
    );
  });

  test('attendant note appears for dragon subtable as well', () => {
    expect(
      dragonTenTextForCommand(12, DragonTen.Blue_Ancient_8_VeryOld_7)
    ).toContain('2 attendants may be indicated');
  });
});
