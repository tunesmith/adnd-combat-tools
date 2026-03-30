import { CharacterClass } from '../../../../../dungeon/models/characterClass';
import { CharacterRace } from '../../../../../tables/dungeon/monster/character/characterRace';
import { Attribute } from '../../../../../dungeon/models/attributes';
import { Gender } from '../../../../../dungeon/models/character/gender';
import { Alignment } from '../../../../../dungeon/models/allowedAlignmentsByClass';
import * as raceModule from '../../../../../dungeon/helpers/character/getCharacterRace';
import * as classCountModule from '../../../../../dungeon/helpers/character/class/getNumberOfClasses';
import * as singleModule from '../../../../../dungeon/helpers/character/getSingleClassCharacterForRace';
import * as multiModule from '../../../../../dungeon/helpers/character/getMultiClassCharacterForRace';
import { createCharacters } from '../../../../../dungeon/services/monster/characterResult';

describe('createCharacters fallback', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('promotes limited single-class result to multi-class including forced class', () => {
    jest
      .spyOn(raceModule, 'getCharacterRace')
      .mockReturnValue(CharacterRace.Elf);
    jest.spyOn(classCountModule, 'getNumberOfClasses').mockReturnValue(1);
    jest
      .spyOn(singleModule, 'getSingleClassCharacterForRace')
      .mockImplementation(() => {
        throw new singleModule.LimitedClassFallbackError(
          CharacterClass.Fighter
        );
      });

    const multiSpy = jest
      .spyOn(multiModule, 'getMultiClassCharacterForRace')
      .mockReturnValue({
        professions: [
          { characterClass: CharacterClass.Fighter, level: 4 },
          { characterClass: CharacterClass.MagicUser, level: 6 },
        ],
        characterRace: CharacterRace.Elf,
        attributes: {
          [Attribute.Strength]: 16,
          [Attribute.Intelligence]: 17,
          [Attribute.Wisdom]: 12,
          [Attribute.Dexterity]: 15,
          [Attribute.Constitution]: 14,
          [Attribute.Charisma]: 13,
        },
        gender: Gender.Male,
        hitPoints: 18,
        isBard: false,
        bardLevels: {
          [CharacterClass.Fighter]: 0,
          [CharacterClass.Thief]: 0,
          [CharacterClass.Bard]: 0,
        },
        followers: [],
        alignment: Alignment.NeutralGood,
      });

    const characters = createCharacters(1, 8);

    expect(multiSpy).toHaveBeenCalled();
    const callArgs = multiSpy.mock.calls[0];
    expect(callArgs).toBeDefined();
    if (!callArgs) {
      throw new Error('Expected multi-class generator to be invoked');
    }
    const [raceArg, classCountArg, levelArg, requiredClassesArg] = callArgs;
    expect(raceArg).toBe(CharacterRace.Elf);
    expect(levelArg).toBe(8);
    expect(classCountArg).toBeGreaterThanOrEqual(2);
    expect(requiredClassesArg).toContain(CharacterClass.Fighter);

    expect(characters).toHaveLength(1);
    expect(characters[0]?.professions).toHaveLength(2);
  });
});
