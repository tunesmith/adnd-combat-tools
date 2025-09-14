import { PassageWidth, passageWidth } from "../../tables/dungeon/passageWidth";
import { specialPassageResult } from "./specialPassage";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import type { DungeonMessage, RollTraceItem } from "../../types/dungeon";

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

export const passageWidthMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll: number; messages: DungeonMessage[]; trace: RollTraceItem } => {
  const usedRoll = options?.roll ?? rollDice(passageWidth.sides);
  const command = getTableEntry(usedRoll, passageWidth);
  let text: string;
  switch (command) {
    case PassageWidth.TenFeet:
      text = "The passage is 10' wide. ";
      break;
    case PassageWidth.TwentyFeet:
      text = "The passage is 20' wide. ";
      break;
    case PassageWidth.ThirtyFeet:
      text = "The passage is 30' wide. ";
      break;
    case PassageWidth.FiveFeet:
      text = "The passage is 5' wide. ";
      break;
    case PassageWidth.SpecialPassage:
      text = options?.detailMode ? "" : specialPassageResult();
      break;
  }
  const messages: DungeonMessage[] = [{ kind: "paragraph", text }];
  const resultLabel = PassageWidth[command] ?? String(command);
  const trace: RollTraceItem = {
    table: "passageWidth",
    roll: usedRoll,
    result: resultLabel,
  };
  return { usedRoll, messages, trace };
};
