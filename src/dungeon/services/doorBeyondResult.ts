import { DoorBeyond, doorBeyond } from "../../tables/dungeon/doorBeyond";
import { passageWidthResults } from "./passageWidth";
import { getTableEntry, rollDice } from "./periodicCheck";

export const doorBeyondResult = (doorAhead: boolean): string => {
  const doorBeyondRoll = rollDice(doorBeyond.sides);
  const doorBeyondCommand = getTableEntry(doorBeyondRoll, doorBeyond);
  if (doorBeyondCommand in DoorBeyond) {
    console.log(
      `doorBeyond roll: ${doorBeyondRoll} is ${DoorBeyond[doorBeyondCommand]}`
    );
    switch (doorBeyondCommand as DoorBeyond) {
      case DoorBeyond.ParallelPassageOrCloset:
        if (doorAhead) {
          return "Beyond the door is a 10' x 10' room (check contents? treasure?) (TODO)";
        } else {
          return (
            "Beyond the door is a parallel passage, extending 30' in both directions. " +
            passageWidthResults()
          );
        }
      case DoorBeyond.PassageStraightAhead:
        return (
          "Beyond the door is a passage straight ahead. " +
          passageWidthResults()
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
        return "Beyond the door is a room. (check room table, TODO...) ";
      case DoorBeyond.Chamber:
        return "Beyond the door is a chamber. (check chamber table, TODO...) ";
    }
  } else {
    return "oops, wrong command in doorBeyond";
  }
};
