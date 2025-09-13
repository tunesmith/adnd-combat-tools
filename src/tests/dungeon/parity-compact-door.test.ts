import { passageMessages, getPassageResult } from "../../dungeon/services/passage";
import { periodicCheck, PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import type { DungeonMessage } from "../../types/dungeon";
import * as dungeonLookup from "../../dungeon/helpers/dungeonLookup";

function isParagraph(m: DungeonMessage): m is Extract<DungeonMessage, { kind: "paragraph"; text: string }> {
  return (m as any).kind === "paragraph" && typeof (m as any).text === "string";
}

function pickRollFor(cmd: PeriodicCheck): number {
  const entry = periodicCheck.entries.find((e) => e.command === cmd)!;
  return entry.range[0];
}

describe("Compact parity: PeriodicCheck Door", () => {
  test("Ahead (dead end) matches legacy text under controlled RNG", () => {
    const spy = jest.spyOn(dungeonLookup, "rollDice");
    // Legacy path doorLocation: Ahead
    spy.mockImplementationOnce(() => 20);
    const legacy = getPassageResult(1, PeriodicCheck.Door);
    // Adapter compact path doorLocation: Ahead (reset sequence)
    spy.mockImplementationOnce(() => 20);
    const { messages } = passageMessages({ roll: pickRollFor(PeriodicCheck.Door), detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;
    expect(para.text).toBe(legacy);
    spy.mockRestore();
  });

  test("Left then Ignore (no further door) matches legacy text under controlled RNG", () => {
    const spy = jest.spyOn(dungeonLookup, "rollDice");
    // Legacy path: doorLocation Left (1), periodic recheck Ignore (1)
    spy.mockImplementationOnce(() => 1).mockImplementationOnce(() => 1);
    const legacy = getPassageResult(1, PeriodicCheck.Door);
    // Adapter compact path: same sequence again
    spy.mockImplementationOnce(() => 1).mockImplementationOnce(() => 1);
    const { messages } = passageMessages({ roll: pickRollFor(PeriodicCheck.Door), detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;
    expect(para.text).toBe(legacy);
    spy.mockRestore();
  });
});

