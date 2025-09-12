import { DoorBeyond, doorBeyond } from "../../tables/dungeon/doorBeyond";
import { passageWidthResults } from "./passageWidth";

import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { chamberResult } from "./chamberResult";
import { roomResult } from "./roomResult";
import { DungeonMessage, DungeonRollTrace, DungeonTablePreview } from "../../types/dungeon";
import { passageWidthMessages } from "./passageWidth";
import { passageWidth, PassageWidth } from "../../tables/dungeon/passageWidth";

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
  options?: { roll?: number; doorAhead?: boolean; detailMode?: boolean }
): { usedRoll: number; messages: (DungeonMessage | DungeonRollTrace | DungeonTablePreview)[] } => {
  const doorAhead = options?.doorAhead ?? false;
  const usedRoll = options?.roll ?? rollDice(doorBeyond.sides);
  const command = getTableEntry(usedRoll, doorBeyond);

  let text: string;
  const traceItems: DungeonRollTrace["items"] = [];
  const previews: DungeonTablePreview[] = [];
  switch (command) {
    case DoorBeyond.ParallelPassageOrCloset:
      if (doorAhead) {
        text =
          "Beyond the door is a 10' x 10' room (check contents, treasure). ";
      } else {
        text = "Beyond the door is a parallel passage, extending 30' in both directions. ";
        const widthPreview: DungeonTablePreview | undefined = options?.detailMode
          ? {
              kind: "table-preview",
              id: "passageWidth",
              title: "Passage Width",
              sides: passageWidth.sides,
              entries: passageWidth.entries.map((e) => ({
                range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
                label: PassageWidth[e.command] ?? String(e.command),
              })),
            }
          : undefined;
        const width = passageWidthMessages();
        text += width.messages.map((m) => (m.kind === "paragraph" ? m.text : "")).join("");
        traceItems.push({
          table: "passageWidth",
          roll: width.usedRoll,
          result: width.trace.result,
        });
        if (widthPreview) previews.push(widthPreview);
      }
      break;
    case DoorBeyond.PassageStraightAhead:
      text = "Beyond the door is a passage straight ahead. ";
      {
        const widthPreview: DungeonTablePreview | undefined = options?.detailMode
          ? {
              kind: "table-preview",
              id: "passageWidth",
              title: "Passage Width",
              sides: passageWidth.sides,
              entries: passageWidth.entries.map((e) => ({
                range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
                label: PassageWidth[e.command] ?? String(e.command),
              })),
            }
          : undefined;
        const width = passageWidthMessages();
        text += width.messages.map((m) => (m.kind === "paragraph" ? m.text : "")).join("");
        traceItems.push({ table: "passageWidth", roll: width.usedRoll, result: width.trace.result });
        if (widthPreview) previews.push(widthPreview);
      }
      break;
    case DoorBeyond.Passage45AheadBehind:
      text =
        "Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). ";
      {
        const widthPreview: DungeonTablePreview | undefined = options?.detailMode
          ? {
              kind: "table-preview",
              id: "passageWidth",
              title: "Passage Width",
              sides: passageWidth.sides,
              entries: passageWidth.entries.map((e) => ({
                range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
                label: PassageWidth[e.command] ?? String(e.command),
              })),
            }
          : undefined;
        const width = passageWidthMessages();
        text += width.messages.map((m) => (m.kind === "paragraph" ? m.text : "")).join("");
        traceItems.push({ table: "passageWidth", roll: width.usedRoll, result: width.trace.result });
        if (widthPreview) previews.push(widthPreview);
      }
      break;
    case DoorBeyond.Passage45BehindAhead:
      text =
        "Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). ";
      {
        const widthPreview: DungeonTablePreview | undefined = options?.detailMode
          ? {
              kind: "table-preview",
              id: "passageWidth",
              title: "Passage Width",
              sides: passageWidth.sides,
              entries: passageWidth.entries.map((e) => ({
                range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
                label: PassageWidth[e.command] ?? String(e.command),
              })),
            }
          : undefined;
        const width = passageWidthMessages();
        text += width.messages.map((m) => (m.kind === "paragraph" ? m.text : "")).join("");
        traceItems.push({ table: "passageWidth", roll: width.usedRoll, result: width.trace.result });
        if (widthPreview) previews.push(widthPreview);
      }
      break;
    case DoorBeyond.Room:
      text = "Beyond the door is a room. " + roomResult();
      break;
    case DoorBeyond.Chamber:
      text = "Beyond the door is a chamber. " + chamberResult();
      break;
  }

  const messages: (DungeonMessage | DungeonRollTrace | DungeonTablePreview)[] = [
    { kind: "heading", level: 3, text: "Door" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${DoorBeyond[command]}`] },
    { kind: "paragraph", text },
  ];
  if (previews.length > 0) {
    messages.push(...previews);
  }
  if (traceItems.length > 0) {
    messages.push({ kind: "roll-trace", items: traceItems });
  }
  return { usedRoll, messages };
};
