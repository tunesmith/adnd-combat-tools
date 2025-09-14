import { DungeonMessage, DungeonRenderNode, DungeonTablePreview, TableContext } from "../../types/dungeon";
import { periodicCheckDoorOnly, PeriodicCheckDoorOnly } from "../../tables/dungeon/periodicCheckDoorOnly";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";

export const periodicDoorOnlyMessages = (
  options?: { roll?: number; detailMode?: boolean; context?: TableContext }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  // Preview path (detail): show the table with proper sequencing and context
  if (options?.detailMode && options.roll === undefined) {
    const seq = isDoorChainContext(options?.context)
      ? options?.context?.existing?.length || 0
      : 0;
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: `periodicCheckDoorOnly:${seq}`,
      title: "Periodic Check (doors only)",
      sides: periodicCheckDoorOnly.sides,
      entries: periodicCheckDoorOnly.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PeriodicCheckDoorOnly[e.command] ?? String(e.command),
      })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }

  const usedRoll = options?.roll ?? rollDice(periodicCheckDoorOnly.sides);
  const cmd = getTableEntry(usedRoll, periodicCheckDoorOnly);
  const isDoor = cmd === PeriodicCheckDoorOnly.Door;
  const heading: DungeonMessage = { kind: "heading", level: 4, text: "Periodic Check (doors only)" };
  const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${usedRoll} — ${isDoor ? "Door" : "Ignore"}`] };
  const messages: DungeonRenderNode[] = [heading, bullet];

  if (isDoor) {
    // Schedule next door-location with updated context provided by the caller (includes last left/right)
    const seq = isDoorChainContext(options?.context)
      ? options?.context?.existing?.length || 0
      : 0;
    const next: DungeonTablePreview = {
      kind: "table-preview",
      id: `doorLocation:${seq}`,
      title: "Door Location",
      sides: 20,
      entries: [
        { range: "1–6", label: "Left" },
        { range: "7–12", label: "Right" },
        { range: "13–20", label: "Ahead" },
      ],
      context: options?.context,
    };
    messages.push(next);
  } else {
    messages.push({ kind: "paragraph", text: "Ignored (not a door). Continue 30' past the door." });
  }

  return { usedRoll, messages };
};

function isDoorChainContext(o: TableContext | undefined): o is Extract<TableContext, { kind: "doorChain" }> {
  return !!o && o.kind === "doorChain";
}
