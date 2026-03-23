import type { Table } from '../../tables/dungeon/tableTypes';
import type { Command } from '../../tables/dungeon/dungeonTypes';

export const rollDice = (sides: number, rolls: number = 1): number => {
  let total = 0;
  for (let i = 0; i < rolls; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
};

/**
 * Helper function to get the last element of a non-empty array
 *
 * Note that the type assertion is okay here, because the parameter
 * type of [T, ...T[]] logically means it can't be undefined. Typescript
 * just isn't smart enough to realize this in the type inference,
 * which is why we need the 'as T' type assertion
 * @param arr
 */
function getLastElement<T>(arr: [T, ...T[]]): T {
  return arr[arr.length - 1] as T;
}

export const getTableEntry = <T extends Command>(
  roll: number,
  table: Table<T>
): T => {
  // Access the last entry; entries are guaranteed to be non-empty
  const lastEntry = getLastElement(table.entries);
  const maxRoll = getLastElement(lastEntry.range); // Always a number

  if (roll > maxRoll || roll < 1) {
    throw new Error(
      `Roll ${roll} is out of bounds for table with sides up to ${maxRoll}`
    );
  }

  const entry = table.entries.find((entry) => {
    const loRange = entry.range[0]; // Always defined
    const hiRange = getLastElement(entry.range); // Always defined
    return roll >= loRange && roll <= hiRange;
  });

  if (!entry) {
    throw new Error(`No entry found for roll ${roll}`);
  }

  return entry.command;
};
