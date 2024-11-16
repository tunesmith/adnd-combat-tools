import { getHenchmanLevel } from "../../../../dungeon/helpers/character/getHenchmanLevel";

describe("getHenchmanLevel", () => {
  test("book example #1", () => {
    const henchmanLevel = getHenchmanLevel(5);
    expect(henchmanLevel).toBe(2);
  });
  test("book example #2", () => {
    const henchmanLevel = getHenchmanLevel(9);
    expect(henchmanLevel).toBe(6);
  });
  test("book example #3", () => {
    const henchmanLevel = getHenchmanLevel(11);
    expect(henchmanLevel).toBe(7);
  });
  test("book example #4", () => {
    const henchmanLevel = getHenchmanLevel(12);
    expect(henchmanLevel).toBe(8);
  });
});
