import { henchmenByCharisma } from '../../../models/henchmenByCharisma';

/**
 * There's probably a better way to do the typescript that doesn't
 * require a typecast, but I didn't want a type that iterated through
 * each of the numbers from 3--18.
 *
 * @param charisma
 */
export const getMaxHenchmenByCharisma = (charisma: number): number => {
  if (charisma < 3 || charisma > 18) {
    throw new Error(`Charisma value ${charisma} is out of range (3–18).`);
  }
  return henchmenByCharisma[charisma] as number;
};
