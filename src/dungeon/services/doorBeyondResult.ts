import { DoorBeyond, doorBeyond } from "../../tables/dungeon/doorBeyond";
import { passageWidthResults } from "./passageWidth";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { chamberResult } from "./chamberResult";
import { roomResult } from "./roomResult";
import type { DungeonMessage, DungeonRollTrace, DungeonTablePreview, DungeonRenderNode } from "../../types/dungeon";
import { resolveDoorBeyond } from "../domain/resolvers";
import { toCompactRender, toDetailRender } from "../adapters/render";

/**
 * Legacy string result (kept for compact mode parity and tests)
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
 * Typed variant using domain outcome + adapters.
 */
export const doorBeyondMessages = (
  options?: {
    roll?: number;
    doorAhead?: boolean;
    detailMode?: boolean;
    takeOverride?: (tableId: string) => number | undefined;
  }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const doorAhead = options?.doorAhead ?? false;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "doorBeyond",
      title: "Door Beyond",
      sides: doorBeyond.sides,
      entries: doorBeyond.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: DoorBeyond[e.command] ?? String(e.command),
      })),
    };
    const messages: (DungeonMessage | DungeonRollTrace | DungeonTablePreview)[] = [
      { kind: "heading", level: 3, text: "Door" },
      preview,
    ];
    return { usedRoll: undefined, messages };
  }
  const node = resolveDoorBeyond({ roll: options?.roll, doorAhead });
  const usedRoll = node.type === "event" ? node.roll : undefined;
  const messages = options?.detailMode ? toDetailRender(node) : toCompactRender(node);
  return { usedRoll, messages };
};
