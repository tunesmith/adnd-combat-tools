import { doorBeyondResult } from "../../dungeon/services/doorBeyondResult";
import { passageResults } from "../../dungeon/services/passage";
import { unusualSizeResult } from "../../dungeon/services/unusualSizeResult";
import { chamberResult } from "../../dungeon/services/chamberResult";
import { monsterOneResult } from "../../dungeon/services/monster/monsterOneResult";
import { monsterTwoResult } from "../../dungeon/services/monster/monsterTwoResult";
import { sidePassages, SidePassages } from "../../tables/dungeon/sidePassages";
import { Table } from "../../tables/dungeon/dungeonTypes";
import { getTableEntry } from "../../dungeon/helpers/dungeonLookup";
import { monsterThreeResult } from "../../dungeon/services/monster/monsterThreeResult";
import { monsterFourResult } from "../../dungeon/services/monster/monsterFourResult";
import { wanderingMonsterResult } from "../../dungeon/services/wanderingMonsterResult";
import { monsterFiveResult } from "../../dungeon/services/monster/monsterFiveResult";

describe("passage results", () => {
  test("initial move", () => {
    const passageResult = passageResults();
    console.log(passageResult);
    expect(passageResult).not.toBe(null);
  });
  test("unusual size", () => {
    const unusualSize = unusualSizeResult();
    console.log(unusualSize);
    expect(unusualSize).not.toBe(null);
  });
  test("chamber", () => {
    const chamber = chamberResult();
    console.log(chamber);
    expect(chamber).not.toBe(null);
  });
  test("monster level one", () => {
    const monsters = monsterOneResult(1);
    console.log(monsters);
    expect(monsters).not.toBe(null);
  });
  test("monster level two", () => {
    const monsters = monsterTwoResult(2);
    console.log(monsters);
    expect(monsters).not.toBe(null);
  });
  test("monster level three", () => {
    const monsters = monsterThreeResult(3);
    console.log(monsters);
    expect(monsters).not.toBe(null);
  });
  test("monster level four", () => {
    const monsters = monsterFourResult(4);
    console.log(monsters);
    expect(monsters).not.toBe(null);
  });
  test("wandering monster level four", () => {
    const monsters = wanderingMonsterResult(4);
    console.log(monsters);
    expect(monsters).not.toBe(null);
  });
  test("monster level five", () => {
    const monsters = monsterFiveResult(5);
    console.log(monsters);
    expect(monsters).not.toBe(null);
  });
  test("wandering monster level five", () => {
    const monsters = wanderingMonsterResult(5);
    console.log(monsters);
    expect(monsters).not.toBe(null);
  });
});

describe("door results", () => {
  test("open door", () => {
    const doorResult = doorBeyondResult(true);
    console.log(doorResult);
    expect(doorResult).not.toBe(null);
  });
  // test("open door not straight ahead", () => {
  //   const doorResult = doorBeyondResult(false);
  //   console.log(doorResult);
  //   expect(doorResult).not.toBe(NoCommand.NoCommand);
  // });
});

describe("getTableEntry", () => {
  it("should return the correct command for a given roll", () => {
    expect(getTableEntry(1, sidePassages)).toBe(SidePassages.Left90);
    expect(getTableEntry(3, sidePassages)).toBe(SidePassages.Right90);
    expect(getTableEntry(5, sidePassages)).toBe(SidePassages.Left45);
    expect(getTableEntry(6, sidePassages)).toBe(SidePassages.Right45);
    expect(getTableEntry(7, sidePassages)).toBe(SidePassages.Left135);
    expect(getTableEntry(20, sidePassages)).toBe(SidePassages.PassageX);
  });

  it("should throw an error for out-of-bounds rolls", () => {
    expect(() => getTableEntry(0, sidePassages)).toThrow();
    expect(() => getTableEntry(21, sidePassages)).toThrow();
  });

  it("should throw an error if no entry is found", () => {
    // Assuming the table covers all possible rolls, this case shouldn't happen
    // But you can mock or adjust the table to test this behavior
    const incompleteTable: Table<SidePassages> = {
      sides: 20,
      entries: [{ range: [1, 10], command: SidePassages.Left90 }],
    };
    expect(() => getTableEntry(15, incompleteTable)).toThrow();
  });
});
