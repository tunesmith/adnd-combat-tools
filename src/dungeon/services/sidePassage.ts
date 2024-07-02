import { SidePassages, sidePassages } from "../../tables/dungeon/sidePassages";
import { getTableEntry, rollDice } from "./periodicCheck";

export const sidePassageResults = (): string => {
  const sidePassageRoll = rollDice(sidePassages.sides);
  const sidePassageCommand = getTableEntry(sidePassageRoll, sidePassages);
  if (sidePassageCommand in SidePassages) {
    console.log(
      `sidePassage roll: ${sidePassageRoll} is ${SidePassages[sidePassageCommand]}`
    );
    switch (sidePassageCommand as SidePassages) {
      case SidePassages.Left90:
        return "A side passage branches left 90 degrees. The main passage extends ahead 30'. ";
      case SidePassages.Right90:
        return "A side passage branches right 90 degrees. The main passage extends ahead 30'. ";
      case SidePassages.Left45:
        return "A side passage branches left 45 degrees ahead. The main passage extends ahead 30'. ";
      case SidePassages.Right45:
        return "A side passage branches right 45 degrees ahead. The main passage extends ahead 30'. ";
      case SidePassages.Left135:
        return "A side passage branches left 45 degrees behind (left 135 degrees). The main passage extends ahead 30'. ";
      case SidePassages.Right135:
        return "A side passage branches right 45 degrees behind (right 135 degrees). The main passage extends ahead 30'. ";
      case SidePassages.LeftCurve45:
        return "A side passage branches at a curve, 45 degrees left ahead. The main passage extends ahead 30'. ";
      case SidePassages.RightCurve45:
        return "A side passage branches at a curve, 45 degrees right ahead. The main passage extends ahead 30'. ";
      case SidePassages.PassageT:
        return "The passage reaches a 'T' intersection to either side, extending 30' both directions. ";
      case SidePassages.PassageY:
        return "The passage reaches a 'Y' intersection, each extending 30', ahead 45 degrees to the left and right. ";
      case SidePassages.FourWay:
        return "The passage reaches a four-way intersection, extending 30' in all directions. ";
      case SidePassages.PassageX:
        return (
          "The passage reaches an 'X' intersection, extending 30' in all directions. (If the present passage " +
          "is horizontal or vertical, it forms a fifth passage into the 'X'). "
        );
    }
  } else {
    return "oops, wrong command in sidePassages";
  }
};
