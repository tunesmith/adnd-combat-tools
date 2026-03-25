import { generateFollowers } from '../../../../../dungeon/services/monster/characterResult';
import * as characterResultModule from '../../../../../dungeon/services/monster/characterResult';
import type { CharacterSheet } from '../../../../../dungeon/models/character/characterSheet';
import { CharacterClass } from '../../../../../dungeon/models/characterClass';
import { CharacterRace } from '../../../../../tables/dungeon/monster/character/characterRace';
import { Gender } from '../../../../../dungeon/models/character/gender';
import { Alignment } from '../../../../../dungeon/models/allowedAlignmentsByClass';
import { Attribute } from '../../../../../dungeon/models/attributes';

const baseBardLevels = {
  [CharacterClass.Fighter]: 0,
  [CharacterClass.Thief]: 0,
  [CharacterClass.Bard]: 0,
};

const buildAttributes = (): Record<Attribute, number> => ({
  [Attribute.Strength]: 12,
  [Attribute.Intelligence]: 12,
  [Attribute.Wisdom]: 12,
  [Attribute.Dexterity]: 12,
  [Attribute.Constitution]: 12,
  [Attribute.Charisma]: 16,
});

const buildPartyMember = (alignment: Alignment): CharacterSheet => ({
  professions: [{ level: 5, characterClass: CharacterClass.Fighter }],
  characterRace: CharacterRace.Human,
  attributes: buildAttributes(),
  gender: Gender.Male,
  hitPoints: 20,
  isBard: false,
  bardLevels: baseBardLevels,
  followers: [],
  alignment,
});

const buildCharacterWithProfessions = (
  professions: CharacterSheet['professions'],
  alignment: Alignment,
  charisma = 16
): CharacterSheet => ({
  professions,
  characterRace: CharacterRace.Human,
  attributes: {
    [Attribute.Strength]: 12,
    [Attribute.Intelligence]: 12,
    [Attribute.Wisdom]: 12,
    [Attribute.Dexterity]: 12,
    [Attribute.Constitution]: 12,
    [Attribute.Charisma]: charisma,
  },
  gender: Gender.Female,
  hitPoints: 20,
  isBard: false,
  bardLevels: baseBardLevels,
  followers: [],
  alignment,
});

const buildCharacter = (
  characterClass: CharacterClass,
  alignment: Alignment,
  level = 5,
  charisma = 16
): CharacterSheet =>
  buildCharacterWithProfessions(
    [{ level, characterClass }],
    alignment,
    charisma
  );

const buildAssassinMember = (): CharacterSheet =>
  buildCharacter(CharacterClass.Assassin, Alignment.ChaoticEvil, 1, 7);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('generateFollowers men-at-arms', () => {
  it('rotates men-at-arms among eligible party members', () => {
    const party: CharacterSheet[] = [
      buildPartyMember(Alignment.LawfulGood),
      buildPartyMember(Alignment.TrueNeutral),
    ];

    generateFollowers(party, 2, 0);

    const firstMember = party[0];
    const secondMember = party[1];
    expect(firstMember).toBeDefined();
    expect(secondMember).toBeDefined();
    if (!firstMember || !secondMember) return;
    expect(firstMember.followers).toHaveLength(1);
    expect(secondMember.followers).toHaveLength(1);

    [firstMember, secondMember].forEach((member) => {
      const follower = member.followers[0];
      expect(follower).toBeDefined();
      if (!follower) return;
      expect(follower.isManAtArms).toBe(true);
      expect(follower.professions).toHaveLength(0);
      expect(follower.hitPoints).toBeGreaterThanOrEqual(1);
    });
  });

  it('lets low-level assassins recruit men-at-arms despite henchmen limits', () => {
    const assassin = buildAssassinMember();

    generateFollowers([assassin], 3, 0);

    expect(assassin.followers).toHaveLength(3);
    assassin.followers.forEach((follower) => {
      expect(follower.isManAtArms).toBe(true);
    });
  });
});

describe('generateFollowers class restrictions', () => {
  it('rejects cleric henchmen for monks', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([
        buildCharacter(CharacterClass.Cleric, Alignment.LawfulNeutral, 2),
      ]);

    const monk = buildCharacter(
      CharacterClass.Monk,
      Alignment.LawfulNeutral,
      6
    );
    generateFollowers([monk], 1, 2);

    expect(monk.followers).toHaveLength(0);
  });

  it('accepts thief henchmen for monks', () => {
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([
        buildCharacter(CharacterClass.Thief, Alignment.TrueNeutral, 2),
      ]);

    const monk = buildCharacter(
      CharacterClass.Monk,
      Alignment.LawfulNeutral,
      6
    );
    generateFollowers([monk], 1, 2);

    expect(monk.followers).toHaveLength(1);
    expect(monk.followers[0]?.professions[0]?.characterClass).toBe(
      CharacterClass.Thief
    );
  });

  it('accepts compatible multi-class henchmen for monks', () => {
    jest.spyOn(characterResultModule, 'createCharacters').mockReturnValue([
      buildCharacterWithProfessions(
        [
          { level: 2, characterClass: CharacterClass.Fighter },
          { level: 2, characterClass: CharacterClass.Thief },
        ],
        Alignment.TrueNeutral
      ),
    ]);

    const monk = buildCharacter(
      CharacterClass.Monk,
      Alignment.LawfulNeutral,
      6
    );
    generateFollowers([monk], 1, 2);

    expect(monk.followers).toHaveLength(1);
    expect(monk.followers[0]?.professions).toEqual([
      { level: 2, characterClass: CharacterClass.Fighter },
      { level: 2, characterClass: CharacterClass.Thief },
    ]);
  });

  it('caps monk henchmen by charisma', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([
        buildCharacter(CharacterClass.Thief, Alignment.TrueNeutral, 2),
      ]);

    const monk = buildCharacter(
      CharacterClass.Monk,
      Alignment.LawfulNeutral,
      8,
      7
    );
    generateFollowers([monk], 4, 2);

    expect(monk.followers).toHaveLength(3);
  });

  it('rejects thief henchmen for low-level assassins', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([
        buildCharacter(CharacterClass.Thief, Alignment.ChaoticEvil, 2),
      ]);

    const assassin = buildCharacter(
      CharacterClass.Assassin,
      Alignment.ChaoticEvil,
      4
    );
    generateFollowers([assassin], 1, 2);

    expect(assassin.followers).toHaveLength(0);
  });

  it('accepts thief henchmen for assassins starting at level 8', () => {
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([
        buildCharacter(CharacterClass.Thief, Alignment.ChaoticEvil, 2),
      ]);

    const assassin = buildCharacter(
      CharacterClass.Assassin,
      Alignment.ChaoticEvil,
      8
    );
    generateFollowers([assassin], 1, 2);

    expect(assassin.followers).toHaveLength(1);
    expect(assassin.followers[0]?.professions[0]?.characterClass).toBe(
      CharacterClass.Thief
    );
  });

  it('accepts unrestricted henchmen for assassins starting at level 12', () => {
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([
        buildCharacter(CharacterClass.Fighter, Alignment.ChaoticNeutral, 2),
      ]);

    const assassin = buildCharacter(
      CharacterClass.Assassin,
      Alignment.ChaoticEvil,
      12
    );
    generateFollowers([assassin], 1, 2);

    expect(assassin.followers).toHaveLength(1);
    expect(assassin.followers[0]?.professions[0]?.characterClass).toBe(
      CharacterClass.Fighter
    );
  });

  it('uses the more restrictive rule set for multi-class leaders', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([
        buildCharacter(CharacterClass.Thief, Alignment.ChaoticEvil, 2),
      ]);

    const clericAssassin = buildCharacterWithProfessions(
      [
        { level: 4, characterClass: CharacterClass.Cleric },
        { level: 4, characterClass: CharacterClass.Assassin },
      ],
      Alignment.ChaoticEvil
    );
    generateFollowers([clericAssassin], 1, 2);

    expect(clericAssassin.followers).toHaveLength(0);
  });

  it('applies the strictest count restriction for multi-class leaders', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([
        buildCharacter(CharacterClass.Assassin, Alignment.ChaoticEvil, 2),
      ]);

    const rangerAssassin = buildCharacterWithProfessions(
      [
        { level: 7, characterClass: CharacterClass.Ranger },
        { level: 7, characterClass: CharacterClass.Assassin },
      ],
      Alignment.ChaoticEvil
    );
    generateFollowers([rangerAssassin], 1, 2);

    expect(rangerAssassin.followers).toHaveLength(0);
  });
});
