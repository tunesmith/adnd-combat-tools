import { Attribute } from "../../../models/attributes";
import { CharacterRace } from "../../../../tables/dungeon/monster/character/characterRace";

/**
 * See the docs for {@link assessRacialBonus} for the thinking behind this.
 *
 * @param attribute
 * @param score
 * @param candidateRace
 */
export const assessRacialPenalty = (
  attribute: Attribute,
  score: number,
  candidateRace: CharacterRace
) => {
  switch (candidateRace) {
    case CharacterRace.Dwarf:
      return attribute === Attribute.Charisma ? score - 2 : score;
    case CharacterRace.Elf:
      return attribute === Attribute.Constitution ? score - 1 : score;
    case CharacterRace.Gnome:
      return attribute === Attribute.Charisma ? score - 1 : score;
    case CharacterRace.Halfling:
      return attribute === Attribute.Strength ? score - 1 : score;
    case CharacterRace.HalfOrc:
      return attribute === Attribute.Charisma ? score - 2 : score;
    default:
      return score;
  }
};
