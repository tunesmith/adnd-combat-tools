import type { CharacterRace } from "../../../../tables/dungeon/monster/character/characterRace";
import type { Gender } from "../../../models/character/gender";
import { Attribute } from "../../../models/attributes";
import type { Attributes } from "../../../models/attributes";
import { rollAttribute } from "./rollAttribute";
import type { CharacterClass } from "../../../models/characterClass";

/**
 * For NPCs, we're following the rule of 3d6 for normal attributes,
 * and 4d6 for "key" attributes for a class. On top of that, we then
 * adjust them by the values specified in the NPC generation sections
 * of the DMG, as well as the class/race adjustments (including min/max)
 * of the PHB and DMG.
 *
 * We do not allocate scores; we roll them in order.
 *
 * @param candidateClasses
 * @param candidateRace
 * @param gender
 */
export const getAttributes = (
  candidateClasses: CharacterClass[],
  candidateRace: CharacterRace,
  gender: Gender
): Attributes => {
  return {
    STR: rollAttribute(
      Attribute.Strength,
      candidateClasses,
      candidateRace,
      gender
    ),
    INT: rollAttribute(
      Attribute.Intelligence,
      candidateClasses,
      candidateRace,
      gender
    ),
    WIS: rollAttribute(
      Attribute.Wisdom,
      candidateClasses,
      candidateRace,
      gender
    ),
    DEX: rollAttribute(
      Attribute.Dexterity,
      candidateClasses,
      candidateRace,
      gender
    ),
    CON: rollAttribute(
      Attribute.Constitution,
      candidateClasses,
      candidateRace,
      gender
    ),
    CHA: rollAttribute(
      Attribute.Charisma,
      candidateClasses,
      candidateRace,
      gender
    ),
  };
};
