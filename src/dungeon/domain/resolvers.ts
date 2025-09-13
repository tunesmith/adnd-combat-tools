import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { periodicCheck } from "../../tables/dungeon/periodicCheck";
import { doorBeyond } from "../../tables/dungeon/doorBeyond";
import { DungeonOutcomeNode, OutcomeEvent } from "./outcome";
import { sidePassages } from "../../tables/dungeon/sidePassages";
import { passageTurns } from "../../tables/dungeon/passageTurns";
import { stairs } from "../../tables/dungeon/stairs";
import { specialPassage } from "../../tables/dungeon/specialPassage";

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

export function resolveSidePassages(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(sidePassages.sides);
  const command = getTableEntry(usedRoll, sidePassages);
  const event: OutcomeEvent = { kind: "sidePassages", result: command } as OutcomeEvent;
  return { type: "event", roll: usedRoll, event };
}

export function resolvePassageTurns(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(passageTurns.sides);
  const command = getTableEntry(usedRoll, passageTurns);
  const event: OutcomeEvent = { kind: "passageTurns", result: command } as OutcomeEvent;
  return { type: "event", roll: usedRoll, event };
}

export function resolveStairs(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(stairs.sides);
  const command = getTableEntry(usedRoll, stairs);
  const event: OutcomeEvent = { kind: "stairs", result: command } as OutcomeEvent;
  return { type: "event", roll: usedRoll, event };
}

export function resolveSpecialPassage(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(specialPassage.sides);
  const command = getTableEntry(usedRoll, specialPassage);
  const event: OutcomeEvent = { kind: "specialPassage", result: command } as OutcomeEvent;
  return { type: "event", roll: usedRoll, event };
}
