import { CharacterProfession } from "../../models/character/characterSheet";
import { Attributes } from "../../models/attributes";
import { hitPointsByClass } from "../../models/hitPointsByClass";
import { getHitPointBonus } from "./getHitPointBonus";
import { rollDice } from "../dungeonLookup";

/**
 * Sums up the hit points for the character in question.
 *
 * Note that there are some controversial interpretations on
 * how to do this. I think the controversy is overblown, as
 * many of the techniques are mathematically equivalent, and
 * others don't really seem to capture the spirit of how hit
 * points work.
 *
 * For our implementation, we'll illustrate by comparing two
 * different single-class characters with an 18 CON. A fighter
 * type would get +4 hp bonus. A non-fighter type would get +2
 * hp bonus.
 *
 * To me, this strongly implies that a multi-class Fighter/Thief
 * should get the +4 bonus when advancing as a fighter, and a +2
 * bonus when advancing as a thief.
 *
 * I believe this to be in line with how hit points are described
 * in the rules. It is as much about experience fighting as it is
 * health. A person who is extra-healthy will have extra ability
 * to translate that to fighting experience, doubly so for fighters.
 * So advancing in experience for a fighter taps into this skill,
 * while other classes do not. Advancing as a thief does not teach
 * advanced fighter skills in using one's body to avoid combat damage.
 *
 * @param professions
 * @param constitution
 * @param levelsToIgnore
 */
export const getHitPoints = (
  professions: CharacterProfession[],
  constitution: Attributes["CON"],
  levelsToIgnore: number = 0
): number => {
  // Use reduce to calculate total hit points
  return professions.reduce((total, profession) => {
    const { level, characterClass } = profession;
    const { hitDie, firstLevelDice, numberOfDice, perLateLevel } =
      hitPointsByClass[characterClass];
    const { bonus, reRoll } = getHitPointBonus(
      profession.characterClass,
      constitution
    );

    // No reason to calculate if we are ignoring all levels
    if (level - levelsToIgnore <= 0) {
      return total;
    }

    let hitPoints = 0;

    // Handle first level with extra dice, ignoring if necessary
    if (levelsToIgnore === 0) {
      for (let i = 0; i < firstLevelDice; i++) {
        hitPoints += rollDieWithReRoll(hitDie, reRoll) + bonus;
      }
    }

    const remainingDice = numberOfDice - firstLevelDice;
    const remainingLevelsToRoll = Math.min(level - 1, remainingDice);

    const remainingLevelsToIgnore = Math.max(levelsToIgnore - 1, 0);
    const remainingLevelsToRollAfterIgnoringLevels =
      remainingLevelsToRoll - remainingLevelsToIgnore;

    if (remainingLevelsToRollAfterIgnoringLevels > 0) {
      for (let i = 1; i <= remainingLevelsToRollAfterIgnoringLevels; i++) {
        hitPoints += rollDieWithReRoll(hitDie, reRoll) + bonus;
      }
    }

    const totalLevelsRolled = remainingLevelsToRoll + 1; // (to add back in first level)
    // add late-level hp bonuses
    const lateLevels = Math.max(0, level - totalLevelsRolled);
    const lateLevelsToIgnore = Math.max(0, levelsToIgnore - totalLevelsRolled);

    hitPoints += (lateLevels - lateLevelsToIgnore) * perLateLevel;

    // Add the hit points for this profession to the total, divided by number of professions
    return total + Math.round(hitPoints / professions.length);
  }, 0);
};

/**
 * Necessary because some races can have a CON of 19,
 * which says to re-roll hit points if a 1 is rolled
 * on the hit die.
 *
 * @param dieSize
 * @param reRoll
 */
const rollDieWithReRoll = (dieSize: number, reRoll: number): number => {
  let roll = rollDice(dieSize);
  while (roll <= reRoll) {
    roll = rollDice(dieSize);
  }
  return roll;
};
