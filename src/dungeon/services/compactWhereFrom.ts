import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { periodicCheck, PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";
import { sidePassages, SidePassages } from "../../tables/dungeon/sidePassages";
import { passageTurns, PassageTurns } from "../../tables/dungeon/passageTurns";
import { stairs, Stairs, egressOne, egressTwo, egressThree, Egress, chute, Chute } from "../../tables/dungeon/stairs";
import { passageWidth, PassageWidth } from "../../tables/dungeon/passageWidth";
import { specialPassageResult } from "./specialPassage";
import { chamberResult } from "./chamberResult";

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
      // Resolve a side passage immediately in compact mode (no width roll here)
      {
        const roll = rollDice(sidePassages.sides);
        const cmd = getTableEntry(roll, sidePassages);
        switch (cmd) {
          case SidePassages.Left90:
            return "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
          case SidePassages.Right90:
            return "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
          case SidePassages.Left45:
            return "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
          case SidePassages.Right45:
            return "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
          case SidePassages.Left135:
            return "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
          case SidePassages.Right135:
            return "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
          case SidePassages.LeftCurve45:
            return "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
          case SidePassages.RightCurve45:
            return "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
          case SidePassages.PassageT:
            return "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
          case SidePassages.PassageY:
            return "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
          case SidePassages.FourWay:
            return "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
          case SidePassages.PassageX:
            return "The passage reaches an 'X' intersection. (If the present passage is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. ";
        }
      }
    case PeriodicCheck.PassageTurn:
      {
        const roll = rollDice(passageTurns.sides);
        const cmd = getTableEntry(roll, passageTurns);
        let prefix = "";
        switch (cmd) {
          case PassageTurns.Left90:
            prefix = "The passage turns left 90 degrees - check again in 30'. ";
            break;
          case PassageTurns.Left45:
            prefix = "The passage turns left 45 degrees ahead - check again in 30'. ";
            break;
          case PassageTurns.Left135:
            prefix = "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
            break;
          case PassageTurns.Right90:
            prefix = "The passage turns right 90 degrees - check again in 30'. ";
            break;
          case PassageTurns.Right45:
            prefix = "The passage turns right 45 degrees ahead - check again in 30'. ";
            break;
          case PassageTurns.Right135:
            prefix = "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
            break;
        }
        // Append passage width result for compact parity
        const wRoll = rollDice(passageWidth.sides);
        const wCmd = getTableEntry(wRoll, passageWidth);
        let widthText = "";
        switch (wCmd) {
          case PassageWidth.TenFeet:
            widthText = "The passage is 10' wide. ";
            break;
          case PassageWidth.TwentyFeet:
            widthText = "The passage is 20' wide. ";
            break;
          case PassageWidth.ThirtyFeet:
            widthText = "The passage is 30' wide. ";
            break;
          case PassageWidth.FiveFeet:
            widthText = "The passage is 5' wide. ";
            break;
          case PassageWidth.SpecialPassage:
            widthText = specialPassageResult();
            break;
        }
        return prefix + widthText;
      }
    case PeriodicCheck.Chamber:
      return "The passage opens into a chamber. " + chamberResult();
    case PeriodicCheck.Stairs:
      {
        const sRoll = rollDice(stairs.sides);
        const sCmd = getTableEntry(sRoll, stairs);
        switch (sCmd) {
          case Stairs.DownOne: {
            const r = rollDice(egressOne.sides);
            const c = getTableEntry(r, egressOne);
            const suffix = c === Egress.Closed ? "After descending, an unnoticed door will close egress for the day. " : "";
            return "There are stairs here that descend one level. " + suffix;
          }
          case Stairs.DownTwo: {
            const r = rollDice(egressTwo.sides);
            const c = getTableEntry(r, egressTwo);
            const suffix = c === Egress.Closed ? "After descending, an unnoticed door will close egress for the day. " : "";
            return "There are stairs here that descend two levels. " + suffix;
          }
          case Stairs.DownThree: {
            const r = rollDice(egressThree.sides);
            const c = getTableEntry(r, egressThree);
            const suffix = c === Egress.Closed ? "After descending, an unnoticed door will close egress for the day. " : "";
            return "There are stairs here that descend three levels. " + suffix;
          }
          case Stairs.UpOne:
            return "There are stairs here that ascend one level. ";
          case Stairs.UpDead: {
            const r = rollDice(chute.sides);
            const c = getTableEntry(r, chute);
            const suffix = c === Chute.Exists ? "The stairs will turn into a chute, descending two levels from the top. " : "";
            return "There are stairs here that ascend one level to a dead end. " + suffix;
          }
          case Stairs.DownDead: {
            const r = rollDice(chute.sides);
            const c = getTableEntry(r, chute);
            const suffix = c === Chute.Exists ? "The stairs will turn into a chute, descending two levels from the top. " : "";
            return "There are stairs here that descend one level to a dead end. " + suffix;
          }
          case Stairs.ChimneyUpOne:
            return "There is a chimney that goes up one level. The current passage continues, check again in 30'. ";
          case Stairs.ChimneyUpTwo:
            return "There is a chimney that goes up two levels. The current passage continues, check again in 30'. ";
          case Stairs.ChimneyDownTwo:
            return "There is a chimney that goes down two levels. The current passage continues, check again in 30'. ";
          case Stairs.TrapDoorDownOne:
            return "There is a trap door that goes down one level. The current passage continues, check again in 30'. ";
          case Stairs.TrapDownDownTwo:
            return "There is a trap door that goes down two levels. The current passage continues, check again in 30'. ";
          case Stairs.UpOneDownTwo:
            return (
              "There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. " +
              chamberResult()
            );
        }
      }
    case PeriodicCheck.DeadEnd:
      return "The passage reaches a dead end. (TODO) ";
    case PeriodicCheck.TrickTrap:
      return "There is a trick or trap. (TODO) -- check again in 30'. ";
    case PeriodicCheck.WanderingMonster:
      // handled elsewhere
      return "";
  }
}
