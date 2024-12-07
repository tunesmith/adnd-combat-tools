import { Attribute } from "./attributes";
import { CharacterClass } from "./characterClass";

interface ClassAttributeTable {
  [CharacterClass.Cleric]: Record<Attribute, number>;
  [CharacterClass.Druid]: Record<Attribute, number>;
  [CharacterClass.Fighter]: Record<Attribute, number>;
  [CharacterClass.Paladin]: Record<Attribute, number>;
  [CharacterClass.Ranger]: Record<Attribute, number>;
  [CharacterClass.MagicUser]: Record<Attribute, number>;
  [CharacterClass.Illusionist]: Record<Attribute, number>;
  [CharacterClass.Thief]: Record<Attribute, number>;
  [CharacterClass.Assassin]: Record<Attribute, number>;
  [CharacterClass.Monk]: Record<Attribute, number>;
  [CharacterClass.Bard]: Record<Attribute, number>;
  [CharacterClass.ManAtArms]: Record<Attribute, number>;
}

export const npcClassAttributeLimits: ClassAttributeTable = {
  [CharacterClass.Cleric]: {
    STR: 6,
    INT: 6,
    WIS: 9, // min 13 if a multi-classed half-elven cleric
    DEX: 3,
    CON: 6,
    CHA: 6,
  },
  [CharacterClass.Druid]: {
    STR: 6,
    INT: 6,
    WIS: 12,
    DEX: 6,
    CON: 6,
    CHA: 14, // PHB says 15 minimum for pc
  },
  [CharacterClass.Fighter]: {
    STR: 9,
    INT: 3,
    WIS: 6,
    DEX: 6,
    CON: 7,
    CHA: 6,
  },
  [CharacterClass.Paladin]: {
    STR: 12,
    INT: 9,
    WIS: 13,
    DEX: 6,
    CON: 9,
    CHA: 17,
  },
  [CharacterClass.Ranger]: {
    STR: 13,
    INT: 13,
    WIS: 12, // PHB says 14 minimum for pc
    DEX: 6,
    CON: 14,
    CHA: 6,
  },
  [CharacterClass.MagicUser]: {
    STR: 3,
    INT: 9,
    WIS: 6,
    DEX: 6,
    CON: 6,
    CHA: 6,
  },
  [CharacterClass.Illusionist]: {
    STR: 6,
    INT: 15,
    WIS: 6,
    DEX: 15, // PHB says 16 minimum for pc
    CON: 3,
    CHA: 6,
  },
  [CharacterClass.Thief]: {
    STR: 6,
    INT: 6,
    WIS: 3,
    DEX: 9,
    CON: 6,
    CHA: 6,
  },
  [CharacterClass.Assassin]: {
    STR: 12,
    INT: 11,
    WIS: 6,
    DEX: 12,
    CON: 6,
    CHA: 3,
  },
  [CharacterClass.Monk]: {
    STR: 12, // PHB says 15 minimum for pc
    INT: 6,
    WIS: 15,
    DEX: 15,
    CON: 11,
    CHA: 6,
  },
  [CharacterClass.Bard]: {
    STR: 15,
    INT: 12,
    WIS: 15,
    DEX: 15,
    CON: 10,
    CHA: 15,
  },
  [CharacterClass.ManAtArms]: {
    STR: 3,
    INT: 3,
    WIS: 3,
    DEX: 3,
    CON: 3,
    CHA: 3,
  },
};
