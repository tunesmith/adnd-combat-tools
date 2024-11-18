import { Attribute } from "../../models/attributes";
import { CharacterClass } from "../../../tables/dungeon/monster/character/characterClass";

/**
 * These are the character class based adjustments to attribute
 * scores for NPCs, as described on DMG p100.
 *
 * @param attribute
 * @param score
 * @param candidateClass
 */
export const assessNpcBonus = (
  attribute: Attribute,
  score: number,
  candidateClass: CharacterClass
) => {
  switch (candidateClass) {
    case CharacterClass.Cleric:
      return attribute === Attribute.Wisdom ? score + 2 : score;
    case CharacterClass.Fighter:
      switch (attribute) {
        case Attribute.Strength:
          return score + 2;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterClass.Ranger:
      switch (attribute) {
        case Attribute.Strength:
          return score + 2;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterClass.Paladin:
      switch (attribute) {
        case Attribute.Strength:
          return score + 2;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterClass.MagicUser:
      switch (attribute) {
        case Attribute.Intelligence:
          return score + 2;
        case Attribute.Dexterity:
          return score + 1;
        default:
          return score;
      }
    case CharacterClass.Thief:
      switch (attribute) {
        case Attribute.Intelligence:
          return score + 1;
        case Attribute.Dexterity:
          return score + 2;
        default:
          return score;
      }
    case CharacterClass.Assassin:
      switch (attribute) {
        case Attribute.Strength:
          return score + 1;
        case Attribute.Intelligence:
          return score + 1;
        case Attribute.Dexterity:
          return score + 2;
        default:
          return score;
      }
    case CharacterClass.ManAtArms:
      switch (attribute) {
        case Attribute.Strength:
          return score + 1;
        case Attribute.Constitution:
          return score + 3;
        default:
          return score;
      }
    default:
      return score;
  }
};
