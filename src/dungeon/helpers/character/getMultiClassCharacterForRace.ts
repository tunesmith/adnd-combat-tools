import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import { CharacterSheet } from "../../models/character/characterSheet";
import { getMultiClassForRace } from "./getMultiClassForRace";
import { getCharacterGender } from "./getCharacterGender";
import { getAttributes } from "./attributes/getAttributes";
import { getProfessions } from "./getProfessions";
import { getHitPoints } from "./getHitPoints";

/**
 * Similar to {@link getSingleClassCharacterForRace}, although simpler to meet
 * level restrictions, since levels are allocated among multiple classes.
 *
 * @param characterRace
 * @param numClasses
 * @param characterLevel
 */
export function getMultiClassCharacterForRace(
  characterRace: CharacterRace,
  numClasses: number,
  characterLevel: number
): CharacterSheet {
  const selectedClasses = getMultiClassForRace(characterRace, numClasses);
  const gender = getCharacterGender();
  const attributes = getAttributes(selectedClasses, characterRace, gender);
  const professions = getProfessions(
    characterRace,
    selectedClasses,
    attributes,
    characterLevel,
    numClasses
  );

  return {
    gender: gender,
    attributes: attributes,
    characterRace: characterRace,
    hitPoints: getHitPoints(professions, attributes.CON),
    professions: professions,
  };
}
