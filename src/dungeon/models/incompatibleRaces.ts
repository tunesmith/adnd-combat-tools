import { CharacterRace } from "../../tables/dungeon/monster/character/characterRace";

/**
 * PHB mentions racial tolerances. We'll rule out "Hate"
 * but not "Antipathy". This basically means that Dwarves
 * and Gnomes cannot be in the same party as Half-Orcs, and
 * vice versa.
 */
export const incompatibleRaces: Record<CharacterRace, CharacterRace[]> = {
  [CharacterRace.Human]: [],
  [CharacterRace.Dwarf]: [CharacterRace.HalfOrc],
  [CharacterRace.Elf]: [],
  [CharacterRace.Gnome]: [CharacterRace.HalfOrc],
  [CharacterRace.HalfElf]: [],
  [CharacterRace.Halfling]: [],
  [CharacterRace.HalfOrc]: [CharacterRace.Dwarf, CharacterRace.Gnome],
};
