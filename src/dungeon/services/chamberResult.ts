import {
  ChamberDimensions,
  chamberDimensions,
} from "../../tables/dungeon/chambersRooms";
import { unusualShapeResult } from "./unusualShapeResult";
import { unusualSizeResult } from "./unusualSizeResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";

export const chamberResult = (): string => {
  const roll = rollDice(chamberDimensions.sides);
  const command = getTableEntry(roll, chamberDimensions);
  console.log(
    `chamberDimensions roll: ${roll} is ${ChamberDimensions[command]}`
  );
  switch (command) {
    case ChamberDimensions.Square20x20:
      return "The chamber is square and 20' x 20'. (TODO exits, contents, treasure)";
    case ChamberDimensions.Square30x30:
      return "The chamber is square and 30' x 30'. (TODO exits, contents, treasure)";
    case ChamberDimensions.Square40x40:
      return "The chamber is square and 40' x 40'. (TODO exits, contents, treasure)";
    case ChamberDimensions.Rectangular20x30:
      return "The chamber is rectangular and 20' x 30'. (TODO exits, contents, treasure)";
    case ChamberDimensions.Rectangular30x50:
      return "The chamber is rectangular and 30' x 50'. (TODO exits, contents, treasure)";
    case ChamberDimensions.Rectangular40x60:
      return "The chamber is rectangular and 40' x 60'. (TODO exits, contents, treasure)";
    case ChamberDimensions.Unusual:
      return (
        "The chamber has an unusual shape and size. " +
        unusualShapeResult() +
        unusualSizeResult() +
        "(TODO exits, contents, treasure)"
      );
  }
};
