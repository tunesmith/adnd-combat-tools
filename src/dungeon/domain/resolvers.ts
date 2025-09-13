import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { periodicCheck } from "../../tables/dungeon/periodicCheck";
import { doorBeyond } from "../../tables/dungeon/doorBeyond";
import { DungeonOutcomeNode } from "./outcome";

export function resolvePeriodicCheck(options?: {
  roll?: number;
  level?: number;
  avoidMonster?: boolean;
}): DungeonOutcomeNode {
  const level = options?.level ?? 1;
  const usedRoll = options?.roll ?? rollDice(periodicCheck.sides);
  const command = getTableEntry(usedRoll, periodicCheck);
  return {
    type: "event",
    roll: usedRoll,
    event: { kind: "periodicCheck", result: command, level, avoidMonster: options?.avoidMonster },
  };
}

export function resolveDoorBeyond(options?: {
  roll?: number;
  doorAhead?: boolean;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(doorBeyond.sides);
  const command = getTableEntry(usedRoll, doorBeyond);
  return {
    type: "event",
    roll: usedRoll,
    event: { kind: "doorBeyond", result: command, doorAhead: options?.doorAhead },
  };
}
