import { rollDice } from "../../../dungeon/helpers/dungeonLookup";

describe("rollDice", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns value in [1, sides] for single roll (low edge)", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    expect(rollDice(20)).toBe(1);
  });

  it("returns value in [1, sides] for single roll (high edge)", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(rollDice(20)).toBe(20);
  });

  it("sums multiple rolls correctly", () => {
    const spy = jest.spyOn(Math, "random");
    spy
      .mockReturnValueOnce(0) // 1
      .mockReturnValueOnce(0.5) // 4 on d6
      .mockReturnValueOnce(0.9999); // 6 on d6
    expect(rollDice(6, 3)).toBe(11);
  });
});
