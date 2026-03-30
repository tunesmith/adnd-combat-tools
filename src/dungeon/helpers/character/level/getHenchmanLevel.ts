/**
 * Each henchman will have a level equal to one-third that of his or her master,
 * rounded down in all cases where fractions are below one-half, and plus 1 level
 * per 3 levels of the master's experience level where the character’s level is
 * above 8th. For example, o 5th level magic-user would have a 2nd level henchman,
 * as one-third of 5 is 1.7; at 9th level the character’s henchman would be 3 +3
 * (one third of 9 plus 1 level for every 3 levels of experience of the master
 * equals 3 + 3) or 6th level. Bonus for the level of the character master is only
 * in whole numbers, all fractions being dropped, i.e. at 11th level there is still
 * only a bonus of 3, but at 12th there is a bonus of 4.
 *
 * @param characterLevel
 */
export const getHenchmanLevel = (characterLevel: number): number => {
  const baseHenchmanLevel = Math.round(characterLevel / 3);
  const henchmanLevelBonus =
    characterLevel > 8 ? Math.floor(characterLevel / 3) : 0;
  return baseHenchmanLevel + henchmanLevelBonus;
};
