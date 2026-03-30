import type { BardLevels } from '../../../models/character/characterSheet';
import { rollDice } from '../../dungeonLookup';
import { CharacterClass } from '../../../models/characterClass';

/**
 * Bards begin play as fighters, and they must remain exclusively fighters until they have achieved
 * at least the 5th level of experience. Anytime thereafter, and in any event prior to attaining the
 * 8th level, they must change their class to that of thieves. Again, sometime between 5th and 9th
 * level of ability, bards must leave off thieving and begin clerical studies as druids; but at this
 * time they are actually bards and under druidical tutelage. - PHB 117
 *
 * Each "bard" has a personal choice of what fighter-level to attain
 * before they switch. This may be a level they haven't reached yet.
 * This level can be 5th, 6th, or 7th. There's some controversy here;
 * some people think Bards can attain F8 and then immediately switch.
 * I disagree, that's not what "prior to attaining 8th level" means.
 * Once a bard reaches their chosen fighter level, they can immediately
 * switch to being a T1.
 *
 * @param characterLevel
 */
export const getBardLevels = (characterLevel: number): BardLevels => {
  const chosenFighterLevel = rollDice(3) + 4;
  if (characterLevel < chosenFighterLevel) {
    return {
      [CharacterClass.Fighter]: characterLevel,
      [CharacterClass.Thief]: 0,
      [CharacterClass.Bard]: 0,
    };
  } else if (characterLevel === chosenFighterLevel) {
    return {
      [CharacterClass.Fighter]: chosenFighterLevel,
      [CharacterClass.Thief]: 1,
      [CharacterClass.Bard]: 0,
    };
  } else {
    // Add 1 since the character can immediately switch.
    // For example, let's say characterLevel is 6, and the character chose
    // to switch to Thief immediately upon reaching F5. He'd reach T2 as
    // other characters reach L6 (ignoring the weirdness about scaling xp).
    const remainingThiefDruidLevels = characterLevel - chosenFighterLevel + 1;
    const chosenThiefLevel = rollDice(4, 4); // thieves can advance to L8
    if (remainingThiefDruidLevels < chosenThiefLevel) {
      return {
        [CharacterClass.Fighter]: chosenFighterLevel,
        [CharacterClass.Thief]: remainingThiefDruidLevels,
        [CharacterClass.Bard]: 0,
      };
    } else if (remainingThiefDruidLevels === chosenThiefLevel) {
      return {
        [CharacterClass.Fighter]: chosenFighterLevel,
        [CharacterClass.Thief]: chosenThiefLevel,
        [CharacterClass.Bard]: 1,
      };
    } else {
      // same deal here; add 1.
      const remainingBardLevels =
        remainingThiefDruidLevels - chosenThiefLevel + 1;
      return {
        [CharacterClass.Fighter]: chosenFighterLevel,
        [CharacterClass.Thief]: chosenThiefLevel,
        [CharacterClass.Bard]: Math.min(remainingBardLevels, 23),
      };
    }
  }
};
