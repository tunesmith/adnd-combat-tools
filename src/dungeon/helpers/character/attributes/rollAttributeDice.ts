export const rollAttributeDice = (
  dice: number,
  randomGenerator: () => number = () => Math.floor(Math.random() * 6) + 1
): number => {
  if (dice < 3) {
    throw new Error('The number of dice must be at least 3');
  }

  // Roll the specified number of d6 dice
  const rolls: number[] = Array.from({ length: dice }, () => randomGenerator());

  // Sort the rolls in descending order
  rolls.sort((a, b) => b - a);

  // Take the three highest rolls and sum them
  return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
};
