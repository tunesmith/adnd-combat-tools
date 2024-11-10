import { getTableEntry, rollDice } from "./passage";
import {
  Chute,
  chute,
  Egress,
  egressOne,
  egressThree,
  egressTwo,
  Stairs,
  stairs,
} from "../../tables/dungeon/stairs";
import { Table } from "../../tables/dungeon/dungeonTypes";
import { chamberResult } from "./chamberResult";

export const stairsResult = (): string => {
  const roll = rollDice(stairs.sides);
  const command = getTableEntry(roll, stairs);
  console.log(`stairs roll: ${roll} is ${Stairs[command]}`);
  switch (command) {
    case Stairs.DownOne:
      return (
        "There are stairs here that descend one level. " +
        egressResult(egressOne)
      );
    case Stairs.DownTwo:
      return (
        "There are stairs here that descend two levels. " +
        egressResult(egressTwo)
      );
    case Stairs.DownThree:
      return (
        "There are stairs here that descend three levels. " +
        egressResult(egressThree)
      );
    case Stairs.UpOne:
      return "There are stairs here that ascend one level. ";
    case Stairs.UpDead:
      return (
        "There are stairs here that ascend one level to a dead end. " +
        chuteResult()
      );
    case Stairs.DownDead:
      return (
        "There are stairs here that descend one level to a dead end. " +
        chuteResult()
      );
    case Stairs.ChimneyUpOne:
      return "There is a chimney that goes up one level. The current passage extends 30'. ";
    case Stairs.ChimneyUpTwo:
      return "There is a chimney that goes up two levels. The current passage extends 30'. ";
    case Stairs.ChimneyDownTwo:
      return "There is a chimney that goes down two levels. The current passage extends 30'. ";
    case Stairs.TrapDoorDownOne:
      return "There is a trap door that goes down one level. The current passage extends 30'. ";
    case Stairs.TrapDownDownTwo:
      return "There is a trap door that goes down two levels. The current passage extends 30'. ";
    case Stairs.UpOneDownTwo:
      return (
        "There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. " +
        chamberResult()
      );
  }
};

export const egressResult = (egressTable: Table<Egress>): string => {
  const roll = rollDice(egressTable.sides);
  const command = getTableEntry(roll, egressTable);
  console.log(`egress roll: ${roll} is ${Egress[command]}`);
  switch (command) {
    case Egress.Closed:
      return "After descending, an unnoticed door will close egress for the day. ";
    case Egress.Open:
      return "";
  }
};

export const chuteResult = (): string => {
  const roll = rollDice(chute.sides);
  const command = getTableEntry(roll, chute);
  console.log(`chute roll: ${roll} is ${Chute[command]}`);
  switch (command) {
    case Chute.Exists:
      return "The stairs will turn into a chute, descending two levels from the top. ";
    case Chute.DoesNotExist:
      return "";
  }
};
