import { getTableEntry, rollDice } from "./passage";
import { passageTurns, PassageTurns } from "../../tables/dungeon/passageTurns";
import { passageWidthResults } from "./passageWidth";

export const passageTurnResults = (): string => {
  const roll = rollDice(passageTurns.sides);
  const command = getTableEntry(roll, passageTurns);
  console.log(`passageTurn roll: ${roll} is ${PassageTurns[command]}`);
  switch (command) {
    case PassageTurns.Left90:
      return (
        "The passage turns left 90 degrees - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Left45:
      return (
        "The passage turns left 45 degrees ahead - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Left135:
      return (
        "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Right90:
      return (
        "The passage turns right 90 degrees - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Right45:
      return (
        "The passage turns right 45 degrees ahead - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Right135:
      return (
        "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. " +
        passageWidthResults()
      );
  }
};
