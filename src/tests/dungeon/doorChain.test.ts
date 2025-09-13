import { DungeonRenderNode, DungeonTablePreview } from "../../types/dungeon";
import { doorLocationMessages } from "../../dungeon/services/closedDoorResult";
import { periodicDoorOnlyMessages } from "../../dungeon/services/periodicDoorOnly";

function isPreview(n: DungeonRenderNode): n is DungeonTablePreview {
  return n.kind === "table-preview";
}

describe("Door chain detail flow", () => {
  test("doorLocation preview uses sequence 0 when no context", () => {
    const { messages } = doorLocationMessages({ detailMode: true });
    const p = messages.find(isPreview)!;
    expect(p).toBeTruthy();
    expect(p.id).toBe("doorLocation:0");
  });

  test("doorLocation Left schedules periodicCheckDoorOnly:0 with updated context", () => {
    const { messages } = doorLocationMessages({ roll: 1, detailMode: true, context: { kind: "doorChain", existing: [] } });
    const preview = messages.find(isPreview);
    expect(preview).toBeTruthy();
    expect(preview!.id).toBe("periodicCheckDoorOnly:0");
    expect(preview!.context && (preview!.context as any).existing).toEqual(["Left"]);
  });

  test("doorLocation Right repeat ends chain with no more doors paragraph", () => {
    const { messages } = doorLocationMessages({ roll: 12, detailMode: true, context: { kind: "doorChain", existing: ["Right"] } });
    const paragraph = messages.find((m): m is Extract<DungeonRenderNode, { kind: "paragraph" }> => m.kind === "paragraph" && m.text.startsWith("There are no more doors"));
    expect(paragraph).toBeTruthy();
    const anyNext = messages.some((m) => isPreview(m) && m.id.startsWith("periodicCheckDoorOnly"));
    expect(anyNext).toBe(false);
  });

  test("doorLocation Ahead ends chain without periodic preview", () => {
    const { messages } = doorLocationMessages({ roll: 20, detailMode: true, context: { kind: "doorChain", existing: ["Left"] } });
    const anyNext = messages.some((m) => isPreview(m) && m.id.startsWith("periodicCheckDoorOnly"));
    expect(anyNext).toBe(false);
  });

  test("periodicDoorOnly preview honors context sequence index", () => {
    const { messages } = periodicDoorOnlyMessages({ detailMode: true, context: { kind: "doorChain", existing: ["Left"] } });
    const p = messages.find(isPreview)!;
    expect(p).toBeTruthy();
    expect(p.id).toBe("periodicCheckDoorOnly:1");
  });

  test("periodicDoorOnly Door schedules doorLocation:<seq> with same context", () => {
    const { messages } = periodicDoorOnlyMessages({ roll: 3, detailMode: true, context: { kind: "doorChain", existing: ["Left", "Right"] } });
    const p = messages.find(isPreview)!;
    expect(p).toBeTruthy();
    expect(p.id).toBe("doorLocation:2");
    expect(p.context && (p.context as any).existing).toEqual(["Left", "Right"]);
  });

  test("periodicDoorOnly Ignore yields paragraph and no next preview", () => {
    const { messages } = periodicDoorOnlyMessages({ roll: 1, detailMode: true, context: { kind: "doorChain", existing: ["Left"] } });
    const para = messages.find((m): m is Extract<DungeonRenderNode, { kind: "paragraph" }> => m.kind === "paragraph" && m.text.startsWith("Ignored"));
    expect(para).toBeTruthy();
    const anyNext = messages.some(isPreview);
    expect(anyNext).toBe(false);
  });
});

