import { Attribute } from "../../../models/attributes";
import { CharacterClass } from "../../../models/characterClass";

/**
 * This is an implementation of the advice from DMG p11 for
 * "Special Characters, Including Henchmen". I take that to
 * also mean the "main characters" of an NPC party. It says
 * to uses 3d6 except for the abilities germane to the
 * profession. To determine which abilities are germane,
 * I just looked in the PHB to see which attributes were
 * explicitly mentioned for each class, whether as minimum
 * requirements or as simply being helpful to the class.
 *
 * As Men-At-Arms are not henchmen, they will roll 3d6 for
 * all attributes.
 *
 * @param attribute
 * @param candidateClasses
 */
export const getAttributeDice = (
  attribute: Attribute,
  candidateClasses: CharacterClass[]
): number => {
  const getClassAttributeDice = (characterClass: CharacterClass): number => {
    switch (characterClass) {
      case CharacterClass.Cleric:
        switch (attribute) {
          case Attribute.Strength:
          case Attribute.Wisdom:
          case Attribute.Dexterity:
          case Attribute.Constitution:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.Druid:
        switch (attribute) {
          case Attribute.Wisdom:
          case Attribute.Charisma:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.Fighter:
        switch (attribute) {
          case Attribute.Strength:
          case Attribute.Constitution:
          case Attribute.Dexterity:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.Paladin:
        switch (attribute) {
          case Attribute.Strength:
          case Attribute.Intelligence:
          case Attribute.Wisdom:
          case Attribute.Constitution:
          case Attribute.Charisma:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.Ranger:
        switch (attribute) {
          case Attribute.Strength:
          case Attribute.Intelligence:
          case Attribute.Wisdom:
          case Attribute.Constitution:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.MagicUser:
      case CharacterClass.Illusionist:
      case CharacterClass.Thief:
        switch (attribute) {
          case Attribute.Intelligence:
          case Attribute.Dexterity:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.Assassin:
        switch (attribute) {
          case Attribute.Strength:
          case Attribute.Intelligence:
          case Attribute.Dexterity:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.Monk:
        switch (attribute) {
          case Attribute.Strength:
          case Attribute.Wisdom:
          case Attribute.Dexterity:
          case Attribute.Constitution:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.Bard:
        switch (attribute) {
          case Attribute.Strength:
          case Attribute.Intelligence:
          case Attribute.Wisdom:
          case Attribute.Dexterity:
          case Attribute.Constitution:
          case Attribute.Charisma:
            return 4;
          default:
            return 3;
        }
      case CharacterClass.ManAtArms:
        return 3;
      default:
        return 3;
    }
  };

  // Iterate over all classes and find the maximum dice count
  return Math.max(...candidateClasses.map(getClassAttributeDice));
};
