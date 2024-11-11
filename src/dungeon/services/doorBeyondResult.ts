import { DoorBeyond, doorBeyond } from "../../tables/dungeon/doorBeyond";
import { passageWidthResults } from "./passageWidth";

import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { chamberResult } from "./chamberResult";
import { roomResult } from "./roomResult";

/**
 * TODO allow "doorAhead" boolean in UI
 *
 * Note: This table says to always check the width of the passage.
 *
 * @param doorAhead
 */
export const doorBeyondResult = (doorAhead: boolean = false): string => {
  const doorBeyondRoll = rollDice(doorBeyond.sides);
  const doorBeyondCommand = getTableEntry(doorBeyondRoll, doorBeyond);
  console.log(
    `doorBeyond roll: ${doorBeyondRoll} is ${DoorBeyond[doorBeyondCommand]}`
  );
  switch (doorBeyondCommand) {
    case DoorBeyond.ParallelPassageOrCloset:
      if (doorAhead) {
        return "Beyond the door is a 10' x 10' room (check contents, treasure, TODO). ";
      } else {
        return (
          "Beyond the door is a parallel passage, extending 30' in both directions. " +
          passageWidthResults()
        );
      }
    case DoorBeyond.PassageStraightAhead:
      return (
        "Beyond the door is a passage straight ahead. " + passageWidthResults()
      );
    case DoorBeyond.Passage45AheadBehind:
      return (
        "Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). " +
        passageWidthResults()
      );
    case DoorBeyond.Passage45BehindAhead:
      return (
        "Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). " +
        passageWidthResults()
      );
    case DoorBeyond.Room:
      return "Beyond the door is a room. " + roomResult();
    case DoorBeyond.Chamber:
      return "Beyond the door is a chamber. " + chamberResult();
  }
};
