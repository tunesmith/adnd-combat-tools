import type { DungeonRenderNode } from "../../types/dungeon";
import { resolveChamberDimensions } from "../domain/resolvers";
import { toCompactRender, toDetailRender } from "../adapters/render";

export const chamberResult = (): string => {
  // Legacy string API retained for compactPeriodicText; untouched here.
  const node = resolveChamberDimensions();
  const msgs = toCompactRender(node);
  let text = "";
  for (const m of msgs) if (m.kind === "paragraph") text += m.text;
  return text;
};

export const chamberMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const node = resolveChamberDimensions({ roll: options?.roll });
  const rendered = options?.detailMode ? toDetailRender(node) : toCompactRender(node);
  const usedRoll = (node.type === "event" && node.roll) || options?.roll;
  return { usedRoll, messages: rendered };
};
