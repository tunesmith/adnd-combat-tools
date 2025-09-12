import { passageResults } from "./passage";
import { doorBeyondResult } from "./doorBeyondResult";
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
      const text = doorBeyondResult(options?.doorAhead ?? false);
      const messages: DungeonMessage[] = [{ kind: "paragraph", text }];
      return { action, roll: options?.roll, messages };
    }
  }
}
