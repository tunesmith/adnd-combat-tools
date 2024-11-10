import { Command, Table } from "../../tables/dungeon/dungeonTypes";
import {
  PeriodicCheck,
  periodicCheck,
} from "../../tables/dungeon/periodicCheck";
import { sidePassageResults } from "./sidePassage";
import { passageTurnResults } from "./passageTurn";
import { closedDoorResult } from "./closedDoorResult";
import { chamberResult } from "./chamberResult";
import { stairsResult } from "./stairsResult";

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
/**
 * If we follow the Strategic Review mindset, then it means
 * we follow the rule that:
 * - exits from chambers are passages
 * - exits from rooms are doors
 *
 * All chamber passages extend 30', after which the
 * periodicCheck table can be checked.
 *
 * But for rooms, it means that we would need another
 * move type, one that checks beyond a door.
 */
export const passageResults = (): string => {
  const roll = rollDice(periodicCheck.sides);
  // console.log(`periodicCheck: ${roll}`);
  const command = getTableEntry(roll, periodicCheck);
  // const command = PeriodicCheck.Stairs;
  console.log(`periodicCheck: ${roll} is ${PeriodicCheck[command]}`);
  switch (command) {
    case PeriodicCheck.ContinueStraight:
      return "Continue straight -- check again in 60'";
    case PeriodicCheck.Door: {
      return closedDoorResult([]);
    }
    case PeriodicCheck.SidePassage: {
      return sidePassageResults();
    }
    case PeriodicCheck.PassageTurn: {
      return passageTurnResults();
    }
    case PeriodicCheck.Chamber: {
      return "The passage opens into a chamber. " + chamberResult();
    }
    case PeriodicCheck.Stairs: {
      return stairsResult();
    }
    case PeriodicCheck.DeadEnd: {
      const result = "The passage reaches a dead end. (TODO)";
      return result;
    }
    case PeriodicCheck.TrickTrap: {
      const result = "There is a trick or trap. (TODO) -- check again in 30'";
      return result;
    }
    case PeriodicCheck.WanderingMonster: {
      const result = "There is a wandering monster. (TODO)";
      return result;
    }
  }
};
