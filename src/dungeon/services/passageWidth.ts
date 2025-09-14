import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import type { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";
import { PassageWidth, passageWidth } from "../../tables/dungeon/passageWidth";
import { resolvePassageWidth } from "../domain/resolvers";
import { toCompactRender, toDetailRender } from "../adapters/render";
import type { RollTraceItem } from "../../types/dungeon";


export const passageWidthMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): { usedRoll: number; messages: (DungeonMessage | DungeonTablePreview)[]; trace: RollTraceItem } => {
  const node = resolvePassageWidth({ roll: options?.roll });
  const usedRoll = node.type === "event" ? node.roll : options?.roll || rollDice(passageWidth.sides);
  const render = options?.detailMode ? toDetailRender(node) : toCompactRender(node);
  // Keep only paragraphs and previews to match existing usage
  const messages = render.filter((n) => n.kind === "paragraph" || n.kind === "table-preview") as (DungeonMessage | DungeonTablePreview)[];
  const command = getTableEntry(usedRoll, passageWidth);
  const resultLabel = PassageWidth[command] ?? String(command);
  const trace: RollTraceItem = { table: "passageWidth", roll: usedRoll, result: resultLabel };
  return { usedRoll, messages, trace };
};
// compactRandomSpecialPassage moved to adapter; not used here.
