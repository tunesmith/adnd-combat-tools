import { CharacterClass } from "../../../tables/dungeon/monster/character/characterClass";

/**
 * This initializes a "level distributor", which is a count of how many
 * levels of advancement a multi-class character has, per class. It is
 * used to distribute levels for a character that may have low maximum
 * level limits for certain classes, as described in {@link getMaxLevel}.
 */
export function getLevelDistributor(): Record<CharacterClass, number> {
  return Object.values(CharacterClass)
    .filter((value): value is CharacterClass => typeof value === "number")
    .reduce((acc, characterClass) => {
      acc[characterClass] = 0;
      return acc;
    }, {} as Record<CharacterClass, number>);
}
