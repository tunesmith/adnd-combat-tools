import {
  PeriodicCheck,
  periodicCheck,
} from "../../tables/dungeon/periodicCheck";
import { sidePassageResults } from "./sidePassage";
import { passageTurnResults } from "./passageTurn";
import { closedDoorResult } from "./closedDoorResult";
import { chamberResult } from "./chamberResult";
import { stairsResult } from "./stairsResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";

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
