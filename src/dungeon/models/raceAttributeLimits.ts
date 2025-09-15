import { CharacterRace } from '../../tables/dungeon/monster/character/characterRace';
import type { Attribute } from './attributes';
import type { Gender } from './character/gender';

export interface AttributeRange {
  min: number;
  max: number;
}

interface GenderAttributeRanges {
  [Gender.Male]: Record<Attribute, AttributeRange>;
  [Gender.Female]: Record<Attribute, AttributeRange>;
}

interface RaceAttributeTable {
  [CharacterRace.Human]: GenderAttributeRanges;
  [CharacterRace.Dwarf]: GenderAttributeRanges;
  [CharacterRace.Elf]: GenderAttributeRanges;
  [CharacterRace.Gnome]: GenderAttributeRanges;
  [CharacterRace.HalfElf]: GenderAttributeRanges;
  [CharacterRace.Halfling]: GenderAttributeRanges;
  [CharacterRace.HalfOrc]: GenderAttributeRanges;
}

const raceAttributeLimits: RaceAttributeTable = {
  [CharacterRace.Human]: {
    M: {
      STR: { min: 3, max: 18 }, // 18/100 for fighter
      INT: { min: 3, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 3, max: 18 },
      CON: { min: 3, max: 18 },
      CHA: { min: 3, max: 18 },
    },
    F: {
      STR: { min: 3, max: 18 }, // 18.50 for fighter
      INT: { min: 3, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 3, max: 18 },
      CON: { min: 3, max: 18 },
      CHA: { min: 3, max: 18 },
    },
  },
  [CharacterRace.Dwarf]: {
    M: {
      STR: { min: 8, max: 18 }, // 18.99 for fighter
      INT: { min: 3, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 3, max: 17 },
      CON: { min: 12, max: 19 },
      CHA: { min: 3, max: 16 },
    },
    F: {
      STR: { min: 8, max: 17 },
      INT: { min: 3, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 3, max: 17 },
      CON: { min: 12, max: 19 },
      CHA: { min: 3, max: 16 },
    },
  },
  [CharacterRace.Elf]: {
    M: {
      STR: { min: 3, max: 18 }, // 18.75 for fighter
      INT: { min: 8, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 7, max: 19 },
      CON: { min: 6, max: 18 },
      CHA: { min: 8, max: 18 },
    },
    F: {
      STR: { min: 3, max: 16 },
      INT: { min: 8, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 7, max: 19 },
      CON: { min: 6, max: 18 },
      CHA: { min: 8, max: 18 },
    },
  },
  [CharacterRace.Gnome]: {
    M: {
      STR: { min: 6, max: 18 }, // 18.50 for fighter
      INT: { min: 7, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 3, max: 18 },
      CON: { min: 8, max: 18 },
      CHA: { min: 3, max: 18 },
    },
    F: {
      STR: { min: 6, max: 15 },
      INT: { min: 7, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 3, max: 18 },
      CON: { min: 8, max: 18 },
      CHA: { min: 3, max: 18 },
    },
  },
  [CharacterRace.HalfElf]: {
    M: {
      STR: { min: 3, max: 18 }, // 18.90 for fighter
      INT: { min: 4, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 6, max: 18 },
      CON: { min: 6, max: 18 },
      CHA: { min: 3, max: 18 },
    },
    F: {
      STR: { min: 3, max: 17 },
      INT: { min: 4, max: 18 },
      WIS: { min: 3, max: 18 },
      DEX: { min: 6, max: 18 },
      CON: { min: 6, max: 18 },
      CHA: { min: 3, max: 18 },
    },
  },
  [CharacterRace.Halfling]: {
    M: {
      STR: { min: 6, max: 17 }, // Hairfeet 17. Stout and Tallfellow 18.
      INT: { min: 6, max: 18 },
      WIS: { min: 3, max: 17 },
      DEX: { min: 8, max: 18 },
      CON: { min: 10, max: 19 },
      CHA: { min: 3, max: 18 },
    },
    F: {
      STR: { min: 6, max: 14 },
      INT: { min: 6, max: 18 },
      WIS: { min: 3, max: 17 },
      DEX: { min: 8, max: 18 },
      CON: { min: 10, max: 19 },
      CHA: { min: 3, max: 18 },
    },
  },
  [CharacterRace.HalfOrc]: {
    M: {
      STR: { min: 6, max: 18 }, // 18.99 for fighter
      INT: { min: 3, max: 17 },
      WIS: { min: 3, max: 14 },
      DEX: { min: 3, max: 17 }, // PHB dex table of 14 is wrong; errata says 17
      CON: { min: 13, max: 19 },
      CHA: { min: 3, max: 12 },
    },
    F: {
      STR: { min: 6, max: 18 }, // 18.75 for fighter
      INT: { min: 3, max: 17 },
      WIS: { min: 3, max: 14 },
      DEX: { min: 3, max: 17 }, // PHB dex table of 14 is wrong; errata says 17
      CON: { min: 13, max: 19 },
      CHA: { min: 3, max: 12 },
    },
  },
};

export default raceAttributeLimits;
