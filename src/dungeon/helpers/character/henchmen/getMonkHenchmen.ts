/**
 * Monks can have fighters, thieves, or assassins as henchmen,
 * starting at Level 6.
 *
 * We could check the number of fighters/thieves/assassins in
 * the party so far, but that is unnecessary because a fighter
 * max is 5, and a thief max is 4, which is already enough for
 * a party of 9.
 *
 * @param level
 * @param maxHenchmenByCharisma
 */
export const getMonkHenchmen = (
  level: number,
  maxHenchmenByCharisma: number
): number => {
  if (level < 6) return 0;
  return Math.min(level - 6 + 2, maxHenchmenByCharisma);
};
