import { NoCommand } from "../../tables/dungeon/dungeonTypes";
import { periodicCheckResults } from "../../dungeon/services/periodicCheck";

describe("periodic check tests", () => {
  test("initial move", () => {
    const periodicCheckResult = periodicCheckResults();
    console.log(periodicCheckResult);
    expect(periodicCheckResult).not.toBe(NoCommand.NoCommand);
  });
});
