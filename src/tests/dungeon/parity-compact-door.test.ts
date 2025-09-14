import { passageMessages } from "../../dungeon/services/passage";
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

describe("Compact: PeriodicCheck Door (adapter)", () => {
  test("Ahead (dead end) exact text under controlled RNG", () => {
    const spy = jest.spyOn(dungeonLookup, "rollDice");
    // Adapter compact path doorLocation: Ahead
    spy.mockImplementationOnce(() => 20);
    const { messages } = passageMessages({ roll: pickRollFor(PeriodicCheck.Door), detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;
    expect(para.text).toBe("A door is Ahead. ");
    spy.mockRestore();
  });

  test("Left then Ignore (no further door) exact text under controlled RNG", () => {
    const spy = jest.spyOn(dungeonLookup, "rollDice");
    // Adapter compact path: doorLocation Left (1), periodic recheck Ignore (1)
    spy.mockImplementationOnce(() => 1).mockImplementationOnce(() => 1);
    const { messages } = passageMessages({ roll: pickRollFor(PeriodicCheck.Door), detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;
    expect(para.text).toBe(
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'. "
    );
    spy.mockRestore();
  });
});
