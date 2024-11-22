import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import { CharacterClass } from "../../../tables/dungeon/monster/character/characterClass";
import { Attributes } from "../../models/attributes";

/**
 * This is a literal implementation of
 * "Character Race Table II.: Class Level Limitations" in the PHB,
 * with the exception that it doesn't currently account for the
 * sub-races of Halflings. I'm comfortable assuming that NPC parties
 * will only include Hairfeet. If it bothers me in the future, I can
 * figure out how to implement support for Tallfellows (who are
 * apparently very rare) and Stouts (who are less typical than Hairfeet).
 *
 * @param candidateRace
 * @param candidateClass
 * @param attributes
 */
export const getMaxLevel = (
  candidateRace: CharacterRace,
  candidateClass: CharacterClass,
  attributes: Attributes
): number => {
  switch (candidateRace) {
    case CharacterRace.Human:
      switch (candidateClass) {
        case CharacterClass.Druid:
          return 14; // (The Great Druid)
        case CharacterClass.Assassin:
          return 14; // (Master of Assassins)
        case CharacterClass.Monk:
          return 17; // (Grand Master of Flowers)
        default:
          return Infinity;
      }
    case CharacterRace.Dwarf:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 8;
        case CharacterClass.Fighter: {
          if (attributes.STR < 17) {
            return 7;
          } else if (attributes.STR === 17) {
            return 8;
          } else {
            return 9;
          }
        }
        case CharacterClass.Thief:
          return Infinity;
        case CharacterClass.Assassin:
          return 9;
        default:
          return 0;
      }
    case CharacterRace.Elf:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 7;
        case CharacterClass.Fighter: {
          if (attributes.STR < 17) {
            return 5;
          } else if (attributes.STR === 17) {
            return 6;
          } else {
            return 7;
          }
        }
        case CharacterClass.MagicUser: {
          if (attributes.INT < 17) {
            return 9;
          } else if (attributes.INT === 17) {
            return 10;
          } else {
            return 11;
          }
        }
        case CharacterClass.Thief:
          return Infinity;
        case CharacterClass.Assassin:
          return 10;
        default:
          return 0;
      }
    case CharacterRace.Gnome:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 7;
        case CharacterClass.Fighter: {
          if (attributes.STR < 18) {
            return 5;
          } else {
            return 6;
          }
        }
        case CharacterClass.Illusionist: {
          if (attributes.INT < 17 || attributes.DEX < 17) {
            return 5;
          } else if (attributes.INT === 17 && attributes.DEX === 17) {
            return 6;
          } else {
            return 7;
          }
        }
        case CharacterClass.Thief:
          return Infinity;
        case CharacterClass.Assassin:
          return 8;
        default:
          return 0;
      }
    case CharacterRace.HalfElf:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 5;
        case CharacterClass.Druid:
          return 14; // 14 is max (The Great Druid)
        case CharacterClass.Fighter: {
          if (attributes.STR < 17) {
            return 6;
          } else if (attributes.STR === 17) {
            return 7;
          } else {
            return 8;
          }
        }
        case CharacterClass.Ranger: {
          if (attributes.STR < 17) {
            return 6;
          } else if (attributes.STR === 17) {
            return 7;
          } else {
            return 8;
          }
        }
        case CharacterClass.MagicUser: {
          if (attributes.INT < 17) {
            return 6;
          } else if (attributes.INT === 17) {
            return 7;
          } else {
            return 8;
          }
        }
        case CharacterClass.Thief:
          return Infinity;
        case CharacterClass.Assassin:
          return 11;
        case CharacterClass.Bard:
          return 23;
        default:
          return 0;
      }
    case CharacterRace.Halfling:
      switch (candidateClass) {
        case CharacterClass.Druid:
          return 6;
        case CharacterClass.Fighter:
          return 4; // Hairfeet only
        case CharacterClass.Thief:
          return Infinity;
        default:
          return 0;
      }
    case CharacterRace.HalfOrc:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 4;
        case CharacterClass.Fighter:
          return 10;
        case CharacterClass.Thief: {
          if (attributes.DEX < 17) {
            return 6;
          } else if (attributes.DEX === 17) {
            return 7;
          } else {
            return 8;
          }
        }
        case CharacterClass.Assassin:
          return 14; // 14 is Max (Master of Assassins)
        default:
          return 0;
      }
  }
};
