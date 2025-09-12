import { passageMessages } from "./passage";
import { doorBeyondMessages } from "./doorBeyondResult";
import { DungeonAction, DungeonStep } from "../../types/dungeon";

export function runDungeonStep(
  action: DungeonAction,
  options?: {
    roll?: number;
    doorAhead?: boolean;
    detailMode?: boolean;
    takeOverride?: (tableId: string) => number | undefined;
  }
): DungeonStep {
  switch (action) {
    case "passage": {
      const { messages } = passageMessages({
        roll: options?.detailMode ? options?.roll : options?.roll,
        detailMode: options?.detailMode,
      });
      return { action, roll: options?.roll, messages };
    }
    case "door": {
      const { messages } = doorBeyondMessages({
        roll: options?.detailMode ? options?.roll : options?.roll,
        doorAhead: options?.doorAhead,
        detailMode: options?.detailMode,
        takeOverride: options?.takeOverride,
      });
      return { action, roll: options?.roll, messages };
    }
  }
}
