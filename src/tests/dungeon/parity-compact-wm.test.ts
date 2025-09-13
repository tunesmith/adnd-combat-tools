import { passageMessages } from "../../dungeon/services/passage";
import { DungeonMessage } from "../../types/dungeon";
import * as dungeonLookup from "../../dungeon/helpers/dungeonLookup";
import { wanderingMonsterResult } from "../../dungeon/services/wanderingMonsterResult";

function isParagraph(m: DungeonMessage): m is Extract<DungeonMessage, { kind: "paragraph"; text: string }> {
  return (m as any).kind === "paragraph" && typeof (m as any).text === "string";
}

describe("Compact parity: Wandering Monster", () => {
  test("Door Ahead + Level One + Skeletons parity", () => {
    const spy = jest.spyOn(dungeonLookup, "rollDice");
    // Both adapter and legacy roll sequences:
    // periodicCheck (3 => Door), doorLocation (20 => Ahead), monster level (1 => L1), monsterOne (97 => Skeleton), count d4 (3)
    spy
      .mockImplementationOnce(() => 3) // where-from periodicCheck => Door
      .mockImplementationOnce(() => 20) // doorLocation Ahead
      .mockImplementationOnce(() => 1) // monster level table -> Level One
      .mockImplementationOnce(() => 97) // monsterOne -> Skeletons
      .mockImplementationOnce(() => 3); // d4 -> 3
    const { messages } = passageMessages({ roll: 20, detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;

    // Legacy sequence: same rolls again
    spy
      .mockImplementationOnce(() => 3)
      .mockImplementationOnce(() => 20)
      .mockImplementationOnce(() => 1)
      .mockImplementationOnce(() => 97)
      .mockImplementationOnce(() => 3);
    const legacy = wanderingMonsterResult(1);
    expect(para.text.trim()).toBe(legacy.trim());
    spy.mockRestore();
  });

  test("Door Left -> Ignore + Level One + Beetle parity", () => {
    const spy = jest.spyOn(dungeonLookup, "rollDice");
    // Sequence for both: periodicCheck (3 => Door), doorLocation (1 => Left), periodic recheck (1 => not Door, end),
    // monster level (1 => L1), monsterOne (10 => Fire Beetle bucket), count d4 (2)
    spy
      .mockImplementationOnce(() => 3) // where-from periodicCheck => Door
      .mockImplementationOnce(() => 1) // door left
      .mockImplementationOnce(() => 1) // ignore
      .mockImplementationOnce(() => 1) // level one
      .mockImplementationOnce(() => 10) // fire beetle bucket
      .mockImplementationOnce(() => 2); // d4 -> 2
    const { messages } = passageMessages({ roll: 20, detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph)!;

    spy
      .mockImplementationOnce(() => 3)
      .mockImplementationOnce(() => 1)
      .mockImplementationOnce(() => 1)
      .mockImplementationOnce(() => 1)
      .mockImplementationOnce(() => 10)
      .mockImplementationOnce(() => 2);
    const legacy = wanderingMonsterResult(1);
    expect(para.text.trim()).toBe(legacy.trim());
    spy.mockRestore();
  });
});
