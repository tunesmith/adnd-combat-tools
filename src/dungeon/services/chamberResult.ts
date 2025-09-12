import {
  ChamberDimensions,
  chamberDimensions,
} from "../../tables/dungeon/chambersRooms";
import { unusualShapeResult } from "./unusualShapeResult";
import { unusualSizeResult } from "./unusualSizeResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { exitResult } from "./exitResult";
import { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";

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
  let desc: string;
  switch (command) {
    case ChamberDimensions.Square20x20:
      desc = "The chamber is square and 20' x 20'. " + exitResult(20, 20) + "(TODO contents, treasure) ";
      break;
    case ChamberDimensions.Square30x30:
      desc = "The chamber is square and 30' x 30'. " + exitResult(30, 30) + "(TODO contents, treasure) ";
      break;
    case ChamberDimensions.Square40x40:
      desc = "The chamber is square and 40' x 40'. " + exitResult(40, 40) + "(TODO contents, treasure) ";
      break;
    case ChamberDimensions.Rectangular20x30:
      desc = "The chamber is rectangular and 20' x 30'. " + exitResult(20, 30) + "(TODO contents, treasure) ";
      break;
    case ChamberDimensions.Rectangular30x50:
      desc = "The chamber is rectangular and 30' x 50'. " + exitResult(30, 50) + "(TODO contents, treasure) ";
      break;
    case ChamberDimensions.Rectangular40x60:
      desc = "The chamber is rectangular and 40' x 60'. " + exitResult(40, 60) + "(TODO contents, treasure) ";
      break;
    case ChamberDimensions.Unusual:
      desc =
        "The chamber has an unusual shape and size. " +
        unusualShapeResult() +
        unusualSizeResult() +
        "(TODO exits, contents, treasure) ";
      break;
  }
  const messages: DungeonMessage[] = [
    { kind: "heading", level: 4, text: "Chamber Dimensions" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${ChamberDimensions[command] ?? String(command)}`] },
    { kind: "paragraph", text: desc },
  ];
  return { usedRoll, messages };
};
