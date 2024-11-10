import { getTableEntry, rollDice } from "./passage";
import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";
import {
  periodicCheck,
  PeriodicCheck,
} from "../../tables/dungeon/periodicCheck";

/**
 * When doing passage checks, the rules subtly imply this looks for *closed*
 * doors. Opening a door is a fresh move. For closed doors, we don't need to
 * roll what is behind the door. Roll for that when a decision is made to
 * open a door (or when the situation calls for it, like listening at doors).
 *
 * Check again immediately on TABLE I (periodicCheck) unless
 * door is straight ahead; if another door is not indicated,
 * then ignore the result and check again 30' past the door.
 */
export const closedDoorResult = (existingDoors: DoorLocation[]): string => {
  const doorLocationRoll = rollDice(doorLocation.sides);
  const doorLocationCommand = getTableEntry(doorLocationRoll, doorLocation);
  console.log(
    `door roll: ${doorLocationRoll} is ${DoorLocation[doorLocationCommand]}`
  );
  if (doorLocationCommand === DoorLocation.Ahead) {
    // DoorLocation.Ahead implies it is a dead end. Don't check for any more additional doors.
    return `A door is ${DoorLocation[doorLocationCommand]}. `;
  } else {
    if (existingDoors.includes(doorLocationCommand)) {
      // This branch implies we haven't rolled DoorLocation.Ahead
      // console.log(`existingDoors: `, existingDoors);
      // console.log(
      //   `ignore this extra ${DoorLocation[doorLocationCommand]} as we already rolled it`
      // );
      return "There are no more doors. The main passage extends -- check again in 30'. ";
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
        const nextDoor = closedDoorResult([
          ...existingDoors,
          doorLocationCommand,
        ]);
        return (
          `A door is to the ${DoorLocation[doorLocationCommand]}. ` +
          `${nextDoor}`
        );
      } else {
        return (
          `A door is to the ${DoorLocation[doorLocationCommand]}. ` +
          `There are no other doors. The main passage extends -- check again in 30'. `
        );
      }
    }
  }
};
