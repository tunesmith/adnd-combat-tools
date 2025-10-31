import { isOthersAlignmentCompatible } from '../../../../../dungeon/helpers/party/isOthersAlignmentCompatible';
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
    professions: classes.map((c) => ({ level: 1, characterClass: c })),
    characterRace: CharacterRace.Human,
    attributes: baseAttributes(),
    gender: Gender.Male,
    hitPoints: 8,
    isBard: false,
    bardLevels: baseBardLevels,
    followers: [],
    alignment,
  };
}

describe('isOthersAlignmentCompatible', () => {
  it('blocks Paladin from joining a party with a Lawful Evil Thief', () => {
    const paladin = buildCharacter([CharacterClass.Paladin], Alignment.LawfulGood);
    const thiefLE = buildCharacter([CharacterClass.Thief], Alignment.LawfulEvil);
    expect(isOthersAlignmentCompatible(paladin, [thiefLE])).toBe(false);
  });

  it('blocks Lawful Evil Thief from joining a party with a Paladin', () => {
    const paladin = buildCharacter([CharacterClass.Paladin], Alignment.LawfulGood);
    const thiefLE = buildCharacter([CharacterClass.Thief], Alignment.LawfulEvil);
    expect(isOthersAlignmentCompatible(thiefLE, [paladin])).toBe(false);
  });

  it('blocks Ranger from joining a party with any Evil alignment', () => {
    const ranger = buildCharacter([CharacterClass.Ranger], Alignment.NeutralGood);
    const evilFighter = buildCharacter([CharacterClass.Fighter], Alignment.ChaoticEvil);
    expect(isOthersAlignmentCompatible(ranger, [evilFighter])).toBe(false);
  });

  it('allows Paladin to join an all-Good party', () => {
    const paladin = buildCharacter([CharacterClass.Paladin], Alignment.LawfulGood);
    const cgFighter = buildCharacter([CharacterClass.Fighter], Alignment.ChaoticGood);
    const ngCleric = buildCharacter([CharacterClass.Cleric], Alignment.NeutralGood);
    expect(isOthersAlignmentCompatible(paladin, [cgFighter, ngCleric])).toBe(true);
  });
});
