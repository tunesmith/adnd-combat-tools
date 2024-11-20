import { Attribute } from "../../../models/attributes";
import { CharacterClass } from "../../../../tables/dungeon/monster/character/characterClass";

/**
 * These are the character class based adjustments to attribute
 * scores for NPCs, as described on DMG p100.
 *
 * @param attribute
 * @param score
 * @param candidateClasses
 */
export const assessNpcClassBonus = (
  attribute: Attribute,
  score: number,
  candidateClasses: CharacterClass[]
) => {
  const getClassBonus = (characterClass: CharacterClass): number => {
    switch (characterClass) {
      case CharacterClass.Cleric:
        return attribute === Attribute.Wisdom ? 2 : 0;
      case CharacterClass.Fighter:
      case CharacterClass.Ranger:
      case CharacterClass.Paladin:
        switch (attribute) {
          case Attribute.Strength:
            return 2;
          case Attribute.Constitution:
            return 1;
          default:
            return 0;
        }
      case CharacterClass.MagicUser:
        switch (attribute) {
          case Attribute.Intelligence:
            return 2;
          case Attribute.Dexterity:
            return 1;
          default:
            return 0;
        }
      case CharacterClass.Thief:
        switch (attribute) {
          case Attribute.Intelligence:
            return 1;
          case Attribute.Dexterity:
            return 2;
          default:
            return 0;
        }
      case CharacterClass.Assassin:
        switch (attribute) {
          case Attribute.Strength:
          case Attribute.Intelligence:
            return 1;
          case Attribute.Dexterity:
            return 2;
          default:
            return 0;
        }
      case CharacterClass.ManAtArms:
        switch (attribute) {
          case Attribute.Strength:
            return 1;
          case Attribute.Constitution:
            return 3;
          default:
            return 0;
        }
      default:
        return 0;
    }
  };

  const maxBonus = Math.max(
    ...candidateClasses.map((candidateClass) => getClassBonus(candidateClass))
  );
  return score + maxBonus;
};
