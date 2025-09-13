import { DungeonOutcomeNode } from "../domain/outcome";
import {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
} from "../../types/dungeon";
import { PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import { DoorBeyond } from "../../tables/dungeon/doorBeyond";
import { chamberDimensions, ChamberDimensions, roomDimensions, RoomDimensions } from "../../tables/dungeon/chambersRooms";
import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";
import { sidePassages, SidePassages } from "../../tables/dungeon/sidePassages";
import { passageTurns, PassageTurns } from "../../tables/dungeon/passageTurns";
import { stairs, Stairs } from "../../tables/dungeon/stairs";
import { trickTrapMessages } from "../services/trickTrap";
import { passageWidth, PassageWidth } from "../../tables/dungeon/passageWidth";
import { getPassageResult } from "../services/passage";
import { roomMessages } from "../services/roomResult";
import { chamberMessages } from "../services/chamberResult";
import { passageWidthMessages } from "../services/passageWidth";

function rangeText(range: number[]): string {
  return range.length === 1 ? `${range[0]}` : `${range[0]}–${range[range.length - 1]}`;
}

// DETAIL MODE: outcome -> render nodes with previews for staged tables
export function toDetailRender(outcome: DungeonOutcomeNode): DungeonRenderNode[] {
  if (outcome.type !== "event") return [];
  const nodes: DungeonRenderNode[] = [];
  const { event, roll } = outcome;
  if (event.kind === "periodicCheck") {
    const heading: DungeonMessage = { kind: "heading", level: 3, text: "Passage" };
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${PeriodicCheck[event.result]}`] };
    nodes.push(heading, bullet);
    switch (event.result) {
      case PeriodicCheck.ContinueStraight:
        nodes.push({ kind: "paragraph", text: "Continue straight -- check again in 60'. " });
        break;
      case PeriodicCheck.Door: {
        nodes.push({ kind: "paragraph", text: "A closed door is indicated." });
        const preview: DungeonTablePreview = {
          kind: "table-preview",
          id: "doorLocation:0",
          title: "Door Location",
          sides: doorLocation.sides,
          entries: doorLocation.entries.map((e) => ({ range: rangeText(e.range), label: DoorLocation[e.command] ?? String(e.command) })),
          context: { kind: "doorChain", existing: [] } as any,
        };
        nodes.push(preview);
        break;
      }
      case PeriodicCheck.SidePassage: {
        nodes.push({ kind: "paragraph", text: "A side passage occurs." });
        const preview: DungeonRenderNode = {
          kind: "table-preview",
          id: "sidePassages",
          title: "Side Passages",
          sides: sidePassages.sides,
          entries: sidePassages.entries.map((e) => ({ range: rangeText(e.range), label: SidePassages[e.command] ?? String(e.command) })),
        };
        nodes.push(preview);
        break;
      }
      case PeriodicCheck.PassageTurn: {
        nodes.push({ kind: "paragraph", text: "The passage turns." });
        const preview: DungeonRenderNode = {
          kind: "table-preview",
          id: "passageTurns",
          title: "Passage Turns",
          sides: passageTurns.sides,
          entries: passageTurns.entries.map((e) => ({ range: rangeText(e.range), label: PassageTurns[e.command] ?? String(e.command) })),
        };
        nodes.push(preview);
        break;
      }
      case PeriodicCheck.Chamber: {
        nodes.push({ kind: "paragraph", text: "The passage opens into a chamber. " });
        const preview: DungeonRenderNode = {
          kind: "table-preview",
          id: "chamberDimensions",
          title: "Chamber Dimensions",
          sides: chamberDimensions.sides,
          entries: chamberDimensions.entries.map((e) => ({ range: rangeText(e.range), label: ChamberDimensions[e.command] ?? String(e.command) })),
        };
        nodes.push(preview);
        break;
      }
      case PeriodicCheck.Stairs: {
        nodes.push({ kind: "paragraph", text: "Stairs are indicated here." });
        const preview: DungeonRenderNode = {
          kind: "table-preview",
          id: "stairs",
          title: "Stairs",
          sides: stairs.sides,
          entries: stairs.entries.map((e) => ({ range: rangeText(e.range), label: Stairs[e.command] ?? String(e.command) })),
        };
        nodes.push(preview);
        break;
      }
      case PeriodicCheck.DeadEnd:
        nodes.push({ kind: "paragraph", text: "The passage reaches a dead end. (TODO) " });
        break;
      case PeriodicCheck.TrickTrap: {
        nodes.push({ kind: "paragraph", text: "There is a trick or trap here." });
        const preview = trickTrapMessages({ detailMode: true });
        for (const m of preview.messages) nodes.push(m);
        break;
      }
      case PeriodicCheck.WanderingMonster:
        // In detail mode we keep behavior consistent: delegate to legacy string path for now.
        nodes.push({ kind: "paragraph", text: getPassageResult(event.level, PeriodicCheck.WanderingMonster, event.avoidMonster ?? false) });
        break;
    }
    return nodes;
  }
  if (event.kind === "doorBeyond") {
    const heading: DungeonMessage = { kind: "heading", level: 3, text: "Door" };
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${DoorBeyond[event.result]}`] };
    nodes.push(heading, bullet);
    switch (event.result) {
      case DoorBeyond.ParallelPassageOrCloset: {
        if (event.doorAhead) {
          nodes.push({ kind: "paragraph", text: "Beyond the door is a 10' x 10' room (check contents, treasure). " });
        } else {
          nodes.push({ kind: "paragraph", text: "Beyond the door is a parallel passage, extending 30' in both directions. " });
          nodes.push({
            kind: "table-preview",
            id: "passageWidth",
            title: "Passage Width",
            sides: passageWidth.sides,
            entries: passageWidth.entries.map((e) => ({ range: rangeText(e.range), label: PassageWidth[e.command] ?? String(e.command) })),
          });
        }
        break;
      }
      case DoorBeyond.PassageStraightAhead: {
        nodes.push({ kind: "paragraph", text: "Beyond the door is a passage straight ahead. " });
        nodes.push({
          kind: "table-preview",
          id: "passageWidth",
          title: "Passage Width",
          sides: passageWidth.sides,
          entries: passageWidth.entries.map((e) => ({ range: rangeText(e.range), label: PassageWidth[e.command] ?? String(e.command) })),
        });
        break;
      }
      case DoorBeyond.Passage45AheadBehind: {
        nodes.push({ kind: "paragraph", text: "Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). " });
        nodes.push({
          kind: "table-preview",
          id: "passageWidth",
          title: "Passage Width",
          sides: passageWidth.sides,
          entries: passageWidth.entries.map((e) => ({ range: rangeText(e.range), label: PassageWidth[e.command] ?? String(e.command) })),
        });
        break;
      }
      case DoorBeyond.Passage45BehindAhead: {
        nodes.push({ kind: "paragraph", text: "Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). " });
        nodes.push({
          kind: "table-preview",
          id: "passageWidth",
          title: "Passage Width",
          sides: passageWidth.sides,
          entries: passageWidth.entries.map((e) => ({ range: rangeText(e.range), label: PassageWidth[e.command] ?? String(e.command) })),
        });
        break;
      }
      case DoorBeyond.Room: {
        nodes.push({ kind: "paragraph", text: "Beyond the door is a room. " });
        nodes.push({
          kind: "table-preview",
          id: "roomDimensions",
          title: "Room Dimensions",
          sides: roomDimensions.sides,
          entries: roomDimensions.entries.map((e) => ({ range: rangeText(e.range), label: RoomDimensions[e.command] ?? String(e.command) })),
        });
        break;
      }
      case DoorBeyond.Chamber: {
        nodes.push({ kind: "paragraph", text: "Beyond the door is a chamber. " });
        nodes.push({
          kind: "table-preview",
          id: "chamberDimensions",
          title: "Chamber Dimensions",
          sides: chamberDimensions.sides,
          entries: chamberDimensions.entries.map((e) => ({ range: rangeText(e.range), label: ChamberDimensions[e.command] ?? String(e.command) })),
        });
        break;
      }
    }
    return nodes;
  }
  return nodes;
}

// COMPACT MODE: outcome -> render nodes with auto-resolved text (no previews)
export function toCompactRender(outcome: DungeonOutcomeNode): DungeonRenderNode[] {
  if (outcome.type !== "event") return [];
  const nodes: DungeonRenderNode[] = [];
  const { event, roll } = outcome;
  if (event.kind === "periodicCheck") {
    const heading: DungeonMessage = { kind: "heading", level: 3, text: "Passage" };
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${PeriodicCheck[event.result]}`] };
    const text = getPassageResult(event.level, event.result, event.avoidMonster ?? false);
    nodes.push(heading, bullet, { kind: "paragraph", text });
    return nodes;
  }
  if (event.kind === "doorBeyond") {
    const heading: DungeonMessage = { kind: "heading", level: 3, text: "Door" };
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${DoorBeyond[event.result]}`] };
    // Mirror doorBeyondMessages compact text behavior by reusing existing services.
    // We reuse doorBeyondMessages logic indirectly by recreating the same strings.
    let text = "";
    switch (event.result) {
      case DoorBeyond.ParallelPassageOrCloset:
        text = event.doorAhead
          ? "Beyond the door is a 10' x 10' room (check contents, treasure). "
          : "Beyond the door is a parallel passage, extending 30' in both directions. ";
        break;
      case DoorBeyond.PassageStraightAhead:
        text = "Beyond the door is a passage straight ahead. ";
        break;
      case DoorBeyond.Passage45AheadBehind:
        text = "Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). ";
        break;
      case DoorBeyond.Passage45BehindAhead:
        text = "Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). ";
        break;
      case DoorBeyond.Room: {
        const res = roomMessages({});
        text = "Beyond the door is a room. ";
        for (const m of res.messages) if (m.kind === "paragraph") text += m.text;
        break;
      }
      case DoorBeyond.Chamber: {
        const res = chamberMessages({});
        text = "Beyond the door is a chamber. ";
        for (const m of res.messages) if (m.kind === "paragraph") text += m.text;
        break;
      }
    }
    // For cases that require Passage Width in compact mode, append it now.
    if (
      event.result === DoorBeyond.PassageStraightAhead ||
      event.result === DoorBeyond.Passage45AheadBehind ||
      event.result === DoorBeyond.Passage45BehindAhead ||
      (event.result === DoorBeyond.ParallelPassageOrCloset && !event.doorAhead)
    ) {
      const width = passageWidthMessages({});
      for (const m of width.messages) if (m.kind === "paragraph") text += m.text;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text });
    return nodes;
  }
  return nodes;
}
