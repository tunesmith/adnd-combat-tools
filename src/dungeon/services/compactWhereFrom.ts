import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { periodicCheck, PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";

// Compose compact text for the closed-door chain without legacy helpers.
export function compactDoorText(existing: ("Left" | "Right")[] = []): string {
  const doorRoll = rollDice(doorLocation.sides);
  const doorCmd = getTableEntry(doorRoll, doorLocation);
  const prefix =
    doorCmd === DoorLocation.Ahead
      ? "A door is Ahead. "
      : `A door is to the ${DoorLocation[doorCmd]}. `;
  if (doorCmd === DoorLocation.Ahead) return prefix;
  const loc: "Left" | "Right" | "" =
    doorCmd === DoorLocation.Left ? "Left" : doorCmd === DoorLocation.Right ? "Right" : "";
  if (loc === "") return prefix;
  if (existing.includes(loc)) {
    return prefix + "There are no more doors. The main passage extends -- check again in 30'. ";
  }
  const reRoll = rollDice(periodicCheck.sides);
  const reCmd = getTableEntry(reRoll, periodicCheck);
  if (reCmd === PeriodicCheck.Door) {
    return prefix + compactDoorText([...existing, loc]);
  }
  return prefix + "There are no other doors. The main passage extends -- check again in 30'. ";
}

// Compose compact text for periodic check outcomes (non-WM)
export function compactPeriodicText(_level: number, result: PeriodicCheck, _avoidMonster: boolean): string {
  switch (result) {
    case PeriodicCheck.ContinueStraight:
      return "Continue straight -- check again in 60'. ";
    case PeriodicCheck.Door:
      return compactDoorText();
    case PeriodicCheck.SidePassage:
      // Resolve a side passage immediately in compact mode
      // Reuse existing service string for parity
      return require("../services/sidePassage").sidePassageResults();
    case PeriodicCheck.PassageTurn:
      return require("../services/passageTurn").passageTurnResults();
    case PeriodicCheck.Chamber:
      return "The passage opens into a chamber. " + require("../services/chamberResult").chamberResult();
    case PeriodicCheck.Stairs:
      return require("../services/stairsResult").stairsResult();
    case PeriodicCheck.DeadEnd:
      return "The passage reaches a dead end. (TODO) ";
    case PeriodicCheck.TrickTrap:
      return "There is a trick or trap. (TODO) -- check again in 30'. ";
    case PeriodicCheck.WanderingMonster:
      // handled elsewhere
      return "";
  }
}

