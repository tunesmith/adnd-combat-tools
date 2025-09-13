import { SidePassages, sidePassages } from "../../tables/dungeon/sidePassages";

import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";
import { resolveSidePassages } from "../domain/resolvers";
import { toCompactRender, toDetailRender } from "../adapters/render";

/**
 * We do *not* check passage width for side passages, as the "periodic check"
 * table specifically calls out passage width for "passage turns" but not for
 * side passages.
 */
export const sidePassageResults = (): string => {
  const sidePassageRoll = rollDice(sidePassages.sides);
  const sidePassageCommand = getTableEntry(sidePassageRoll, sidePassages);
  switch (sidePassageCommand) {
    case SidePassages.Left90:
      return "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
    case SidePassages.Right90:
      return "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
    case SidePassages.Left45:
      return "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
    case SidePassages.Right45:
      return "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
    case SidePassages.Left135:
      return "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
    case SidePassages.Right135:
      return "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
    case SidePassages.LeftCurve45:
      return "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
    case SidePassages.RightCurve45:
      return "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
    case SidePassages.PassageT:
      return "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
    case SidePassages.PassageY:
      return "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
    case SidePassages.FourWay:
      return "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
    case SidePassages.PassageX:
      return (
        "The passage reaches an 'X' intersection. (If the present passage " +
        "is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. "
      );
  }
};

export const sidePassageMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "sidePassages",
      title: "Side Passages",
      sides: sidePassages.sides,
      entries: sidePassages.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: SidePassages[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const node = resolveSidePassages({ roll: options?.roll });
  const usedRoll = (node.type === "event" ? node.roll : undefined) as number | undefined;
  const messages = options?.detailMode ? toDetailRender(node) : toCompactRender(node);
  return { usedRoll, messages: messages as any };
};
