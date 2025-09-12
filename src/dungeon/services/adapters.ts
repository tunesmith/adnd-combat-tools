import { passageResults } from "./passage";
import { doorBeyondResult } from "./doorBeyondResult";

export type DungeonAction = "passage" | "door";

export type DungeonMessage = {
  kind: "paragraph"; // evolve later to include lists, headings, etc.
  text: string;
};

export type DungeonStep = {
  action: DungeonAction;
  roll?: number; // UI-provided roll; services currently roll internally
  messages: DungeonMessage[];
};

export function runDungeonStep(
  action: DungeonAction,
  options?: { roll?: number; doorAhead?: boolean }
): DungeonStep {
  switch (action) {
    case "passage": {
      const text = passageResults();
      return { action, roll: options?.roll, messages: [{ kind: "paragraph", text }] };
    }
    case "door": {
      const text = doorBeyondResult(options?.doorAhead ?? false);
      return { action, roll: options?.roll, messages: [{ kind: "paragraph", text }] };
    }
  }
}

