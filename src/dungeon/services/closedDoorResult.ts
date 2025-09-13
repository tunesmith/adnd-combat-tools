import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";
import { DungeonTablePreview, DungeonRenderNode, TableContext } from "../../types/dungeon";
import { periodicCheckDoorOnly, PeriodicCheckDoorOnly } from "../../tables/dungeon/periodicCheckDoorOnly";
import {
  periodicCheck,
  PeriodicCheck,
} from "../../tables/dungeon/periodicCheck";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";

/**
 * When doing passage checks, the rules subtly imply this looks for *closed*
 * doors. Opening a door is a fresh move. For closed doors, we don't need to
 * roll what is behind the door. Roll for that when a decision is made to
 * open a door (or when the situation calls for it, like listening at doors).
 *
 * Check again immediately on TABLE I (periodicCheck) unless
 * door is straight ahead; if another door is not indicated,
 * then ignore the result and check again 30' past the door.
 */
export const closedDoorResult = (existingDoors: DoorLocation[]): string => {
  const doorLocationRoll = rollDice(doorLocation.sides);
  const doorLocationCommand = getTableEntry(doorLocationRoll, doorLocation);
  console.log(
    `door roll: ${doorLocationRoll} is ${DoorLocation[doorLocationCommand]}`
  );
  if (doorLocationCommand === DoorLocation.Ahead) {
    // DoorLocation.Ahead implies it is a dead end. Don't check for any more additional doors.
    return `A door is ${DoorLocation[doorLocationCommand]}. `;
  } else {
    if (existingDoors.includes(doorLocationCommand)) {
      // This branch implies we haven't rolled DoorLocation.Ahead
      // console.log(`existingDoors: `, existingDoors);
      // console.log(
      //   `ignore this extra ${DoorLocation[doorLocationCommand]} as we already rolled it`
      // );
      return "There are no more doors. The main passage extends -- check again in 30'. ";
    } else {
      // console.log(
      //   `got ${DoorLocation[doorLocationCommand]}, checking for another door`
      // );
      const recheckPeriodic = rollDice(periodicCheck.sides);
      const periodicCommand = getTableEntry(recheckPeriodic, periodicCheck);
      // console.log(
      //   `periodic recheck: ${recheckPeriodic} is ${PeriodicCheck[periodicCommand]}`
      // );

      if (periodicCommand === PeriodicCheck.Door) {
        const nextDoor = closedDoorResult([
          ...existingDoors,
          doorLocationCommand,
        ]);
        return (
          `A door is to the ${DoorLocation[doorLocationCommand]}. ` +
          `${nextDoor}`
        );
      } else {
        return (
          `A door is to the ${DoorLocation[doorLocationCommand]}. ` +
          `There are no other doors. The main passage extends -- check again in 30'. `
        );
      }
    }
  }
};

export const doorLocationMessages = (
  options?: { roll?: number; detailMode?: boolean; context?: TableContext }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  // Preview (detail) — include sequence + context when available
  if (options?.detailMode && options.roll === undefined) {
    const seq = isDoorChainContext(options?.context)
      ? options?.context?.existing?.length || 0
      : 0;
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: `doorLocation:${seq}`,
      title: "Door Location",
      sides: doorLocation.sides,
      entries: doorLocation.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: DoorLocation[e.command] ?? String(e.command),
      })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(doorLocation.sides);
  const command = getTableEntry(usedRoll, doorLocation);
  const text =
    command === DoorLocation.Ahead
      ? "A door is Ahead. "
      : `A door is to the ${DoorLocation[command]}. `;
  const messages: DungeonRenderNode[] = [
    { kind: "heading", level: 4, text: "Door Location" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${DoorLocation[command]}`] },
    { kind: "paragraph", text },
  ];

  // Chain continuation logic (detail mode): schedule the next door-only periodic roll
  if (options?.detailMode) {
    const existing: ("Left" | "Right")[] = isDoorChainContext(options?.context)
      ? ((options?.context?.existing || []) as ("Left" | "Right")[])
      : [];
    if (command === DoorLocation.Ahead) {
      // Dead end; chain stops here.
      return { usedRoll, messages };
    }
    const loc: "Left" | "Right" | "" =
      command === DoorLocation.Left ? "Left" : command === DoorLocation.Right ? "Right" : "";
    if (loc === "") {
      return { usedRoll, messages };
    }
    if (existing.includes(loc)) {
      messages.push({
        kind: "paragraph",
        text: "There are no more doors. The main passage extends -- check again in 30'. ",
      });
      return { usedRoll, messages };
    }
    const nextExisting = [...existing, loc];
    const nextSeq = existing.length; // aligns with historical id sequencing
    const nextPreview: DungeonTablePreview = {
      kind: "table-preview",
      id: `periodicCheckDoorOnly:${nextSeq}`,
      title: "Periodic Check (doors only)",
      sides: periodicCheckDoorOnly.sides,
      entries: periodicCheckDoorOnly.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PeriodicCheckDoorOnly[e.command] ?? String(e.command),
      })),
      context: { kind: "doorChain", existing: nextExisting },
    };
    messages.push(nextPreview);
  }
  return { usedRoll, messages };
};

function isDoorChainContext(o: TableContext | undefined): o is Extract<TableContext, { kind: "doorChain" }> {
  return !!o && (o as any).kind === "doorChain" && Array.isArray((o as any).existing);
}
