import {
  RoomDimensions,
  roomDimensions,
} from "../../tables/dungeon/chambersRooms";
import { unusualShapeResult } from "./unusualShapeResult";
import { unusualSizeResult } from "./unusualSizeResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { exitResult } from "./exitResult";

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
