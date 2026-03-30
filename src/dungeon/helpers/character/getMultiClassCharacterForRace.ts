import type { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import type { CharacterSheet } from '../../models/character/characterSheet';
import { getMultiClassForRace } from './class/getMultiClassForRace';
import { getCharacterGender } from './getCharacterGender';
import { getAttributes } from './attributes/getAttributes';
import { getProfessions } from './getProfessions';
import { getHitPoints } from './getHitPoints';
import { CharacterClass } from '../../models/characterClass';
import { getAlignmentForClasses } from './getAlignment';

/**
 * Similar to {@link getSingleClassCharacterForRace}, although simpler to meet
 * level restrictions, since levels are allocated among multiple classes.
 *
 * @param characterRace
 * @param numClasses
 * @param characterLevel
 * @param requiredClasses
 */
export function getMultiClassCharacterForRace(
  characterRace: CharacterRace,
  numClasses: number,
  characterLevel: number,
  requiredClasses: CharacterClass[] = []
): CharacterSheet {
  const selectedClasses = getMultiClassForRace(
    characterRace,
    numClasses,
    requiredClasses
  );
  const gender = getCharacterGender();
  const attributes = getAttributes(selectedClasses, characterRace, gender);
  const professions = getProfessions(
    characterRace,
    selectedClasses,
    attributes,
    characterLevel
  );

  return {
    gender: gender,
    attributes: attributes,
    characterRace: characterRace,
    hitPoints: getHitPoints(professions, attributes.CON),
    professions: professions,
    isBard: false, // can't have a multi-class Bard
    bardLevels: {
      [CharacterClass.Fighter]: 0,
      [CharacterClass.Thief]: 0,
      [CharacterClass.Bard]: 0,
    },
    followers: [],
    alignment: getAlignmentForClasses(selectedClasses),
  };
}
