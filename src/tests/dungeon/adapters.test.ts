import { runDungeonStep } from "../../dungeon/services/adapters";

describe("adapters", () => {
  it("returns a message for passage", () => {
    const step = runDungeonStep("passage", { roll: 10 });
    expect(step.action).toBe("passage");
    expect(Array.isArray(step.messages)).toBe(true);
    expect(step.messages.length).toBeGreaterThan(0);
    expect(typeof step.messages[0]?.text).toBe("string");
  });

  it("returns a message for door", () => {
    const step = runDungeonStep("door", { roll: 12, doorAhead: true });
    expect(step.action).toBe("door");
    expect(step.messages.length).toBeGreaterThan(0);
  });
});

