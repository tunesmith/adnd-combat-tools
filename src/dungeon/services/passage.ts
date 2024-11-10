import { Command, NoCommand, Table } from "../../tables/dungeon/dungeonTypes";
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

export const getTableEntry = (roll: number, table: Table): Command => {
  const entry = table.entries.find((entry) => {
    const loRange = entry.range[0];
    const hiRange = entry.range[entry.range.length - 1];
    return loRange && hiRange && roll >= loRange && roll <= hiRange;
  });
  if (entry) {
    return entry.command;
  } else {
    return NoCommand.NoCommand;
  }
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
  if (command in PeriodicCheck) {
    console.log(`periodicCheck: ${roll} is ${PeriodicCheck[command]}`);
    switch (command as PeriodicCheck) {
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
  } else {
    return "done";
  }
};
