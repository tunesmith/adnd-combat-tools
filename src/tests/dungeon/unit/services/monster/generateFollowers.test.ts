import { generateFollowers } from '../../../../../dungeon/services/monster/characterResult';
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

const buildAssassinMember = (): CharacterSheet => ({
  professions: [{ level: 1, characterClass: CharacterClass.Assassin }],
  characterRace: CharacterRace.Human,
  attributes: {
    [Attribute.Strength]: 12,
    [Attribute.Intelligence]: 12,
    [Attribute.Wisdom]: 12,
    [Attribute.Dexterity]: 12,
    [Attribute.Constitution]: 12,
    [Attribute.Charisma]: 7,
  },
  gender: Gender.Female,
  hitPoints: 6,
  isBard: false,
  bardLevels: baseBardLevels,
  followers: [],
  alignment: Alignment.ChaoticEvil,
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
