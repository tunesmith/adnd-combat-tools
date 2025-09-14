import {
  PeriodicCheck,
  periodicCheck,
} from "../../tables/dungeon/periodicCheck";
import { sidePassageResults } from "./sidePassage";
import { passageTurnResults } from "./passageTurn";
import { chamberResult } from "./chamberResult";
import { stairsResult } from "./stairsResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { wanderingMonsterResult } from "./wanderingMonsterResult";
import { DungeonMessage, DungeonTablePreview, DungeonRenderNode } from "../../types/dungeon";
// legacy imports above kept for string API; message-path refactored below via adapters
import { resolvePeriodicCheck } from "../domain/resolvers";
import { toCompactRender, toDetailRender } from "../adapters/render";
import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";

/**
 * If we follow the Strategic Review mindset, then it means
 * we follow the rule that:
 * - exits from chambers are passages
 * - exits from rooms are doors
 *
 * All chamber passages extend 30', after which the
 * periodicCheck table can be checked.
 *
 * But for rooms, it means that we would need another
 * move type, one that checks beyond a door.
 */
export const passageResults = (): string => {
  // TODO adjust level through UI
  const level = 1;
  const roll = rollDice(periodicCheck.sides);
  // console.log(`periodicCheck: ${roll}`);
  const command = getTableEntry(roll, periodicCheck);
  // const command = PeriodicCheck.WanderingMonster;
  console.log(`periodicCheck: ${roll} is ${PeriodicCheck[command]}`);
  return getPassageResult(level, command);
};

export const getPassageResult = (
  level: number,
  command: PeriodicCheck,
  avoidMonster: boolean = false
): string => {
  console.log(`avoidMonster: ${avoidMonster}`);
  switch (command) {
    case PeriodicCheck.ContinueStraight:
      return "Continue straight -- check again in 60'. ";
    case PeriodicCheck.Door: {
      return compactDoorText();
    }
    case PeriodicCheck.SidePassage: {
      return sidePassageResults();
    }
    case PeriodicCheck.PassageTurn: {
      return passageTurnResults();
    }
    case PeriodicCheck.Chamber: {
      return "The passage opens into a chamber. " + chamberResult();
    }
    case PeriodicCheck.Stairs: {
      return stairsResult();
    }
    case PeriodicCheck.DeadEnd: {
      const result = "The passage reaches a dead end. (TODO) ";
      return result;
    }
    case PeriodicCheck.TrickTrap: {
      const result = "There is a trick or trap. (TODO) -- check again in 30'. ";
      return result;
    }
    case PeriodicCheck.WanderingMonster: {
      return wanderingMonsterResult(level);
    }
  }
};

function compactDoorText(existing: ("Left" | "Right")[] = []): string {
  const doorRoll = rollDice(doorLocation.sides);
  const cmd = getTableEntry(doorRoll, doorLocation);
  const prefix =
    cmd === DoorLocation.Ahead
      ? "A door is Ahead. "
      : `A door is to the ${DoorLocation[cmd]}. `;
  if (cmd === DoorLocation.Ahead) return prefix;
  const loc: "Left" | "Right" | "" =
    cmd === DoorLocation.Left ? "Left" : cmd === DoorLocation.Right ? "Right" : "";
  if (loc === "") return prefix;
  if (existing.includes(loc)) {
    return prefix + "There are no more doors. The main passage extends -- check again in 30'. ";
  }
  const reRoll = rollDice(periodicCheck.sides);
  const reCmd = getTableEntry(reRoll, periodicCheck);
  if (reCmd === PeriodicCheck.Door) {
    return prefix + compactDoorText([...existing, loc]);
  }
  return prefix + "There are no other doors. The main passage extends -- check again in 30'. ";
}

/**
 * Typed variant mirroring `passageResults` but with optional roll override
 * and structured messages for UI rendering.
 */
export const passageMessages = (
  options?: { roll?: number; level?: number; avoidMonster?: boolean; detailMode?: boolean }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const level = options?.level ?? 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "periodicCheck",
      title: "Periodic Check",
      sides: periodicCheck.sides,
      entries: periodicCheck.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PeriodicCheck[e.command] ?? String(e.command),
      })),
      context: options?.level ? ({ kind: "wandering", level: options.level } as any) : undefined,
    };
    const messages: (DungeonMessage | DungeonTablePreview)[] = [
      { kind: "heading", level: 3, text: "Passage" },
      preview,
    ];
    return { usedRoll: undefined, messages };
  }
  const node = resolvePeriodicCheck({ roll: options?.roll, level, avoidMonster: options?.avoidMonster });
  const usedRoll = (node.type === "event" ? node.roll : undefined) as number | undefined;
  const messages = options?.detailMode ? toDetailRender(node) : toCompactRender(node);
  return { usedRoll, messages };
};
