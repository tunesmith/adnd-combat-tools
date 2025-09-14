import {
  PeriodicCheck,
  periodicCheck,
} from "../../tables/dungeon/periodicCheck";
import {
  DungeonMessage,
  DungeonTablePreview,
  DungeonRenderNode,
} from "../../types/dungeon";
// legacy imports above kept for string API; message-path refactored below via adapters
import { resolvePeriodicCheck } from "../domain/resolvers";
import { toCompactRender, toDetailRender } from "../adapters/render";

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
export const passageMessages = (options?: {
  roll?: number;
  level?: number;
  avoidMonster?: boolean;
  detailMode?: boolean;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const level = options?.level ?? 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "periodicCheck",
      title: "Periodic Check",
      sides: periodicCheck.sides,
      entries: periodicCheck.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PeriodicCheck[e.command] ?? String(e.command),
      })),
      context: options?.level
        ? ({ kind: "wandering", level: options.level } as any)
        : undefined,
    };
    const messages: (DungeonMessage | DungeonTablePreview)[] = [
      { kind: "heading", level: 3, text: "Passage" },
      preview,
    ];
    return { usedRoll: undefined, messages };
  }
  const node = resolvePeriodicCheck({
    roll: options?.roll,
    level,
    avoidMonster: options?.avoidMonster,
  });
  const usedRoll = (node.type === "event" ? node.roll : undefined) as
    | number
    | undefined;
  const messages = options?.detailMode
    ? toDetailRender(node)
    : toCompactRender(node);
  return { usedRoll, messages };
};
