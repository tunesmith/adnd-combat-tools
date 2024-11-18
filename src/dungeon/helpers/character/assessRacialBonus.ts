import { Attribute } from "../../models/attributes";
import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";

/**
 * For this, we are summing the racial bonuses listed in
 * the DMG p100 and the PHB p14, for two and a half reasons:
 *
 * 1. They appear to contradict each other otherwise; Dwarf
 * overlaps, but Gnome is only present in the DMG while
 * Half-Orc is only present in the PHB
 *
 * 2. DMG p100 says "Note that these are adjustments in addition
 * to those noted in the AD&D PLAYERS HANDBOOK. In spite of all
 * additions, normal ability limits cannot be exceeded."
 *
 * 2.5: That notation arguably only applies to the class-based
 * adjustments, rather than the race-based adjustments, due
 * to the location of the footnote asterisk. But if that were
 * true, the footnote makes no sense as there are no class-based
 * attribute adjustments in the PHB.
 *
 * Similar logic applies to {@link assessRacialPenalty}.
 *
 * @param attribute
 * @param score
 * @param candidateRace
 */
export const assessRacialBonus = (
  attribute: Attribute,
  score: number,
  candidateRace: CharacterRace
) => {
  switch (candidateRace) {
    case CharacterRace.Dwarf:
      switch (attribute) {
        case Attribute.Strength:
          return score + 1;
        case Attribute.Constitution:
          return score + 2;
        default:
          return score;
      }
    case CharacterRace.Elf:
      switch (attribute) {
        case Attribute.Intelligence:
          return score + 1;
        case Attribute.Dexterity:
          return score + 2;
        default:
          return score;
      }
    case CharacterRace.Gnome:
      switch (attribute) {
        case Attribute.Wisdom:
          return score + 1;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterRace.Halfling:
      switch (attribute) {
        case Attribute.Dexterity:
          return score + 2;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterRace.HalfOrc:
      switch (attribute) {
        case Attribute.Strength:
          return score + 1;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    default:
      return score;
  }
};
