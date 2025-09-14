import { PassageWidth, passageWidth } from "../../tables/dungeon/passageWidth";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { SpecialPassage, specialPassage, galleryStairLocation, GalleryStairLocation, galleryStairOccurrence, GalleryStairOccurrence, streamConstruction, StreamConstruction, riverConstruction, RiverConstruction, riverBoatBank, RiverBoatBank, chasmDepth, ChasmDepth, chasmConstruction, ChasmConstruction, jumpingPlaceWidth, JumpingPlaceWidth } from "../../tables/dungeon/specialPassage";
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
      return compactRandomSpecialPassage();
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
      text = options?.detailMode ? "" : compactRandomSpecialPassage();
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

function compactRandomSpecialPassage(): string {
  const r = rollDice(specialPassage.sides);
  const cmd = getTableEntry(r, specialPassage);
  switch (cmd) {
    case SpecialPassage.FortyFeetColumns:
      return "The passage is 40' wide, with columns down the center. ";
    case SpecialPassage.FortyFeetDoubleColumns:
      return "The passage is 40' wide, with a double row of columns. ";
    case SpecialPassage.FiftyFeetDoubleColumns:
      return "The passage is 50' wide, with a double row of columns. ";
    case SpecialPassage.FiftyFeetGalleries: {
      const prefix = "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. ";
      const r1 = rollDice(galleryStairLocation.sides);
      const c1 = getTableEntry(r1, galleryStairLocation);
      if (c1 === GalleryStairLocation.PassageEnd) {
        const r2 = rollDice(galleryStairOccurrence.sides);
        const c2 = getTableEntry(r2, galleryStairOccurrence);
        const tail =
          c2 === GalleryStairOccurrence.Replace
            ? "If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. "
            : "If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ";
        return prefix + "Stairs up to the gallery will be at the end of the passage. " + tail;
      }
      return prefix + "Stairs up to the gallery are at the beginning of the passage. ";
    }
    case SpecialPassage.TenFootStream: {
      const prefix = "A stream, 10' wide, bisects the passage. ";
      const r1 = rollDice(streamConstruction.sides);
      const c1 = getTableEntry(r1, streamConstruction);
      const tail = c1 === StreamConstruction.Bridged ? "A bridge crosses the stream. " : "";
      return prefix + tail;
    }
    case SpecialPassage.TwentyFootRiver:
    case SpecialPassage.FortyFootRiver:
    case SpecialPassage.SixtyFootRiver: {
      const prefix =
        cmd === SpecialPassage.TwentyFootRiver
          ? "A river, 20' wide, bisects the passage. "
          : cmd === SpecialPassage.FortyFootRiver
          ? "A river, 40' wide, bisects the passage. "
          : "A river, 60' wide, bisects the passage. ";
      const r1 = rollDice(riverConstruction.sides);
      const c1 = getTableEntry(r1, riverConstruction);
      if (c1 === RiverConstruction.Bridged) return prefix + "A bridge crosses the river. ";
      if (c1 === RiverConstruction.Obstacle) return prefix;
      const r2 = rollDice(riverBoatBank.sides);
      const c2 = getTableEntry(r2, riverBoatBank);
      const tail = c2 === RiverBoatBank.ThisSide ? "The boat is on this bank of the river. " : "The boat is on the opposite bank of the river. ";
      return prefix + "There is a boat. " + tail;
    }
    case SpecialPassage.TwentyFootChasm: {
      const prefix = "A chasm, 20' wide, bisects the passage. ";
      const r1 = rollDice(chasmDepth.sides);
      const c1 = getTableEntry(r1, chasmDepth);
      const depth =
        c1 === ChasmDepth.Feet150
          ? "The chasm is 150' deep. "
          : c1 === ChasmDepth.Feet160
          ? "The chasm is 160' deep. "
          : c1 === ChasmDepth.Feet170
          ? "The chasm is 170' deep. "
          : c1 === ChasmDepth.Feet180
          ? "The chasm is 180' deep. "
          : c1 === ChasmDepth.Feet190
          ? "The chasm is 190' deep. "
          : "The chasm is 200' deep. ";
      const r2 = rollDice(chasmConstruction.sides);
      const c2 = getTableEntry(r2, chasmConstruction);
      if (c2 === ChasmConstruction.Bridged) return prefix + depth + "A bridge crosses the chasm. ";
      if (c2 === ChasmConstruction.Obstacle) return prefix + depth + "It has no bridge, and is too wide to jump across. ";
      const r3 = rollDice(jumpingPlaceWidth.sides);
      const c3 = getTableEntry(r3, jumpingPlaceWidth);
      const width = c3 === JumpingPlaceWidth.FiveFeet ? "It is 5' wide. " : "It is 10' wide. ";
      return prefix + depth + "There is a jumping place. " + width;
    }
  }
}
