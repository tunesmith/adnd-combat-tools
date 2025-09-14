import {
  ChamberDimensions,
  chamberDimensions,
} from "../../tables/dungeon/chambersRooms";
import { unusualShapeMessages, unusualShapeResult } from "./unusualShapeResult";
import { unusualSizeMessages, unusualSizeResult } from "./unusualSizeResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { exitMessages } from "./exitResult";
import { exitResult } from "./exitResult";
import type { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";

export const chamberResult = (): string => {
  const roll = rollDice(chamberDimensions.sides);
  const command = getTableEntry(roll, chamberDimensions);
  console.log(
    `chamberDimensions roll: ${roll} is ${ChamberDimensions[command]}`
  );
  switch (command) {
    case ChamberDimensions.Square20x20:
      return (
        "The chamber is square and 20' x 20'. " +
        exitResult(20, 20) +
        "(TODO contents, treasure) "
      );
    case ChamberDimensions.Square30x30:
      return (
        "The chamber is square and 30' x 30'. " +
        exitResult(30, 30) +
        "(TODO contents, treasure) "
      );
    case ChamberDimensions.Square40x40:
      return (
        "The chamber is square and 40' x 40'. " +
        exitResult(40, 40) +
        "(TODO contents, treasure) "
      );
    case ChamberDimensions.Rectangular20x30:
      return (
        "The chamber is rectangular and 20' x 30'. " +
        exitResult(20, 30) +
        "(TODO contents, treasure) "
      );
    case ChamberDimensions.Rectangular30x50:
      return (
        "The chamber is rectangular and 30' x 50'. " +
        exitResult(30, 50) +
        "(TODO contents, treasure) "
      );
    case ChamberDimensions.Rectangular40x60:
      return (
        "The chamber is rectangular and 40' x 60'. " +
        exitResult(40, 60) +
        "(TODO contents, treasure) "
      );
    case ChamberDimensions.Unusual:
      return (
        "The chamber has an unusual shape and size. " +
        unusualShapeResult() +
        unusualSizeResult() +
        "(TODO exits, contents, treasure) "
      );
  }
};

export const chamberMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "chamberDimensions",
      title: "Chamber Dimensions",
      sides: chamberDimensions.sides,
      entries: chamberDimensions.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: ChamberDimensions[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }

  const usedRoll = options?.roll ?? rollDice(chamberDimensions.sides);
  const command = getTableEntry(usedRoll, chamberDimensions);
  let baseDesc: string;
  let dims: { length: number; width: number } | undefined;
  switch (command) {
    case ChamberDimensions.Square20x20:
      baseDesc = "The chamber is square and 20' x 20'. ";
      dims = { length: 20, width: 20 };
      break;
    case ChamberDimensions.Square30x30:
      baseDesc = "The chamber is square and 30' x 30'. ";
      dims = { length: 30, width: 30 };
      break;
    case ChamberDimensions.Square40x40:
      baseDesc = "The chamber is square and 40' x 40'. ";
      dims = { length: 40, width: 40 };
      break;
    case ChamberDimensions.Rectangular20x30:
      baseDesc = "The chamber is rectangular and 20' x 30'. ";
      dims = { length: 20, width: 30 };
      break;
    case ChamberDimensions.Rectangular30x50:
      baseDesc = "The chamber is rectangular and 30' x 50'. ";
      dims = { length: 30, width: 50 };
      break;
    case ChamberDimensions.Rectangular40x60:
      baseDesc = "The chamber is rectangular and 40' x 60'. ";
      dims = { length: 40, width: 60 };
      break;
    case ChamberDimensions.Unusual:
      baseDesc = "The chamber has an unusual shape and size. ";
      break;
  }
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Chamber Dimensions" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${ChamberDimensions[command] ?? String(command)}`] },
    { kind: "paragraph", text: baseDesc },
  ];
  if (dims) {
    if (options?.detailMode) {
      const preview = exitMessages({ length: dims.length, width: dims.width, isRoom: false, detailMode: true });
      messages.push(...preview.messages);
    } else {
      const exits = exitMessages({ length: dims.length, width: dims.width, isRoom: false });
      for (const m of exits.messages) if (m.kind === "paragraph") messages.push(m);
    }
  } else {
    // Unusual: preview shape and size subtables in detail mode; otherwise auto-roll legacy text
    if (options?.detailMode) {
      const shapePrev = unusualShapeMessages({ detailMode: true });
      messages.push(...shapePrev.messages);
      const sizePrev = unusualSizeMessages({ detailMode: true });
      messages.push(...sizePrev.messages);
      // Exits TBD based on derived dimensions; keep contents/treasure TODO
      messages.push({ kind: "paragraph", text: "(TODO contents, treasure) " });
    } else {
      messages[messages.length - 1] = {
        kind: "paragraph",
        text: baseDesc + unusualShapeResult() + unusualSizeResult() + "(TODO exits, contents, treasure) ",
      };
    }
  }
  return { usedRoll, messages };
};
