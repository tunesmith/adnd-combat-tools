import { passageTurns, PassageTurns } from "../../tables/dungeon/passageTurns";
import { passageWidthResults, passageWidthMessages } from "./passageWidth";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";
// (duplicate import removed)
import { passageWidth, PassageWidth } from "../../tables/dungeon/passageWidth";

export const passageTurnResults = (): string => {
  const roll = rollDice(passageTurns.sides);
  const command = getTableEntry(roll, passageTurns);
  console.log(`passageTurn roll: ${roll} is ${PassageTurns[command]}`);
  switch (command) {
    case PassageTurns.Left90:
      return (
        "The passage turns left 90 degrees - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Left45:
      return (
        "The passage turns left 45 degrees ahead - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Left135:
      return (
        "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Right90:
      return (
        "The passage turns right 90 degrees - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Right45:
      return (
        "The passage turns right 45 degrees ahead - check again in 30'. " +
        passageWidthResults()
      );
    case PassageTurns.Right135:
      return (
        "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. " +
        passageWidthResults()
      );
  }
};

export const passageTurnMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "passageTurns",
      title: "Passage Turns",
      sides: passageTurns.sides,
      entries: passageTurns.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PassageTurns[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(passageTurns.sides);
  const command = getTableEntry(usedRoll, passageTurns);
  let textPrefix: string;
  switch (command) {
    case PassageTurns.Left90:
      textPrefix = "The passage turns left 90 degrees - check again in 30'. ";
      break;
    case PassageTurns.Left45:
      textPrefix = "The passage turns left 45 degrees ahead - check again in 30'. ";
      break;
    case PassageTurns.Left135:
      textPrefix = "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
      break;
    case PassageTurns.Right90:
      textPrefix = "The passage turns right 90 degrees - check again in 30'. ";
      break;
    case PassageTurns.Right45:
      textPrefix = "The passage turns right 45 degrees ahead - check again in 30'. ";
      break;
    case PassageTurns.Right135:
      textPrefix = "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
      break;
  }
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Passage Turns" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${PassageTurns[command] ?? String(command)}`] },
    { kind: "paragraph", text: textPrefix },
  ];
  if (options?.detailMode) {
    // Add a width preview
    messages.push({
      kind: "table-preview",
      id: "passageWidth",
      title: "Passage Width",
      sides: passageWidth.sides,
      entries: passageWidth.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PassageWidth[e.command] ?? String(e.command),
      })),
    });
  } else {
    const width = passageWidthMessages({});
    for (const m of width.messages) if (m.kind === "paragraph") messages.push(m);
  }
  return { usedRoll, messages };
};
