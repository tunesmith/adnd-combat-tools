import { CharacterClass } from "./characterClass";

export interface HitDiceDetails {
  hitDie: number;
  firstLevelDice: number;
  numberOfDice: number;
  perLateLevel: number;
}

export const hitPointsByClass: Record<CharacterClass, HitDiceDetails> = {
  [CharacterClass.Cleric]: {
    hitDie: 8,
    firstLevelDice: 1,
    numberOfDice: 9,
    perLateLevel: 2,
  },
  [CharacterClass.Druid]: {
    hitDie: 8,
    firstLevelDice: 1,
    numberOfDice: 14,
    perLateLevel: 0,
  },
  [CharacterClass.Fighter]: {
    hitDie: 10,
    firstLevelDice: 1,
    numberOfDice: 9,
    perLateLevel: 3,
  },
  [CharacterClass.Paladin]: {
    hitDie: 10,
    firstLevelDice: 1,
    numberOfDice: 9,
    perLateLevel: 3,
  },
  [CharacterClass.Ranger]: {
    hitDie: 8,
    firstLevelDice: 2,
    numberOfDice: 11,
    perLateLevel: 2,
  },
  [CharacterClass.MagicUser]: {
    hitDie: 4,
    firstLevelDice: 1,
    numberOfDice: 11,
    perLateLevel: 1,
  },
  [CharacterClass.Illusionist]: {
    hitDie: 4,
    firstLevelDice: 1,
    numberOfDice: 10,
    perLateLevel: 1,
  },
  [CharacterClass.Thief]: {
    hitDie: 6,
    firstLevelDice: 1,
    numberOfDice: 10,
    perLateLevel: 2,
  },
  [CharacterClass.Assassin]: {
    hitDie: 6,
    firstLevelDice: 1,
    numberOfDice: 15,
    perLateLevel: 0,
  },
  [CharacterClass.Monk]: {
    hitDie: 4,
    firstLevelDice: 2,
    numberOfDice: 18,
    perLateLevel: 0,
  },
  [CharacterClass.Bard]: {
    hitDie: 6,
    firstLevelDice: 0,
    numberOfDice: 10,
    perLateLevel: 1,
  },
  [CharacterClass.ManAtArms]: {
    hitDie: 4,
    firstLevelDice: 1,
    numberOfDice: 1,
    perLateLevel: 0,
  },
};
