import { CharacterRace } from '../../../../../tables/dungeon/monster/character/characterRace';
import { CharacterClass } from '../../../../../dungeon/models/characterClass';
import { Attribute } from '../../../../../dungeon/models/attributes';
import { getProfessions } from '../../../../../dungeon/helpers/character/getProfessions';

describe('getProfessions', () => {
  const baseAttributes = {
    [Attribute.Strength]: 18,
    [Attribute.Intelligence]: 18,
    [Attribute.Wisdom]: 18,
    [Attribute.Dexterity]: 18,
    [Attribute.Constitution]: 18,
    [Attribute.Charisma]: 18,
  } as const;

  test('redistributes excess levels for halfling fighter/thief', () => {
    const professions = getProfessions(
      CharacterRace.Halfling,
      [CharacterClass.Fighter, CharacterClass.Thief],
      {
        ...baseAttributes,
        [Attribute.Strength]: 15,
        [Attribute.Dexterity]: 17,
      },
      10
    );

    const fighter = professions.find(
      (profession) => profession.characterClass === CharacterClass.Fighter
    );
    const thief = professions.find(
      (profession) => profession.characterClass === CharacterClass.Thief
    );

    expect(fighter?.level).toBe(4); // Halfling fighter cap
    expect(thief?.level).toBeGreaterThanOrEqual(7);
  });

  test('distributes excess cleric levels across remaining classes for half-elf triple class', () => {
    const professions = getProfessions(
      CharacterRace.HalfElf,
      [CharacterClass.Cleric, CharacterClass.Fighter, CharacterClass.MagicUser],
      {
        ...baseAttributes,
        [Attribute.Strength]: 18,
        [Attribute.Intelligence]: 18,
        [Attribute.Wisdom]: 18,
      },
      18
    );

    const cleric = professions.find(
      (profession) => profession.characterClass === CharacterClass.Cleric
    );
    const fighter = professions.find(
      (profession) => profession.characterClass === CharacterClass.Fighter
    );
    const magicUser = professions.find(
      (profession) => profession.characterClass === CharacterClass.MagicUser
    );

    expect(cleric?.level).toBeLessThan(7);
    expect(cleric?.level).toBe(5);
    expect(fighter?.level).toBe(8);
    expect(magicUser?.level).toBe(8);
  });
});
