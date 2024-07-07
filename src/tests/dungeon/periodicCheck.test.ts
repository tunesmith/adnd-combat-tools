import { NoCommand } from "../../tables/dungeon/dungeonTypes";
import { doorBeyondResult } from "../../dungeon/services/doorBeyondResult";
import { passageResults } from "../../dungeon/services/passage";

describe("passage results", () => {
  test("initial move", () => {
    const passageResult = passageResults();
    console.log(passageResult);
    expect(passageResult).not.toBe(NoCommand.NoCommand);
  });
});

describe("door results", () => {
  test("open door", () => {
    const doorResult = doorBeyondResult();
    console.log(doorResult);
    expect(doorResult).not.toBe(NoCommand.NoCommand);
  });
  // test("open door straight ahead", () => {
  //   const doorResult = doorBeyondResult(true);
  //   console.log(doorResult);
  //   expect(doorResult).not.toBe(NoCommand.NoCommand);
  // });
  // test("open door not straight ahead", () => {
  //   const doorResult = doorBeyondResult(false);
  //   console.log(doorResult);
  //   expect(doorResult).not.toBe(NoCommand.NoCommand);
  // });
});
