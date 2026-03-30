import { CharacterRace } from '../../tables/dungeon/monster/character/characterRace';

export const multiClassLikelihood: Record<CharacterRace, number> = {
  [CharacterRace.Human]: 0, // Humans cannot multi-class
  [CharacterRace.Dwarf]: 15, // 15% chance
  [CharacterRace.Elf]: 85,
  [CharacterRace.Gnome]: 25,
  [CharacterRace.HalfElf]: 85,
  [CharacterRace.Halfling]: 10,
  [CharacterRace.HalfOrc]: 50,
};
