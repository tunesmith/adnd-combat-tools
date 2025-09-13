import {
  RoomDimensions,
  roomDimensions,
} from "../../tables/dungeon/chambersRooms";
import { unusualShapeMessages, unusualShapeResult } from "./unusualShapeResult";
import { unusualSizeMessages, unusualSizeResult } from "./unusualSizeResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { exitMessages, exitResult } from "./exitResult";
import { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";

export const roomResult = (): string => {
  const roll = rollDice(roomDimensions.sides);
  const command = getTableEntry(roll, roomDimensions);
  console.log(`roomDimensions roll: ${roll} is ${RoomDimensions[command]}`);
  switch (command) {
    case RoomDimensions.Square10x10:
      return (
        "The room is square and 10' x 10'. " +
        exitResult(10, 10, true) +
        "(TODO contents, treasure) "
      );
    case RoomDimensions.Square20x20:
      return (
        "The room is square and 20' x 20'. " +
        exitResult(20, 20, true) +
        "(TODO contents, treasure) "
      );
    case RoomDimensions.Square30x30:
      return (
        "The room is square and 30' x 30'. " +
        exitResult(30, 30, true) +
        "(TODO contents, treasure) "
      );
    case RoomDimensions.Square40x40:
      return (
        "The room is square and 40' x 40'. " +
        exitResult(40, 40, true) +
        "(TODO contents, treasure) "
      );
    case RoomDimensions.Rectangular10x20:
      return (
        "The room is rectangular and 10' x 20'. " +
        exitResult(10, 20, true) +
        "(TODO contents, treasure) "
      );
    case RoomDimensions.Rectangular20x30:
      return (
        "The room is rectangular and 20' x 30'. " +
        exitResult(20, 30, true) +
        "(TODO contents, treasure) "
      );
    case RoomDimensions.Rectangular20x40:
      return (
        "The room is rectangular and 20' x 40'. " +
        exitResult(20, 40, true) +
        "(TODO contents, treasure) "
      );
    case RoomDimensions.Rectangular30x40:
      return (
        "The room is rectangular and 30' x 40'. " +
        exitResult(30, 40, true) +
        "(TODO contents, treasure) "
      );
    case RoomDimensions.Unusual:
      return (
        "The room has an unusual shape and size. " +
        unusualShapeResult() +
        unusualSizeResult() +
        "(TODO exits, contents, treasure) "
      );
  }
};

/**
 * Typed variant for room dimensions.
 * - In detail mode with no roll, returns only a table preview node.
 * - Otherwise returns a heading + bullet with roll/result and a paragraph description.
 */
export const roomMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "roomDimensions",
      title: "Room Dimensions",
      sides: roomDimensions.sides,
      entries: roomDimensions.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: RoomDimensions[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }

  const usedRoll = options?.roll ?? rollDice(roomDimensions.sides);
  const command = getTableEntry(usedRoll, roomDimensions);
  let baseDesc: string;
  let dims: { length: number; width: number } | undefined;
  switch (command) {
    case RoomDimensions.Square10x10:
      baseDesc = "The room is square and 10' x 10'. ";
      dims = { length: 10, width: 10 };
      break;
    case RoomDimensions.Square20x20:
      baseDesc = "The room is square and 20' x 20'. ";
      dims = { length: 20, width: 20 };
      break;
    case RoomDimensions.Square30x30:
      baseDesc = "The room is square and 30' x 30'. ";
      dims = { length: 30, width: 30 };
      break;
    case RoomDimensions.Square40x40:
      baseDesc = "The room is square and 40' x 40'. ";
      dims = { length: 40, width: 40 };
      break;
    case RoomDimensions.Rectangular10x20:
      baseDesc = "The room is rectangular and 10' x 20'. ";
      dims = { length: 10, width: 20 };
      break;
    case RoomDimensions.Rectangular20x30:
      baseDesc = "The room is rectangular and 20' x 30'. ";
      dims = { length: 20, width: 30 };
      break;
    case RoomDimensions.Rectangular20x40:
      baseDesc = "The room is rectangular and 20' x 40'. ";
      dims = { length: 20, width: 40 };
      break;
    case RoomDimensions.Rectangular30x40:
      baseDesc = "The room is rectangular and 30' x 40'. ";
      dims = { length: 30, width: 40 };
      break;
    case RoomDimensions.Unusual:
      baseDesc = "The room has an unusual shape and size. ";
      break;
  }
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Room Dimensions" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${RoomDimensions[command] ?? String(command)}`] },
    { kind: "paragraph", text: baseDesc },
  ];
  if (dims) {
    if (options?.detailMode) {
      const preview = exitMessages({ length: dims.length, width: dims.width, isRoom: true, detailMode: true });
      messages.push(...preview.messages);
    } else {
      const exits = exitMessages({ length: dims.length, width: dims.width, isRoom: true });
      for (const m of exits.messages) if (m.kind === "paragraph") messages.push(m);
    }
  } else {
    // Unusual shape: stage shape + size previews in detail mode; otherwise legacy auto text
    if (options?.detailMode) {
      const shapePrev = unusualShapeMessages({ detailMode: true });
      messages.push(...shapePrev.messages);
      const sizePrev = unusualSizeMessages({ detailMode: true });
      messages.push(...sizePrev.messages);
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
