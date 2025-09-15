import { DoorBeyond, doorBeyond } from "../../tables/dungeon/doorBeyond";
import { passageWidthMessages } from "./passageWidth";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { chamberMessages } from "./chamberResult";
import { roomMessages } from "./roomResult";
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
        const width = passageWidthMessages({});
        let wtext = "";
        for (const m of width.messages) if (m.kind === "paragraph") wtext += m.text;
        return (
          "Beyond the door is a parallel passage, extending 30' in both directions. " +
          wtext
        );
      }
    case DoorBeyond.PassageStraightAhead: {
      const width = passageWidthMessages({});
      let wtext = "";
      for (const m of width.messages) if (m.kind === "paragraph") wtext += m.text;
      return "Beyond the door is a passage straight ahead. " + wtext;
    }
    case DoorBeyond.Passage45AheadBehind: {
      const width = passageWidthMessages({});
      let wtext = "";
      for (const m of width.messages) if (m.kind === "paragraph") wtext += m.text;
      return (
        "Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). " +
        wtext
      );
    }
    case DoorBeyond.Passage45BehindAhead: {
      const width = passageWidthMessages({});
      let wtext = "";
      for (const m of width.messages) if (m.kind === "paragraph") wtext += m.text;
      return (
        "Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). " +
        wtext
      );
    }
    case DoorBeyond.Room: {
      const res = roomMessages({});
      let text = "Beyond the door is a room. ";
      for (const m of res.messages) if (m.kind === "paragraph") text += m.text;
      return text;
    }
    case DoorBeyond.Chamber: {
      const res = chamberMessages({});
      let text = "Beyond the door is a chamber. ";
      for (const m of res.messages) if (m.kind === "paragraph") text += m.text;
      return text;
    }
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
