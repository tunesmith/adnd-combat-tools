import { CharacterRace } from '../../../../tables/dungeon/monster/character/characterRace';
import { rollDice } from '../../dungeonLookup';
import { multiClassLikelihood } from '../../../models/multiClassLikelihood';

/**
 * Note there is something crazy here. The DMG says:
 *
 * About 50% of non-humans will have two professions,
 * about 25% of those will have three.
 *
 * First, we definitely interpret this to mean "25% of
 * the 50%", rather than an additional 25%.
 *
 * But, note that only elves and half-elves can have three.
 *
 * Staring closely at the table, we see that we would
 * overall expect 52.25% of non-humans to be multi-class,
 * which is close enough to "about 50%".
 *
 * To have roughly 25% of those be three-class, just from
 * elves and half-elves, that means that elves and half-elves
 * would each need to have a 30.74% chance of being three-class,
 * rather than a straight 25% chance. That would be enough to
 * "make up" for the other races not being able to three-class.
 *
 * We'll just use 30%. That means we'd expect an overall
 * percentage of the multi-class being three-class of being
 * 24.4%, which is also close enough to "about 25%".
 *
 * @param characterRace
 */
export const getNumberOfClasses = (characterRace: CharacterRace): number => {
  const multiClassProbability = rollDice(100);
  if (multiClassProbability > multiClassLikelihood[characterRace]) {
    return 1;
  }
  if (
    characterRace === CharacterRace.Elf ||
    characterRace === CharacterRace.HalfElf
  ) {
    if (rollDice(100) <= 30) {
      return 3;
    }
  }
  return 2;
};
