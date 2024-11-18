import { AttributeRange } from "./raceAttributeLimits";
import { CharacterClass } from "../../tables/dungeon/monster/character/characterClass";
import { Attribute } from "../services/monster/characterResult";

interface ClassAttributeTable {
  [CharacterClass.Cleric]: Record<Attribute, AttributeRange>;
  [CharacterClass.Druid]: Record<Attribute, AttributeRange>;
  [CharacterClass.Fighter]: Record<Attribute, AttributeRange>;
  [CharacterClass.Paladin]: Record<Attribute, AttributeRange>;
  [CharacterClass.Ranger]: Record<Attribute, AttributeRange>;
  [CharacterClass.MagicUser]: Record<Attribute, AttributeRange>;
  [CharacterClass.Illusionist]: Record<Attribute, AttributeRange>;
  [CharacterClass.Thief]: Record<Attribute, AttributeRange>;
  [CharacterClass.Assassin]: Record<Attribute, AttributeRange>;
  [CharacterClass.Monk]: Record<Attribute, AttributeRange>;
  [CharacterClass.Bard]: Record<Attribute, AttributeRange>;
  [CharacterClass.ManAtArms]: Record<Attribute, AttributeRange>;
  [CharacterClass.MonkBard]: Record<Attribute, AttributeRange>;
}

export const npcClassAttributeLimits: ClassAttributeTable = {
  [CharacterClass.Cleric]: {
    STR: { min: 6, max: 18 },
    INT: { min: 6, max: 18 },
    WIS: { min: 9, max: 18 }, // min 13 if a multi-classed half-elven cleric
    DEX: { min: 3, max: 18 },
    CON: { min: 6, max: 18 },
    CHA: { min: 6, max: 18 },
  },
  [CharacterClass.Druid]: {
    STR: { min: 6, max: 18 },
    INT: { min: 6, max: 18 },
    WIS: { min: 12, max: 18 },
    DEX: { min: 6, max: 18 },
    CON: { min: 6, max: 18 },
    CHA: { min: 14, max: 18 }, // PHB says 15 minimum for pc
  },
  [CharacterClass.Fighter]: {
    STR: { min: 9, max: 18 },
    INT: { min: 3, max: 18 },
    WIS: { min: 6, max: 18 },
    DEX: { min: 6, max: 18 },
    CON: { min: 7, max: 18 },
    CHA: { min: 6, max: 18 },
  },
  [CharacterClass.Paladin]: {
    STR: { min: 12, max: 18 },
    INT: { min: 9, max: 18 },
    WIS: { min: 13, max: 18 },
    DEX: { min: 6, max: 18 },
    CON: { min: 9, max: 18 },
    CHA: { min: 17, max: 18 },
  },
  [CharacterClass.Ranger]: {
    STR: { min: 13, max: 18 },
    INT: { min: 13, max: 18 },
    WIS: { min: 12, max: 18 }, // PHB says 14 minimum for pc
    DEX: { min: 6, max: 18 },
    CON: { min: 14, max: 18 },
    CHA: { min: 6, max: 18 },
  },
  [CharacterClass.MagicUser]: {
    STR: { min: 3, max: 18 },
    INT: { min: 9, max: 18 },
    WIS: { min: 6, max: 18 },
    DEX: { min: 6, max: 18 },
    CON: { min: 6, max: 18 },
    CHA: { min: 6, max: 18 },
  },
  [CharacterClass.Illusionist]: {
    STR: { min: 6, max: 18 },
    INT: { min: 15, max: 18 },
    WIS: { min: 6, max: 18 },
    DEX: { min: 15, max: 18 }, // PHB says 16 minimum for pc
    CON: { min: 3, max: 18 },
    CHA: { min: 6, max: 18 },
  },
  [CharacterClass.Thief]: {
    STR: { min: 6, max: 18 },
    INT: { min: 6, max: 18 },
    WIS: { min: 3, max: 18 },
    DEX: { min: 9, max: 18 },
    CON: { min: 6, max: 18 },
    CHA: { min: 6, max: 18 },
  },
  [CharacterClass.Assassin]: {
    STR: { min: 12, max: 18 },
    INT: { min: 11, max: 18 },
    WIS: { min: 6, max: 18 },
    DEX: { min: 12, max: 18 },
    CON: { min: 6, max: 18 },
    CHA: { min: 3, max: 18 },
  },
  [CharacterClass.Monk]: {
    STR: { min: 12, max: 18 }, // PHB says 15 minimum for pc
    INT: { min: 6, max: 18 },
    WIS: { min: 15, max: 18 },
    DEX: { min: 15, max: 18 },
    CON: { min: 11, max: 18 },
    CHA: { min: 6, max: 18 },
  },
  [CharacterClass.Bard]: {
    STR: { min: 15, max: 18 },
    INT: { min: 12, max: 18 },
    WIS: { min: 15, max: 18 },
    DEX: { min: 15, max: 18 },
    CON: { min: 10, max: 18 },
    CHA: { min: 15, max: 18 },
  },
  [CharacterClass.ManAtArms]: {
    STR: { min: 3, max: 18 },
    INT: { min: 3, max: 18 },
    WIS: { min: 3, max: 18 },
    DEX: { min: 3, max: 18 },
    CON: { min: 3, max: 18 },
    CHA: { min: 3, max: 18 },
  },
  [CharacterClass.MonkBard]: {
    STR: { min: 3, max: 18 },
    INT: { min: 3, max: 18 },
    WIS: { min: 3, max: 18 },
    DEX: { min: 3, max: 18 },
    CON: { min: 3, max: 18 },
    CHA: { min: 3, max: 18 },
  },
};
