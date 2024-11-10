import { PassageWidth, passageWidth } from "../../tables/dungeon/passageWidth";
import { specialPassageResult } from "./specialPassage";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";

export const passageWidthResults = (): string => {
  const roll = rollDice(passageWidth.sides);
  const command = getTableEntry(roll, passageWidth);
  switch (command) {
    case PassageWidth.TenFeet:
      return "The passage is 10' wide. ";
    case PassageWidth.TwentyFeet:
      return "The passage is 20' wide. ";
    case PassageWidth.ThirtyFeet:
      return "The passage is 30' wide. ";
    case PassageWidth.FiveFeet:
      return "The passage is 5' wide. ";
    case PassageWidth.SpecialPassage:
      return specialPassageResult();
  }
};
