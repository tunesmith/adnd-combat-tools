import { DungeonMessage, DungeonRenderNode, DungeonTablePreview, TableContext } from "../../types/dungeon";
import { periodicCheck, PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";

function rangeText(range: number[]): string {
  return range.length === 1 ? `${range[0]}` : `${range[0]}–${range[range.length - 1]}`;
}

export const wanderingWhereFromMessages = (
  options?: { roll?: number; detailMode?: boolean; context?: TableContext }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "wanderingWhereFrom",
      title: "Where From",
      sides: periodicCheck.sides,
      entries: periodicCheck.entries
        .filter((e) => e.command !== PeriodicCheck.WanderingMonster)
        .map((e) => ({ range: rangeText(e.range), label: PeriodicCheck[e.command] })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  // ensure WM is re-rolled if provided
  let usedRoll = options?.roll ?? rollDice(periodicCheck.sides);
  let cmd = getTableEntry(usedRoll, periodicCheck);
  if (cmd === PeriodicCheck.WanderingMonster) {
    usedRoll = 1; // default to ContinueStraight if WM was provided inadvertently
    cmd = PeriodicCheck.ContinueStraight;
  }
  const heading: DungeonMessage = { kind: "heading", level: 4, text: "Where From" };
  const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${usedRoll} — ${PeriodicCheck[cmd]}`] };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (cmd === PeriodicCheck.Door) {
    messages.push({ kind: "paragraph", text: "A closed door is indicated." });
    messages.push({
      kind: "table-preview",
      id: "doorLocation:0",
      title: "Door Location",
      sides: doorLocation.sides,
      entries: doorLocation.entries.map((e) => ({ range: rangeText(e.range), label: DoorLocation[e.command] ?? String(e.command) })),
      context: { kind: "doorChain", existing: [] } as TableContext,
    });
  } else {
    // For other locations, we provide a simple text cue
    messages.push({ kind: "paragraph", text: `Appears from: ${PeriodicCheck[cmd]}. ` });
  }
  return { usedRoll, messages };
};

