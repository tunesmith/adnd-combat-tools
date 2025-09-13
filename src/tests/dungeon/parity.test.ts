import { passageMessages } from "../../dungeon/services/passage";
import { getPassageResult } from "../../dungeon/services/passage";
import { periodicCheck, PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";
import { doorBeyondMessages } from "../../dungeon/services/doorBeyondResult";
import { doorBeyond, DoorBeyond } from "../../tables/dungeon/doorBeyond";

function isParagraph(m: DungeonMessage): m is Extract<DungeonMessage, { kind: "paragraph"; text: string }> {
  return (m as any).kind === "paragraph" && typeof (m as any).text === "string";
}

function pickRollForPeriodicCheck(cmd: PeriodicCheck): number {
  const entry = periodicCheck.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error("No entry for command");
  return entry.range[0];
}

function pickRollForDoorBeyond(cmd: DoorBeyond): number {
  const entry = doorBeyond.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error("No entry for command");
  return entry.range[0];
}

describe("Phase 0 parity: Passage compact vs legacy", () => {
  test("ContinueStraight matches legacy text", () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.ContinueStraight);
    const legacy = getPassageResult(1, PeriodicCheck.ContinueStraight);
    const { messages } = passageMessages({ roll, detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para && para.text).toBe(legacy);
  });

  test("DeadEnd matches legacy text", () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.DeadEnd);
    const legacy = getPassageResult(1, PeriodicCheck.DeadEnd);
    const { messages } = passageMessages({ roll, detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para && para.text).toBe(legacy);
  });

  test("TrickTrap matches legacy text", () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.TrickTrap);
    const legacy = getPassageResult(1, PeriodicCheck.TrickTrap);
    const { messages } = passageMessages({ roll, detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para && para.text).toBe(legacy);
  });
});

describe("Phase 0 parity: Passage detail previews", () => {
  test("No roll => Periodic Check preview only", () => {
    const { messages } = passageMessages({ detailMode: true });
    const previews = messages.filter((m) => m.kind === "table-preview") as DungeonTablePreview[];
    expect(previews.length).toBeGreaterThanOrEqual(1);
    const first = previews[0]!;
    expect(first.id).toBe("periodicCheck");
  });

  test("Chamber roll => includes Chamber Dimensions preview", () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.Chamber);
    const { messages } = passageMessages({ roll, detailMode: true, level: 1 });
    const previews = messages.filter((m) => m.kind === "table-preview") as DungeonTablePreview[];
    const hasChamber = previews.some((p) => p.id === "chamberDimensions");
    expect(hasChamber).toBe(true);
  });

  test("Door roll => includes Door Location preview", () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.Door);
    const { messages } = passageMessages({ roll, detailMode: true, level: 1 });
    const previews = messages.filter((m) => m.kind === "table-preview") as DungeonTablePreview[];
    const hasDoorLoc = previews.some((p) => p.id.startsWith("doorLocation"));
    expect(hasDoorLoc).toBe(true);
  });
});

describe("Phase 0 parity: Door detail previews", () => {
  test("No roll => Door Beyond preview only", () => {
    const { messages } = doorBeyondMessages({ detailMode: true });
    const previews = messages.filter((m) => m.kind === "table-preview") as DungeonTablePreview[];
    expect(previews.length).toBeGreaterThanOrEqual(1);
    const first = previews[0]!;
    expect(first.id).toBe("doorBeyond");
  });

  test("Room roll => includes Room Dimensions preview", () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.Room);
    const { messages } = doorBeyondMessages({ roll, detailMode: true });
    const previews = messages.filter((m) => m.kind === "table-preview") as DungeonTablePreview[];
    const hasRoom = previews.some((p) => p.id === "roomDimensions");
    expect(hasRoom).toBe(true);
  });
});

describe("Phase 0 parity: Door compact prefixes", () => {
  test("Parallel/Closet (doorAhead=false) starts with expected text", () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.ParallelPassageOrCloset);
    const { messages } = doorBeyondMessages({ roll, detailMode: false, doorAhead: false });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;
    expect(para.text.startsWith("Beyond the door is a parallel passage"))
      .toBe(true);
  });

  test("Parallel/Closet (doorAhead=true) starts with expected text", () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.ParallelPassageOrCloset);
    const { messages } = doorBeyondMessages({ roll, detailMode: false, doorAhead: true });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;
    expect(para.text.startsWith("Beyond the door is a 10' x 10' room"))
      .toBe(true);
  });

  test("Straight Ahead starts with expected text", () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.PassageStraightAhead);
    const { messages } = doorBeyondMessages({ roll, detailMode: false });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;
    expect(para.text.startsWith("Beyond the door is a passage straight ahead."))
      .toBe(true);
  });
});
