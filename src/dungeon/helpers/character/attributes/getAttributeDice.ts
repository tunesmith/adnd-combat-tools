import { CharacterClass } from "../../../../tables/dungeon/monster/character/characterClass";
import { Attribute } from "../../../models/attributes";

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
 * @param candidateClass
 */
export const getAttributeDice = (
  attribute: Attribute,
  candidateClass: CharacterClass
): number => {
  switch (candidateClass) {
    case CharacterClass.Cleric:
      switch (attribute) {
        case Attribute.Wisdom:
          return 4;
        case Attribute.Strength:
          return 4;
        case Attribute.Constitution:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Druid:
      switch (attribute) {
        case Attribute.Wisdom:
          return 4;
        case Attribute.Charisma:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Fighter:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Constitution:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Paladin:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Intelligence:
          return 4;
        case Attribute.Wisdom:
          return 4;
        case Attribute.Constitution:
          return 4;
        case Attribute.Charisma:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Ranger:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Intelligence:
          return 4;
        case Attribute.Wisdom:
          return 4;
        case Attribute.Constitution:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.MagicUser:
      switch (attribute) {
        case Attribute.Intelligence:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Illusionist:
      switch (attribute) {
        case Attribute.Intelligence:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Thief:
      switch (attribute) {
        case Attribute.Intelligence:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Assassin:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Intelligence:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Monk:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Wisdom:
          return 4;
        case Attribute.Dexterity:
          return 4;
        case Attribute.Constitution:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Bard:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Intelligence:
          return 4;
        case Attribute.Wisdom:
          return 4;
        case Attribute.Dexterity:
          return 4;
        case Attribute.Constitution:
          return 4;
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
