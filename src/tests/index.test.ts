import getToHit from "../helpers/getToHit";
import { MONSTER } from "../tables/attackerClass";

describe("testing something", () => {
  test("the actual test in question", () => {
    expect(getToHit(MONSTER, 3, 8, 4, 1)).toBe(15);
  });
});
