import { rollDice } from "../../dungeonLookup";

/**
 * Rather than roll d100 and cap it, I think it's better to
 * scale, as otherwise female human fighters with 18 strength
 * would be 50% likely to be clustered at 18/50, which seems
 * silly. So this way we pass in the race/gender's maximum,
 * and roll that as a die for equal probabilities of outcome.
 *
 * For human male fighters, we can consider a raw 18 as 18/00,
 * since a raw 18 is otherwise impossible for a fighter.
 *
 * Overall that means we can store strength and exceptional
 * strength as a plain old decimal number. During output, we'll
 * remember to display a human male fighter's "18" as "18/100".
 *
 * @param max
 */
export const getExceptionalStrength = (max: number): number => {
  const exceptionalStrength = rollDice(max) / 100;
  return exceptionalStrength === 1 ? 18 : 18 + exceptionalStrength;
};
