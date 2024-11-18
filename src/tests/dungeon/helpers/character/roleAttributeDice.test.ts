import { rollAttributeDice } from "../../../../dungeon/helpers/character/rollAttributeDice";

describe("rollAttributeDice", () => {
  it("throws an error if dice is less than 3", () => {
    expect(() => rollAttributeDice(2)).toThrow(
      "The number of dice must be at least 3"
    );
  });

  it("sums the three highest rolls correctly for 3 dice", () => {
    const mockRandomGenerator = jest
      .fn()
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(3);

    const result = rollAttributeDice(3, mockRandomGenerator);
    expect(result).toBe(12); // 5 + 4 + 3
  });

  it("sums the three highest rolls correctly for more than 3 dice", () => {
    const mockRandomGenerator = jest
      .fn()
      .mockReturnValueOnce(6)
      .mockReturnValueOnce(3)
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(2);

    const result = rollAttributeDice(4, mockRandomGenerator);
    expect(result).toBe(13); // 6 + 4 + 3
  });

  it("handles all dice rolling the same value", () => {
    const mockRandomGenerator = jest.fn().mockReturnValue(3);

    const result = rollAttributeDice(5, mockRandomGenerator);
    expect(result).toBe(9); // 3 + 3 + 3
  });

  it("handles dice rolling in descending order", () => {
    const mockRandomGenerator = jest
      .fn()
      .mockReturnValueOnce(6)
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(3);

    const result = rollAttributeDice(4, mockRandomGenerator);
    expect(result).toBe(15); // 6 + 5 + 4
  });
});
