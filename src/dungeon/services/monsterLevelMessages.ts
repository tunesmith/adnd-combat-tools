import { DungeonMessage, DungeonRenderNode, DungeonTablePreview, TableContext } from "../../types/dungeon";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { getMonsterTable, formatMonsterCount } from "./wanderingMonsterResult";
import { MonsterLevel } from "../../tables/dungeon/monster/monsterLevel";
import { MonsterOne, monsterOne } from "../../tables/dungeon/monster/monsterOne";
import { monsterOneResult, humanResult } from "./monster/monsterOneResult";

function rangeText(range: number[]): string {
  return range.length === 1 ? `${range[0]}` : `${range[0]}–${range[range.length - 1]}`;
}

function parseLevelFromId(id: string): number {
  const parts = id.split(":");
  const n = Number(parts[1]);
  return Number.isFinite(n) ? n : 1;
}

function isWandering(ctx?: TableContext): ctx is Extract<TableContext, { kind: "wandering" }> {
  return !!ctx && (ctx as any).kind === "wandering" && typeof (ctx as any).level === "number";
}

export const monsterLevelMessages = (
  options: { id: string; roll?: number; detailMode?: boolean; context?: TableContext }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const dungeonLevel = isWandering(options.context) ? options.context.level : parseLevelFromId(options.id);
  const table = getMonsterTable(dungeonLevel);
  if (options.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: options.id,
      title: "Monster Level",
      sides: table.sides,
      entries: table.entries.map((e) => ({ range: rangeText(e.range), label: MonsterLevel[e.command] })),
      context: { kind: "wandering", level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options.roll ?? rollDice(table.sides);
  const lvl = getTableEntry(usedRoll, table) as MonsterLevel;
  const heading: DungeonMessage = { kind: "heading", level: 4, text: "Monster Level" };
  const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${usedRoll} — ${MonsterLevel[lvl]}`] };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (lvl === MonsterLevel.One) {
    // stage monsterOne preview
    messages.push({
      kind: "table-preview",
      id: "monsterOne",
      title: "Monster (Level 1)",
      sides: monsterOne.sides,
      entries: monsterOne.entries.map((e) => ({ range: rangeText(e.range), label: MonsterOne[e.command] })),
      context: { kind: "wandering", level: dungeonLevel },
    });
  } else {
    // Fallback: simple paragraph to preserve flow
    messages.push({ kind: "paragraph", text: `(TODO: Monster Level ${MonsterLevel[lvl]} preview)` });
  }
  return { usedRoll, messages };
};

export const monsterOneMessages = (
  options?: { roll?: number; detailMode?: boolean; context?: TableContext }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const dungeonLevel = isWandering(options?.context) ? options!.context.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "monsterOne",
      title: "Monster (Level 1)",
      sides: monsterOne.sides,
      entries: monsterOne.entries.map((e) => ({ range: rangeText(e.range), label: MonsterOne[e.command] })),
      context: { kind: "wandering", level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(monsterOne.sides);
  const cmd = getTableEntry(usedRoll, monsterOne) as MonsterOne;
  const heading: DungeonMessage = { kind: "heading", level: 4, text: "Monster (Level 1)" };
  const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${usedRoll} — ${MonsterOne[cmd]}`] };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (cmd === MonsterOne.Human) {
    // Stage human subtable preview
    messages.push({
      kind: "table-preview",
      id: "human",
      title: "Human Subtable",
      sides: 100,
      entries: [
        { range: "1–25", label: "Bandit" },
        { range: "26–30", label: "Berserker" },
        { range: "31–45", label: "Brigand" },
        { range: "46–100", label: "Character" },
      ],
      context: { kind: "wandering", level: dungeonLevel },
    });
  } else {
    messages.push({ kind: "paragraph", text: monsterOneResult(dungeonLevel) });
  }
  return { usedRoll, messages };
};

export const humanMessages = (
  options?: { roll?: number; detailMode?: boolean; context?: TableContext }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const dungeonLevel = isWandering(options?.context) ? options!.context.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "human",
      title: "Human Subtable",
      sides: 100,
      entries: [
        { range: "1–25", label: "Bandit" },
        { range: "26–30", label: "Berserker" },
        { range: "31–45", label: "Brigand" },
        { range: "46–100", label: "Character" },
      ],
      context: { kind: "wandering", level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 50; // default into Character bucket
  const heading: DungeonMessage = { kind: "heading", level: 4, text: "Human Subtable" };
  const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${usedRoll}`] };
  const messages: DungeonRenderNode[] = [heading, bullet, { kind: "paragraph", text: humanResult(dungeonLevel) }];
  return { usedRoll, messages };
};

