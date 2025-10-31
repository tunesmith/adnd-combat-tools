import {
  createCharacters,
  generateFollowers,
} from '../../../../../dungeon/services/monster/characterResult';
import * as characterResultModule from '../../../../../dungeon/services/monster/characterResult';
import * as getSingleModule from '../../../../../dungeon/helpers/character/getSingleClassCharacterForRace';
import * as getNumClassesModule from '../../../../../dungeon/helpers/character/class/getNumberOfClasses';
import type { CharacterSheet } from '../../../../../dungeon/models/character/characterSheet';
import { CharacterClass } from '../../../../../dungeon/models/characterClass';
import { CharacterRace } from '../../../../../tables/dungeon/monster/character/characterRace';
import { Gender } from '../../../../../dungeon/models/character/gender';
import { Attribute } from '../../../../../dungeon/models/attributes';
import { Alignment } from '../../../../../dungeon/models/allowedAlignmentsByClass';

const baseBardLevels = {
  [CharacterClass.Fighter]: 0,
  [CharacterClass.Thief]: 0,
  [CharacterClass.Bard]: 0,
};

const baseAttributes = (): Record<Attribute, number> => ({
  [Attribute.Strength]: 12,
  [Attribute.Intelligence]: 12,
  [Attribute.Wisdom]: 12,
  [Attribute.Dexterity]: 12,
  [Attribute.Constitution]: 12,
  [Attribute.Charisma]: 12,
});

function buildCharacter(
  classes: CharacterClass[],
  alignment: Alignment
): CharacterSheet {
  return {
    professions: classes.map((c) => ({ level: 3, characterClass: c })),
    characterRace: CharacterRace.Human,
    attributes: baseAttributes(),
    gender: Gender.Male,
    hitPoints: 18,
    isBard: false,
    bardLevels: baseBardLevels,
    followers: [],
    alignment,
  };
}

describe('party alignment integration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("doesn't admit Paladin into non-Good party via createCharacters", () => {
    const existingParty: CharacterSheet[] = [
      buildCharacter([CharacterClass.Fighter], Alignment.ChaoticNeutral),
    ];

    // Force single-class generation path
    jest.spyOn(getNumClassesModule, 'getNumberOfClasses').mockReturnValue(1);
    // Force candidate to be a Paladin (LG)
    jest
      .spyOn(getSingleModule, 'getSingleClassCharacterForRace')
      .mockImplementation(() => buildCharacter([CharacterClass.Paladin], Alignment.LawfulGood));

    const generated = createCharacters(1, 4, existingParty);
    expect(generated).toHaveLength(0); // rejected by party "others" alignment rule
  });

  test("followers respect Paladin's party alignment constraints", () => {
    const paladinLeader = buildCharacter(
      [CharacterClass.Paladin],
      Alignment.LawfulGood
    );
    const mainParty: CharacterSheet[] = [paladinLeader];

    // Stub createCharacters to return an Evil Assassin henchman candidate
    const evilAssassin = buildCharacter(
      [CharacterClass.Assassin],
      Alignment.ChaoticEvil
    );
    jest
      .spyOn(characterResultModule, 'createCharacters')
      .mockReturnValue([evilAssassin]);

    generateFollowers(mainParty, 1, 2);
    expect(mainParty[0]?.followers.length).toBe(0); // rejected
  });
});

