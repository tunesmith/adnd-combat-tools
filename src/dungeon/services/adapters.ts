import { passageResults } from "./passage";
import { doorBeyondMessages } from "./doorBeyondResult";
import {
  DungeonAction,
  DungeonMessage,
  DungeonStep,
} from "../../types/dungeon";

export function runDungeonStep(
  action: DungeonAction,
  options?: { roll?: number; doorAhead?: boolean }
): DungeonStep {
  switch (action) {
    case "passage": {
      const text = passageResults();
      const messages: DungeonMessage[] = [{ kind: "paragraph", text }];
      return { action, roll: options?.roll, messages };
    }
    case "door": {
      const { messages } = doorBeyondMessages({
        roll: options?.roll,
        doorAhead: options?.doorAhead,
      });
      return { action, roll: options?.roll, messages };
    }
  }
}
