import { getTableEntry, rollDice } from "./periodicCheck";
import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";
import {
  periodicCheck,
  PeriodicCheck,
} from "../../tables/dungeon/periodicCheck";
import { doorBeyondResult } from "./doorBeyondResult";

/**
 * Check again immediately on TABLE I (periodicCheck) unless
 * door is straight ahead; if another door is not indicated,
 * then ignore the result and check again 30' past the door.
 */
export const doorResult = (existingDoors: DoorLocation[]): string => {
  const doorLocationRoll = rollDice(doorLocation.sides);
  const doorLocationCommand = getTableEntry(doorLocationRoll, doorLocation);
  if (doorLocationCommand in DoorLocation) {
    console.log(
      `door roll: ${doorLocationRoll} is ${DoorLocation[doorLocationCommand]}`
    );
    if (doorLocationCommand === DoorLocation.Ahead) {
      // console.log(`door ahead; call doorBeyond for Ahead`);
      return (
        `A door is ${DoorLocation[doorLocationCommand]}. ` +
        doorBeyondResult(true)
      );
    } else {
      if (existingDoors.includes(doorLocationCommand as DoorLocation)) {
        // console.log(`existingDoors: `, existingDoors);
        // console.log(
        //   `ignore this extra ${DoorLocation[doorLocationCommand]} as we already rolled it`
        // );
        return "There are no more doors, so the main passage extends 30' ahead. ";
      } else {
        // console.log(
        //   `got ${DoorLocation[doorLocationCommand]}, checking for another door`
        // );
        const recheckPeriodic = rollDice(periodicCheck.sides);
        const periodicCommand = getTableEntry(recheckPeriodic, periodicCheck);
        // console.log(
        //   `periodic recheck: ${recheckPeriodic} is ${PeriodicCheck[periodicCommand]}`
        // );

        if (periodicCommand === PeriodicCheck.Door) {
          const nextDoor = doorResult([
            ...existingDoors,
            doorLocationCommand as DoorLocation,
          ]);
          return (
            `A door is to the ${DoorLocation[doorLocationCommand]}. ` +
            doorBeyondResult(false) +
            `${nextDoor}`
          );
        } else {
          return (
            `A door is to the ${DoorLocation[doorLocationCommand]}. ` +
            doorBeyondResult(false) +
            `There are no other doors, so the main passage extends 30' ahead. `
          );
        }
      }
    }
  } else {
    return "oops, wrong command in doorLocation";
  }
};
