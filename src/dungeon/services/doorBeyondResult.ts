import { DoorBeyond, doorBeyond } from "../../tables/dungeon/doorBeyond";
import { passageWidthResults } from "./passageWidth";

import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { chamberResult } from "./chamberResult";
import { roomResult } from "./roomResult";
import { DungeonMessage } from "../../types/dungeon";

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

/**
 * Typed variant that supports an optional roll override and returns
 * structured messages for UI rendering. For now it mirrors the
 * existing string output but captures the primary roll.
 */
export const doorBeyondMessages = (
  options?: { roll?: number; doorAhead?: boolean }
): { usedRoll: number; messages: DungeonMessage[] } => {
  const doorAhead = options?.doorAhead ?? false;
  const usedRoll = options?.roll ?? rollDice(doorBeyond.sides);
  const command = getTableEntry(usedRoll, doorBeyond);

  let text: string;
  switch (command) {
    case DoorBeyond.ParallelPassageOrCloset:
      if (doorAhead) {
        text =
          "Beyond the door is a 10' x 10' room (check contents, treasure). ";
      } else {
        text =
          "Beyond the door is a parallel passage, extending 30' in both directions. " +
          passageWidthResults();
      }
      break;
    case DoorBeyond.PassageStraightAhead:
      text = "Beyond the door is a passage straight ahead. " + passageWidthResults();
      break;
    case DoorBeyond.Passage45AheadBehind:
      text =
        "Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). " +
        passageWidthResults();
      break;
    case DoorBeyond.Passage45BehindAhead:
      text =
        "Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). " +
        passageWidthResults();
      break;
    case DoorBeyond.Room:
      text = "Beyond the door is a room. " + roomResult();
      break;
    case DoorBeyond.Chamber:
      text = "Beyond the door is a chamber. " + chamberResult();
      break;
  }

  const messages: DungeonMessage[] = [
    { kind: "heading", level: 3, text: "Door" },
    { kind: "bullet-list", items: [
      `roll: ${usedRoll} — ${DoorBeyond[command]}`,
    ]},
    { kind: "paragraph", text },
  ];
  return { usedRoll, messages };
};
