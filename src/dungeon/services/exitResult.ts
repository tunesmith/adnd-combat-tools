import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import {
  NumberOfExits,
  numberOfExits,
} from "../../tables/dungeon/numberOfExits";

export const exitResult = (
  length: number,
  width: number,
  isRoom: boolean = false
): string => {
  const roll = rollDice(numberOfExits.sides);
  const command = getTableEntry(roll, numberOfExits);
  console.log(`numberOfExits roll: ${roll} is ${NumberOfExits[command]}`);
  switch (command) {
    case NumberOfExits.OneTwo600:
      if (length * width <= 600) {
        return "There is one additional exit. (TODO location, direction/width if passage) ";
      } else {
        return "There are two additional exits. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.TwoThree600:
      if (length * width <= 600) {
        return "There are two additional exits. (TODO location, direction/width if passage) ";
      } else {
        return "There are three additional exits. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.ThreeFour600:
      if (length * width <= 600) {
        return "There are three additional exits. (TODO location, direction/width if passage) ";
      } else {
        return "There are four additional exits. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.ZeroOne1200:
      if (length * width <= 1200) {
        return "There are no exits here, other than the entrance. (TODO secret doors) ";
      } else {
        return "There is one additional exit. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.ZeroOne1600:
      if (length * width <= 1600) {
        return "There are no exits here, other than the entrance. (TODO secret doors) ";
      } else {
        return "There is one additional exit. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.OneToFour:
      return "There are 1d4 exits here, other than the entrance. (TODO d4, location, direction/width if passage) ";
    case NumberOfExits.DoorChamberOrPassageRoom:
      if (isRoom) {
        return "There is a passage exiting from the room. (TODO location/direction/width) ";
      } else {
        return "There is a door. (TODO location) ";
      }
  }
};
