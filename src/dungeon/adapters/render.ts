import type { DungeonOutcomeNode, PendingRoll } from "../domain/outcome";
import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from "../../types/dungeon";
import { PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import { DoorBeyond } from "../../tables/dungeon/doorBeyond";
import { chamberDimensions, ChamberDimensions, roomDimensions, RoomDimensions } from "../../tables/dungeon/chambersRooms";
import { doorLocation, DoorLocation } from "../../tables/dungeon/doorLocation";
import { sidePassages, SidePassages } from "../../tables/dungeon/sidePassages";
import { passageTurns, PassageTurns } from "../../tables/dungeon/passageTurns";
import { stairs, Stairs, egressOne, egressTwo, egressThree, Egress, chute, Chute } from "../../tables/dungeon/stairs";
import { trickTrapMessages } from "../services/trickTrap";
import { passageWidth, PassageWidth } from "../../tables/dungeon/passageWidth";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { periodicCheck } from "../../tables/dungeon/periodicCheck";
import { getMonsterTable } from "../services/wanderingMonsterResult";
import { MonsterLevel } from "../../tables/dungeon/monster/monsterLevel";
import { monsterOneResult } from "../services/monster/monsterOneResult";
import { monsterTwoResult } from "../services/monster/monsterTwoResult";
import { monsterThreeResult } from "../services/monster/monsterThreeResult";
import { monsterFourResult } from "../services/monster/monsterFourResult";
import { monsterFiveResult } from "../services/monster/monsterFiveResult";
import { monsterSixResult } from "../services/monster/monsterSixResult";
import { roomMessages } from "../services/roomResult";
import { chamberMessages } from "../services/chamberResult";
import { passageWidthMessages } from "../services/passageWidth";
import { SpecialPassage, galleryStairLocation, GalleryStairLocation, streamConstruction, StreamConstruction, riverConstruction, RiverConstruction, chasmDepth, ChasmDepth, chasmConstruction, ChasmConstruction } from "../../tables/dungeon/specialPassage";
import { galleryStairLocationResult, streamConstructionResult, riverConstructionResult, chasmDepthResult, chasmConstructionResult, specialPassageResult } from "../services/specialPassage";
import { chamberResult } from "../services/chamberResult";

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
        break;
      }
      case PeriodicCheck.SidePassage: {
        nodes.push({ kind: "paragraph", text: "A side passage occurs." });
        break;
      }
      case PeriodicCheck.PassageTurn: {
        nodes.push({ kind: "paragraph", text: "The passage turns." });
        break;
      }
      case PeriodicCheck.Chamber: {
        nodes.push({ kind: "paragraph", text: "The passage opens into a chamber. " });
        break;
      }
      case PeriodicCheck.Stairs: {
        nodes.push({ kind: "paragraph", text: "Stairs are indicated here." });
        break;
      }
      case PeriodicCheck.DeadEnd:
        nodes.push({ kind: "paragraph", text: "The passage reaches a dead end. (TODO) " });
        break;
      case PeriodicCheck.TrickTrap: {
        nodes.push({ kind: "paragraph", text: "There is a trick or trap here." });
        break;
      }
      case PeriodicCheck.WanderingMonster:
        nodes.push({ kind: "paragraph", text: "A wandering monster is indicated." });
        break;
    }
    // Render any pending child previews supplied by the resolver
    if (outcome.children && Array.isArray(outcome.children)) {
      for (const child of outcome.children) {
        if (child.type !== "pending-roll") continue;
        const preview = previewForPending(child);
        if (preview) nodes.push(preview);
      }
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
  if (event.kind === "sidePassages") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Side Passages" };
    const label = SidePassages[event.result] ?? String(event.result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    let text = "";
    switch (event.result) {
      case SidePassages.Left90:
        text = "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right90:
        text = "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Left45:
        text = "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right45:
        text = "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Left135:
        text = "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right135:
        text = "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
        break;
      case SidePassages.LeftCurve45:
        text = "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.RightCurve45:
        text = "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageT:
        text = "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageY:
        text = "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.FourWay:
        text = "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageX:
        text = "The passage reaches an 'X' intersection. (If the present passage is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. ";
        break;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text });
    return nodes;
  }
  if (event.kind === "passageTurns") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Passage Turns" };
    const label = PassageTurns[event.result] ?? String(event.result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    let textPrefix = "";
    switch (event.result) {
      case PassageTurns.Left90:
        textPrefix = "The passage turns left 90 degrees - check again in 30'. ";
        break;
      case PassageTurns.Left45:
        textPrefix = "The passage turns left 45 degrees ahead - check again in 30'. ";
        break;
      case PassageTurns.Left135:
        textPrefix = "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
        break;
      case PassageTurns.Right90:
        textPrefix = "The passage turns right 90 degrees - check again in 30'. ";
        break;
      case PassageTurns.Right45:
        textPrefix = "The passage turns right 45 degrees ahead - check again in 30'. ";
        break;
      case PassageTurns.Right135:
        textPrefix = "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
        break;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text: textPrefix });
    // Render any pending child previews supplied by the resolver
    if (outcome.children && Array.isArray(outcome.children)) {
      for (const child of outcome.children) {
        if (child.type !== "pending-roll") continue;
        const preview = previewForPending(child);
        if (preview) nodes.push(preview);
      }
    }
    return nodes;
  }
  if (event.kind === "stairs") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Stairs" };
    const label = Stairs[event.result] ?? String(event.result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    let text = "";
    switch (event.result) {
      case Stairs.DownOne:
        text = "There are stairs here that descend one level. ";
        break;
      case Stairs.DownTwo:
        text = "There are stairs here that descend two levels. ";
        break;
      case Stairs.DownThree:
        text = "There are stairs here that descend three levels. ";
        break;
      case Stairs.UpOne:
        text = "There are stairs here that ascend one level. ";
        break;
      case Stairs.UpDead:
        text = "There are stairs here that ascend one level to a dead end. ";
        break;
      case Stairs.DownDead:
        text = "There are stairs here that descend one level to a dead end. ";
        break;
      case Stairs.ChimneyUpOne:
        text = "There is a chimney that goes up one level. The current passage continues, check again in 30'. ";
        break;
      case Stairs.ChimneyUpTwo:
        text = "There is a chimney that goes up two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.ChimneyDownTwo:
        text = "There is a chimney that goes down two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.TrapDoorDownOne:
        text = "There is a trap door that goes down one level. The current passage continues, check again in 30'. ";
        break;
      case Stairs.TrapDownDownTwo:
        text = "There is a trap door that goes down two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.UpOneDownTwo:
        text = "There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. ";
        break;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text });
    // Render pending child previews from resolver
    if (outcome.type === "event" && outcome.children && Array.isArray(outcome.children)) {
      for (const child of outcome.children) {
        if (child.type !== "pending-roll") continue;
        const preview = previewForPending(child);
        if (preview) nodes.push(preview);
      }
    }
    return nodes;
  }
  if (event.kind === "specialPassage") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Special Passage" };
    const label = SpecialPassage[event.result] ?? String(event.result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    let text = "";
    switch (event.result) {
      case SpecialPassage.FortyFeetColumns:
        text = "The passage is 40' wide, with columns down the center. ";
        break;
      case SpecialPassage.FortyFeetDoubleColumns:
        text = "The passage is 40' wide, with a double row of columns. ";
        break;
      case SpecialPassage.FiftyFeetDoubleColumns:
        text = "The passage is 50' wide, with a double row of columns. ";
        break;
      case SpecialPassage.FiftyFeetGalleries:
        text = "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. ";
        break;
      case SpecialPassage.TenFootStream:
        text = "A stream, 10' wide, bisects the passage. ";
        break;
      case SpecialPassage.TwentyFootRiver:
        text = "A river, 20' wide, bisects the passage. ";
        break;
      case SpecialPassage.FortyFootRiver:
        text = "A river, 40' wide, bisects the passage. ";
        break;
      case SpecialPassage.SixtyFootRiver:
        text = "A river, 60' wide, bisects the passage. ";
        break;
      case SpecialPassage.TwentyFootChasm:
        text = "A chasm, 20' wide, bisects the passage. ";
        break;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text });
    if (event.result === SpecialPassage.FiftyFeetGalleries) {
      nodes.push({
        kind: "table-preview",
        id: "galleryStairLocation",
        title: "Gallery Stair Location",
        sides: galleryStairLocation.sides,
        entries: galleryStairLocation.entries.map((e) => ({ range: rangeText(e.range), label: GalleryStairLocation[e.command] ?? String(e.command) })),
      });
    } else if (event.result === SpecialPassage.TenFootStream) {
      nodes.push({
        kind: "table-preview",
        id: "streamConstruction",
        title: "Stream Construction",
        sides: streamConstruction.sides,
        entries: streamConstruction.entries.map((e) => ({ range: rangeText(e.range), label: StreamConstruction[e.command] ?? String(e.command) })),
      });
    } else if (
      event.result === SpecialPassage.TwentyFootRiver ||
      event.result === SpecialPassage.FortyFootRiver ||
      event.result === SpecialPassage.SixtyFootRiver
    ) {
      nodes.push({
        kind: "table-preview",
        id: "riverConstruction",
        title: "River Construction",
        sides: riverConstruction.sides,
        entries: riverConstruction.entries.map((e) => ({ range: rangeText(e.range), label: RiverConstruction[e.command] ?? String(e.command) })),
      });
    } else if (event.result === SpecialPassage.TwentyFootChasm) {
      nodes.push({
        kind: "table-preview",
        id: "chasmDepth",
        title: "Chasm Depth",
        sides: chasmDepth.sides,
        entries: chasmDepth.entries.map((e) => ({ range: rangeText(e.range), label: ChasmDepth[e.command] ?? String(e.command) })),
      });
      nodes.push({
        kind: "table-preview",
        id: "chasmConstruction",
        title: "Chasm Construction",
        sides: chasmConstruction.sides,
        entries: chasmConstruction.entries.map((e) => ({ range: rangeText(e.range), label: ChasmConstruction[e.command] ?? String(e.command) })),
      });
    }
    return nodes;
  }
  return nodes;
}

function isTableContext(x: unknown): x is TableContext {
  if (!x || typeof x !== "object") return false;
  const k = (x as { kind?: unknown }).kind;
  if (k === "doorChain") return Array.isArray((x as { existing?: unknown }).existing);
  if (k === "wandering") return typeof (x as { level?: unknown }).level === "number";
  if (k === "exits") {
    const o = x as { length?: unknown; width?: unknown; isRoom?: unknown };
    return typeof o.length === "number" && typeof o.width === "number" && typeof o.isRoom === "boolean";
  }
  return false;
}

function previewForPending(p: PendingRoll): DungeonTablePreview | undefined {
  const base = String(p.table.split(":")[0]);
  switch (base) {
    case "doorLocation":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Door Location",
        sides: doorLocation.sides,
        entries: doorLocation.entries.map((e) => ({ range: rangeText(e.range), label: DoorLocation[e.command] ?? String(e.command) })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case "sidePassages":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Side Passages",
        sides: sidePassages.sides,
        entries: sidePassages.entries.map((e) => ({ range: rangeText(e.range), label: SidePassages[e.command] ?? String(e.command) })),
      };
    case "passageTurns":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Passage Turns",
        sides: passageTurns.sides,
        entries: passageTurns.entries.map((e) => ({ range: rangeText(e.range), label: PassageTurns[e.command] ?? String(e.command) })),
      };
    case "passageWidth":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Passage Width",
        sides: passageWidth.sides,
        entries: passageWidth.entries.map((e) => ({ range: rangeText(e.range), label: PassageWidth[e.command] ?? String(e.command) })),
      };
    case "chamberDimensions":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Chamber Dimensions",
        sides: chamberDimensions.sides,
        entries: chamberDimensions.entries.map((e) => ({ range: rangeText(e.range), label: ChamberDimensions[e.command] ?? String(e.command) })),
      };
    case "stairs":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Stairs",
        sides: stairs.sides,
        entries: stairs.entries.map((e) => ({ range: rangeText(e.range), label: Stairs[e.command] ?? String(e.command) })),
      };
    case "egress": {
      const which = p.table.split(":")[1] as "one" | "two" | "three" | undefined;
      const table = which === "one" ? egressOne : which === "two" ? egressTwo : egressThree;
      const title = which === "one" ? "Egress (1 level)" : which === "two" ? "Egress (2 levels)" : "Egress (3 levels)";
      return {
        kind: "table-preview",
        id: p.table,
        title,
        sides: table.sides,
        entries: table.entries.map((e) => ({ range: rangeText(e.range), label: Egress[e.command] ?? String(e.command) })),
      };
    }
    case "chute":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Chute",
        sides: chute.sides,
        entries: chute.entries.map((e) => ({ range: rangeText(e.range), label: Chute[e.command] ?? String(e.command) })),
      };
    case "wanderingWhereFrom":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Where From",
        sides: periodicCheck.sides,
        entries: periodicCheck.entries
          .filter((e) => e.command !== PeriodicCheck.WanderingMonster)
          .map((e) => ({ range: rangeText(e.range), label: PeriodicCheck[e.command] ?? String(e.command) })),
      };
    case "monsterLevel": {
      const parts = p.table.split(":");
      const lvl = Number(parts[1] ?? 1) || 1;
      const table = getMonsterTable(lvl);
      return {
        kind: "table-preview",
        id: p.table,
        title: "Monster Level",
        sides: table.sides,
        entries: table.entries.map((e) => ({ range: rangeText(e.range), label: MonsterLevel[e.command] ?? String(e.command) })),
        context: { kind: "wandering", level: lvl } as TableContext,
      };
    }
    case "galleryStairLocation":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Gallery Stair Location",
        sides: galleryStairLocation.sides,
        entries: galleryStairLocation.entries.map((e) => ({ range: rangeText(e.range), label: GalleryStairLocation[e.command] ?? String(e.command) })),
      };
    case "streamConstruction":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Stream Construction",
        sides: streamConstruction.sides,
        entries: streamConstruction.entries.map((e) => ({ range: rangeText(e.range), label: StreamConstruction[e.command] ?? String(e.command) })),
      };
    case "riverConstruction":
      return {
        kind: "table-preview",
        id: p.table,
        title: "River Construction",
        sides: riverConstruction.sides,
        entries: riverConstruction.entries.map((e) => ({ range: rangeText(e.range), label: RiverConstruction[e.command] ?? String(e.command) })),
      };
    case "chasmDepth":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Chasm Depth",
        sides: chasmDepth.sides,
        entries: chasmDepth.entries.map((e) => ({ range: rangeText(e.range), label: ChasmDepth[e.command] ?? String(e.command) })),
      };
    case "chasmConstruction":
      return {
        kind: "table-preview",
        id: p.table,
        title: "Chasm Construction",
        sides: chasmConstruction.sides,
        entries: chasmConstruction.entries.map((e) => ({ range: rangeText(e.range), label: ChasmConstruction[e.command] ?? String(e.command) })),
      };
    case "trickTrap": {
      // Use existing trick/trap messages to build preview
      const preview = trickTrapMessages({ detailMode: true });
      const tp = preview.messages.find((m) => m.kind === "table-preview") as DungeonTablePreview | undefined;
      return tp;
    }
  }
  return undefined;
}

// COMPACT MODE: outcome -> render nodes with auto-resolved text (no previews)
export function toCompactRender(outcome: DungeonOutcomeNode): DungeonRenderNode[] {
  if (outcome.type !== "event") return [];
  const nodes: DungeonRenderNode[] = [];
  const { event, roll } = outcome;
  if (event.kind === "periodicCheck") {
    const heading: DungeonMessage = { kind: "heading", level: 3, text: "Passage" };
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${PeriodicCheck[event.result]}`] };
    const text =
      event.result === PeriodicCheck.Door
        ? compactDoorText()
        : event.result === PeriodicCheck.WanderingMonster
        ? compactWanderingMonsterText(event.level)
        : compactPeriodicText(event.level, event.result, event.avoidMonster ?? false);
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
  if (event.kind === "sidePassages") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Side Passages" };
    const label = SidePassages[event.result] ?? String(event.result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    // Text equals the detail path text
    let text = "";
    switch (event.result) {
      case SidePassages.Left90:
        text = "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right90:
        text = "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Left45:
        text = "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right45:
        text = "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Left135:
        text = "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right135:
        text = "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
        break;
      case SidePassages.LeftCurve45:
        text = "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.RightCurve45:
        text = "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageT:
        text = "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageY:
        text = "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.FourWay:
        text = "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageX:
        text = "The passage reaches an 'X' intersection. (If the present passage is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. ";
        break;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text });
    return nodes;
  }
  if (event.kind === "passageTurns") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Passage Turns" };
    const label = PassageTurns[event.result] ?? String(event.result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    let textPrefix = "";
    switch (event.result) {
      case PassageTurns.Left90:
        textPrefix = "The passage turns left 90 degrees - check again in 30'. ";
        break;
      case PassageTurns.Left45:
        textPrefix = "The passage turns left 45 degrees ahead - check again in 30'. ";
        break;
      case PassageTurns.Left135:
        textPrefix = "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
        break;
      case PassageTurns.Right90:
        textPrefix = "The passage turns right 90 degrees - check again in 30'. ";
        break;
      case PassageTurns.Right45:
        textPrefix = "The passage turns right 45 degrees ahead - check again in 30'. ";
        break;
      case PassageTurns.Right135:
        textPrefix = "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
        break;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text: textPrefix });
    // Compact: append width paragraph
    const width = passageWidthMessages({});
    for (const m of width.messages) if (m.kind === "paragraph") nodes.push(m);
    return nodes;
  }
  if (event.kind === "stairs") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Stairs" };
    const label = Stairs[event.result] ?? String(event.result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    let text = "";
    switch (event.result) {
      case Stairs.DownOne:
        text = "There are stairs here that descend one level. ";
        break;
      case Stairs.DownTwo:
        text = "There are stairs here that descend two levels. ";
        break;
      case Stairs.DownThree:
        text = "There are stairs here that descend three levels. ";
        break;
      case Stairs.UpOne:
        text = "There are stairs here that ascend one level. ";
        break;
      case Stairs.UpDead:
        text = "There are stairs here that ascend one level to a dead end. ";
        break;
      case Stairs.DownDead:
        text = "There are stairs here that descend one level to a dead end. ";
        break;
      case Stairs.ChimneyUpOne:
        text = "There is a chimney that goes up one level. The current passage continues, check again in 30'. ";
        break;
      case Stairs.ChimneyUpTwo:
        text = "There is a chimney that goes up two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.ChimneyDownTwo:
        text = "There is a chimney that goes down two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.TrapDoorDownOne:
        text = "There is a trap door that goes down one level. The current passage continues, check again in 30'. ";
        break;
      case Stairs.TrapDownDownTwo:
        text = "There is a trap door that goes down two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.UpOneDownTwo:
        text = "There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. ";
        break;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text });
    return nodes;
  }
  if (event.kind === "specialPassage") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Special Passage" };
    const label = SpecialPassage[event.result] ?? String(event.result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    let text = "";
    switch (event.result) {
      case SpecialPassage.FortyFeetColumns:
        text = "The passage is 40' wide, with columns down the center. ";
        break;
      case SpecialPassage.FortyFeetDoubleColumns:
        text = "The passage is 40' wide, with a double row of columns. ";
        break;
      case SpecialPassage.FiftyFeetDoubleColumns:
        text = "The passage is 50' wide, with a double row of columns. ";
        break;
      case SpecialPassage.FiftyFeetGalleries:
        text = "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. " + galleryStairLocationResult();
        break;
      case SpecialPassage.TenFootStream:
        text = "A stream, 10' wide, bisects the passage. " + streamConstructionResult();
        break;
      case SpecialPassage.TwentyFootRiver:
      case SpecialPassage.FortyFootRiver:
      case SpecialPassage.SixtyFootRiver:
        text =
          (event.result === SpecialPassage.TwentyFootRiver
            ? "A river, 20' wide, bisects the passage. "
            : event.result === SpecialPassage.FortyFootRiver
            ? "A river, 40' wide, bisects the passage. "
            : "A river, 60' wide, bisects the passage. ") + riverConstructionResult();
        break;
      case SpecialPassage.TwentyFootChasm:
        text = "A chasm, 20' wide, bisects the passage. " + chasmDepthResult() + chasmConstructionResult();
        break;
    }
    nodes.push(heading, bullet, { kind: "paragraph", text });
    return nodes;
  }
  return nodes;
}

// Compact helpers live locally in the adapter to avoid service-level string APIs.
function compactDoorText(existing: ("Left" | "Right")[] = []): string {
  const doorRoll = rollDice(doorLocation.sides);
  const doorCmd = getTableEntry(doorRoll, doorLocation);
  const prefix =
    doorCmd === DoorLocation.Ahead
      ? "A door is Ahead. "
      : `A door is to the ${DoorLocation[doorCmd]}. `;
  if (doorCmd === DoorLocation.Ahead) return prefix;
  const loc: "Left" | "Right" | "" =
    doorCmd === DoorLocation.Left ? "Left" : doorCmd === DoorLocation.Right ? "Right" : "";
  if (loc === "") return prefix;
  if (existing.includes(loc)) {
    // On repeating the same left/right location, do not duplicate the location prefix.
    return "There are no more doors. The main passage extends -- check again in 30'. ";
  }
  const reRoll = rollDice(periodicCheck.sides);
  const reCmd = getTableEntry(reRoll, periodicCheck);
  if (reCmd === PeriodicCheck.Door) {
    return prefix + compactDoorText([...existing, loc]);
  }
  return prefix + "There are no other doors. The main passage extends -- check again in 30'. ";
}

function compactPeriodicText(_level: number, result: PeriodicCheck, _avoidMonster: boolean): string {
  switch (result) {
    case PeriodicCheck.ContinueStraight:
      return "Continue straight -- check again in 60'. ";
    case PeriodicCheck.Door:
      return compactDoorText();
    case PeriodicCheck.SidePassage: {
      const roll = rollDice(sidePassages.sides);
      const cmd = getTableEntry(roll, sidePassages);
      switch (cmd) {
        case SidePassages.Left90:
          return "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
        case SidePassages.Right90:
          return "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
        case SidePassages.Left45:
          return "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
        case SidePassages.Right45:
          return "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
        case SidePassages.Left135:
          return "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
        case SidePassages.Right135:
          return "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
        case SidePassages.LeftCurve45:
          return "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
        case SidePassages.RightCurve45:
          return "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
        case SidePassages.PassageT:
          return "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
        case SidePassages.PassageY:
          return "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
        case SidePassages.FourWay:
          return "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
        case SidePassages.PassageX:
          return "The passage reaches an 'X' intersection. (If the present passage is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. ";
      }
    }
    case PeriodicCheck.PassageTurn: {
      const roll = rollDice(passageTurns.sides);
      const cmd = getTableEntry(roll, passageTurns);
      let prefix = "";
      switch (cmd) {
        case PassageTurns.Left90:
          prefix = "The passage turns left 90 degrees - check again in 30'. ";
          break;
        case PassageTurns.Left45:
          prefix = "The passage turns left 45 degrees ahead - check again in 30'. ";
          break;
        case PassageTurns.Left135:
          prefix = "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
          break;
        case PassageTurns.Right90:
          prefix = "The passage turns right 90 degrees - check again in 30'. ";
          break;
        case PassageTurns.Right45:
          prefix = "The passage turns right 45 degrees ahead - check again in 30'. ";
          break;
        case PassageTurns.Right135:
          prefix = "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
          break;
      }
      const wRoll = rollDice(passageWidth.sides);
      const wCmd = getTableEntry(wRoll, passageWidth);
      let widthText = "";
      switch (wCmd) {
        case PassageWidth.TenFeet:
          widthText = "The passage is 10' wide. ";
          break;
        case PassageWidth.TwentyFeet:
          widthText = "The passage is 20' wide. ";
          break;
        case PassageWidth.ThirtyFeet:
          widthText = "The passage is 30' wide. ";
          break;
        case PassageWidth.FiveFeet:
          widthText = "The passage is 5' wide. ";
          break;
        case PassageWidth.SpecialPassage:
          widthText = specialPassageResult();
          break;
      }
      return prefix + widthText;
    }
    case PeriodicCheck.Chamber:
      return "The passage opens into a chamber. " + chamberResult();
    case PeriodicCheck.Stairs: {
      const sRoll = rollDice(stairs.sides);
      const sCmd = getTableEntry(sRoll, stairs);
      switch (sCmd) {
        case Stairs.DownOne: {
          const r = rollDice(egressOne.sides);
          const c = getTableEntry(r, egressOne);
          const suffix = c === Egress.Closed ? "After descending, an unnoticed door will close egress for the day. " : "";
          return "There are stairs here that descend one level. " + suffix;
        }
        case Stairs.DownTwo: {
          const r = rollDice(egressTwo.sides);
          const c = getTableEntry(r, egressTwo);
          const suffix = c === Egress.Closed ? "After descending, an unnoticed door will close egress for the day. " : "";
          return "There are stairs here that descend two levels. " + suffix;
        }
        case Stairs.DownThree: {
          const r = rollDice(egressThree.sides);
          const c = getTableEntry(r, egressThree);
          const suffix = c === Egress.Closed ? "After descending, an unnoticed door will close egress for the day. " : "";
          return "There are stairs here that descend three levels. " + suffix;
        }
        case Stairs.UpOne:
          return "There are stairs here that ascend one level. ";
        case Stairs.UpDead: {
          const r = rollDice(chute.sides);
          const c = getTableEntry(r, chute);
          const suffix = c === Chute.Exists ? "The stairs will turn into a chute, descending two levels from the top. " : "";
          return "There are stairs here that ascend one level to a dead end. " + suffix;
        }
        case Stairs.DownDead: {
          const r = rollDice(chute.sides);
          const c = getTableEntry(r, chute);
          const suffix = c === Chute.Exists ? "The stairs will turn into a chute, descending two levels from the top. " : "";
          return "There are stairs here that descend one level to a dead end. " + suffix;
        }
        case Stairs.ChimneyUpOne:
          return "There is a chimney that goes up one level. The current passage continues, check again in 30'. ";
        case Stairs.ChimneyUpTwo:
          return "There is a chimney that goes up two levels. The current passage continues, check again in 30'. ";
        case Stairs.ChimneyDownTwo:
          return "There is a chimney that goes down two levels. The current passage continues, check again in 30'. ";
        case Stairs.TrapDoorDownOne:
          return "There is a trap door that goes down one level. The current passage continues, check again in 30'. ";
        case Stairs.TrapDownDownTwo:
          return "There is a trap door that goes down two levels. The current passage continues, check again in 30'. ";
        case Stairs.UpOneDownTwo:
          return (
            "There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. " +
            chamberResult()
          );
      }
    }
    case PeriodicCheck.DeadEnd:
      return "The passage reaches a dead end. (TODO) ";
    case PeriodicCheck.TrickTrap:
      return "There is a trick or trap. (TODO) -- check again in 30'. ";
    case PeriodicCheck.WanderingMonster:
      return "";
  }
}

// Compose compact text for Wandering Monster without legacy helpers.
function compactWanderingMonsterText(level: number): string {
  // Determine where the monster comes from (re-rolling 20s)
  let location: PeriodicCheck;
  do {
    const r = rollDice(periodicCheck.sides);
    location = getTableEntry(r, periodicCheck);
  } while (location === PeriodicCheck.WanderingMonster);

  let prefix = "";
  if (location === PeriodicCheck.Door) {
    prefix = compactDoorText();
  } else {
    // Compose compact periodic text for where-from (non-door)
    prefix = compactPeriodicText(level, location, true);
  }
  // Roll monster level table for the given dungeon level
  const table = getMonsterTable(level);
  const roll = rollDice(table.sides);
  const ml = getTableEntry(roll, table);
  let monsterText = "";
  switch (ml) {
    case MonsterLevel.One:
      monsterText = monsterOneResult(level);
      break;
    case MonsterLevel.Two:
      monsterText = monsterTwoResult(level);
      break;
    case MonsterLevel.Three:
      monsterText = monsterThreeResult(level);
      break;
    case MonsterLevel.Four:
      monsterText = monsterFourResult(level);
      break;
    case MonsterLevel.Five:
      monsterText = monsterFiveResult(level);
      break;
    case MonsterLevel.Six:
      monsterText = monsterSixResult(level);
      break;
    case MonsterLevel.Seven:
      monsterText = "(TODO: Roll Monster for Level Seven)";
      break;
    case MonsterLevel.Eight:
      monsterText = "(TODO: Roll Monster for Level Eight)";
      break;
    case MonsterLevel.Nine:
      monsterText = "(TODO: Roll Monster for Level Nine)";
      break;
    case MonsterLevel.Ten:
      monsterText = "(TODO: Roll Monster for Level Ten)";
      break;
  }
  return `${prefix}Wandering Monster: ${monsterText}`;
}
