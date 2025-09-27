import type { CharacterSheet } from '../../models/character/characterSheet';
import { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import { CharacterClass } from '../../models/characterClass';
import { getCharacterGender } from './getCharacterGender';
import { getAttributes } from './attributes/getAttributes';
import { getHitPoints } from './getHitPoints';

export const createMenAtArms = (master: CharacterSheet): CharacterSheet => {
  const gender = getCharacterGender();
  const attributes = getAttributes(
    [CharacterClass.ManAtArms],
    CharacterRace.Human,
    gender
  );
  const hitPoints = getHitPoints(
    [{ level: 1, characterClass: CharacterClass.ManAtArms }],
    attributes.CON
  );

  return {
    professions: [],
    characterRace: CharacterRace.Human,
    attributes,
    gender,
    hitPoints,
    isBard: false,
    bardLevels: {
      [CharacterClass.Fighter]: 0,
      [CharacterClass.Thief]: 0,
      [CharacterClass.Bard]: 0,
    },
    followers: [],
    alignment: master.alignment,
    isManAtArms: true,
  };
};
