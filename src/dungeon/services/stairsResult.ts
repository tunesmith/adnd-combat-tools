import { Chute, chute, Egress, egressOne, egressThree, egressTwo, Stairs, stairs } from "../../tables/dungeon/stairs";
import { Table } from "../../tables/dungeon/dungeonTypes";
import { chamberResult } from "./chamberResult";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";

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
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
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
  const usedRoll = options?.roll ?? rollDice(stairs.sides);
  const command = getTableEntry(usedRoll, stairs);
  let text: string;
  switch (command) {
    case Stairs.DownOne:
      text = "There are stairs here that descend one level. " + egressResult(egressOne);
      break;
    case Stairs.DownTwo:
      text = "There are stairs here that descend two levels. " + egressResult(egressTwo);
      break;
    case Stairs.DownThree:
      text = "There are stairs here that descend three levels. " + egressResult(egressThree);
      break;
    case Stairs.UpOne:
      text = "There are stairs here that ascend one level. ";
      break;
    case Stairs.UpDead:
      text = "There are stairs here that ascend one level to a dead end. " + chuteResult();
      break;
    case Stairs.DownDead:
      text = "There are stairs here that descend one level to a dead end. " + chuteResult();
      break;
    case Stairs.ChimneyUpOne:
      text = "There is a chimney that goes up one level. The current passage continues, check again in 30'. ";
      break;
    case Stairs.ChimneyUpTwo:
      text = "There is a chimney that goes up two levels. The current passage continues, check again in 30'. ";
      break;
    case Stairs.ChimneyDownTwo:
      text = "There is a chimney that goes down two levels. The current passage continues, check again in 30'. ";
      break;
    case Stairs.TrapDoorDownOne:
      text = "There is a trap door that goes down one level. The current passage continues, check again in 30'. ";
      break;
    case Stairs.TrapDownDownTwo:
      text = "There is a trap door that goes down two levels. The current passage continues, check again in 30'. ";
      break;
    case Stairs.UpOneDownTwo:
      text = "There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. " + chamberResult();
      break;
  }
  const messages: DungeonMessage[] = [
    { kind: "heading", level: 4, text: "Stairs" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${Stairs[command] ?? String(command)}`] },
    { kind: "paragraph", text },
  ];
  return { usedRoll, messages };
};
