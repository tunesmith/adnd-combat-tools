import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { periodicCheck } from "../../tables/dungeon/periodicCheck";
import { doorBeyond } from "../../tables/dungeon/doorBeyond";
import { DungeonOutcomeNode } from "./outcome";
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
  return { type: "event", roll: usedRoll, event: { kind: "sidePassages", result: command } as any };
}

export function resolvePassageTurns(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(passageTurns.sides);
  const command = getTableEntry(usedRoll, passageTurns);
  return { type: "event", roll: usedRoll, event: { kind: "passageTurns", result: command } as any };
}

export function resolveStairs(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(stairs.sides);
  const command = getTableEntry(usedRoll, stairs);
  return { type: "event", roll: usedRoll, event: { kind: "stairs", result: command } as any };
}

export function resolveSpecialPassage(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(specialPassage.sides);
  const command = getTableEntry(usedRoll, specialPassage);
  return { type: "event", roll: usedRoll, event: { kind: "specialPassage", result: command } as any };
}
