import { DoorBeyond, doorBeyond } from "../../tables/dungeon/doorBeyond";
import { passageWidthResults } from "./passageWidth";
import { getTableEntry, rollDice } from "./passage";

export const doorBeyondResult = (): string => {
  const doorBeyondRoll = rollDice(doorBeyond.sides);
  const doorBeyondCommand = getTableEntry(doorBeyondRoll, doorBeyond);
  console.log(
    `doorBeyond roll: ${doorBeyondRoll} is ${DoorBeyond[doorBeyondCommand]}`
  );
  switch (doorBeyondCommand) {
    case DoorBeyond.ParallelPassageOrCloset:
      return (
        "If the door is straight ahead, then beyond the door is a 10' x 10' room (check contents, treasure, TODO). " +
        "Otherwise, if the door is not straight ahead, " +
        "beyond the door is a parallel passage, extending 30' in both directions. " +
        passageWidthResults()
      );
    // if (doorAhead) {
    //   return "Beyond the door is a 10' x 10' room (check contents? treasure?) (TODO)";
    // } else {
    //   return (
    //     "Beyond the door is a parallel passage, extending 30' in both directions. " +
    //     passageWidthResults()
    //   );
    // }
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
      return "Beyond the door is a room. (check room table, TODO...) ";
    case DoorBeyond.Chamber:
      return "Beyond the door is a chamber. (check chamber table, TODO...) ";
  }
};
