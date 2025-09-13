import { Chute, chute, Egress, egressOne, egressThree, egressTwo, Stairs, stairs } from "../../tables/dungeon/stairs";
import { Table } from "../../tables/dungeon/dungeonTypes";
import { chamberResult } from "./chamberResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { DungeonRenderNode, DungeonTablePreview, DungeonMessage } from "../../types/dungeon";
import { resolveStairs } from "../domain/resolvers";
import { toCompactRender, toDetailRender } from "../adapters/render";

export const stairsResult = (): string => {
  const roll = rollDice(stairs.sides);
  const command = getTableEntry(roll, stairs);
  console.log(`stairs roll: ${roll} is ${Stairs[command]}`);
  switch (command) {
    case Stairs.DownOne:
      return (
        "There are stairs here that descend one level. " +
        egressResult(egressOne)
      );
    case Stairs.DownTwo:
      return (
        "There are stairs here that descend two levels. " +
        egressResult(egressTwo)
      );
    case Stairs.DownThree:
      return (
        "There are stairs here that descend three levels. " +
        egressResult(egressThree)
      );
    case Stairs.UpOne:
      return "There are stairs here that ascend one level. ";
    case Stairs.UpDead:
      return (
        "There are stairs here that ascend one level to a dead end. " +
        chuteResult()
      );
    case Stairs.DownDead:
      return (
        "There are stairs here that descend one level to a dead end. " +
        chuteResult()
      );
    case Stairs.ChimneyUpOne:
      return "There is a chimney that goes up one level. The current passage continues, check again in 30'. ";
    case Stairs.ChimneyUpTwo:
      return "There is a chimney that goes up two levels. The current passage continues, check again in 30'. ";
    case Stairs.ChimneyDownTwo:
      return "There is a chimney that goes down two levels. The current passage continues, check again in 30'. ";
    case Stairs.TrapDoorDownOne:
      return "There is a trap door that goes down one level. The current passage continues, check again in 30'. ";
    case Stairs.TrapDownDownTwo:
      return "There is a trap door that goes down two levels. The current passage continues, check again in 30'. ";
    case Stairs.UpOneDownTwo:
      return (
        "There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. " +
        chamberResult()
      );
  }
};

export const egressResult = (egressTable: Table<Egress>): string => {
  const roll = rollDice(egressTable.sides);
  const command = getTableEntry(roll, egressTable);
  console.log(`egress roll: ${roll} is ${Egress[command]}`);
  switch (command) {
    case Egress.Closed:
      return "After descending, an unnoticed door will close egress for the day. ";
    case Egress.Open:
      return "";
  }
};

export const chuteResult = (): string => {
  const roll = rollDice(chute.sides);
  const command = getTableEntry(roll, chute);
  console.log(`chute roll: ${roll} is ${Chute[command]}`);
  switch (command) {
    case Chute.Exists:
      return "The stairs will turn into a chute, descending two levels from the top. ";
    case Chute.DoesNotExist:
      return "";
  }
};

export const stairsMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "stairs",
      title: "Stairs",
      sides: stairs.sides,
      entries: stairs.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: Stairs[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const node = resolveStairs({ roll: options?.roll });
  const usedRoll = node.type === "event" ? node.roll : undefined;
  const messages = options?.detailMode ? toDetailRender(node) : toCompactRender(node);
  return { usedRoll, messages };
};

export const egressMessages = (options: {
  table: "one" | "two" | "three";
  roll?: number;
  detailMode?: boolean;
}): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  const table = options.table === "one" ? egressOne : options.table === "two" ? egressTwo : egressThree;
  const titleSuffix = options.table === "one" ? "(1 level)" : options.table === "two" ? "(2 levels)" : "(3 levels)";
  if (options.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: `egress:${options.table}`,
      title: `Egress ${titleSuffix}`,
      sides: table.sides,
      entries: table.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: Egress[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options.roll ?? rollDice(table.sides);
  const command = getTableEntry(usedRoll, table);
  const text = command === Egress.Closed ? "After descending, an unnoticed door will close egress for the day. " : "";
  const messages: DungeonMessage[] = [
    { kind: "heading", level: 4, text: "Egress" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${Egress[command]}`] },
    { kind: "paragraph", text },
  ];
  return { usedRoll, messages };
};

export const chuteMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "chute",
      title: "Chute",
      sides: chute.sides,
      entries: chute.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: Chute[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(chute.sides);
  const command = getTableEntry(usedRoll, chute);
  const text = command === Chute.Exists ? "The stairs will turn into a chute, descending two levels from the top. " : "";
  const messages: DungeonMessage[] = [
    { kind: "heading", level: 4, text: "Chute" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${Chute[command]}`] },
    { kind: "paragraph", text },
  ];
  return { usedRoll, messages };
};
