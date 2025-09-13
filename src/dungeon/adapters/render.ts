import { DungeonOutcomeNode } from "../domain/outcome";
import {
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
import { getPassageResult } from "../services/passage";
import { roomMessages } from "../services/roomResult";
import { chamberMessages } from "../services/chamberResult";
import { passageWidthMessages } from "../services/passageWidth";
import {
  SpecialPassage,
  galleryStairLocation,
  GalleryStairLocation,
  streamConstruction,
  StreamConstruction,
  riverConstruction,
  RiverConstruction,
  chasmDepth,
  ChasmDepth,
  chasmConstruction,
  ChasmConstruction,
} from "../../tables/dungeon/specialPassage";
import {
  galleryStairLocationResult,
  streamConstructionResult,
  riverConstructionResult,
  chasmDepthResult,
  chasmConstructionResult,
} from "../services/specialPassage";

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
          context: { kind: "doorChain", existing: [] } as TableContext,
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
    // In detail mode for passage turns, stage a Passage Width preview; for compact, auto append width text
    nodes.push({
      kind: "table-preview",
      id: "passageWidth",
      title: "Passage Width",
      sides: passageWidth.sides,
      entries: passageWidth.entries.map((e) => ({ range: rangeText(e.range), label: PassageWidth[e.command] ?? String(e.command) })),
    });
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
    // Stage subtables as previews in detail mode
    if (event.result === Stairs.DownOne) {
      nodes.push({
        kind: "table-preview",
        id: "egress:one",
        title: "Egress (1 level)",
        sides: egressOne.sides,
        entries: egressOne.entries.map((e) => ({ range: rangeText(e.range), label: Egress[e.command] ?? String(e.command) })),
      });
    } else if (event.result === Stairs.DownTwo) {
      nodes.push({
        kind: "table-preview",
        id: "egress:two",
        title: "Egress (2 levels)",
        sides: egressTwo.sides,
        entries: egressTwo.entries.map((e) => ({ range: rangeText(e.range), label: Egress[e.command] ?? String(e.command) })),
      });
    } else if (event.result === Stairs.DownThree) {
      nodes.push({
        kind: "table-preview",
        id: "egress:three",
        title: "Egress (3 levels)",
        sides: egressThree.sides,
        entries: egressThree.entries.map((e) => ({ range: rangeText(e.range), label: Egress[e.command] ?? String(e.command) })),
      });
    } else if (event.result === Stairs.UpDead || event.result === Stairs.DownDead) {
      nodes.push({
        kind: "table-preview",
        id: "chute",
        title: "Chute",
        sides: chute.sides,
        entries: chute.entries.map((e) => ({ range: rangeText(e.range), label: Chute[e.command] ?? String(e.command) })),
      });
    } else if (event.result === Stairs.UpOneDownTwo) {
      nodes.push({
        kind: "table-preview",
        id: "chamberDimensions",
        title: "Chamber Dimensions",
        sides: chamberDimensions.sides,
        entries: chamberDimensions.entries.map((e) => ({ range: rangeText(e.range), label: ChamberDimensions[e.command] ?? String(e.command) })),
      });
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
  if (event.kind === "sidePassages") {
    const heading: DungeonMessage = { kind: "heading", level: 4, text: "Side Passages" };
    const label = (SidePassages as any)[(event as any).result] ?? String((event as any).result);
    const bullet: DungeonMessage = { kind: "bullet-list", items: [`roll: ${roll} — ${label}`] };
    // Text equals the detail path text
    let text = "";
    switch ((event as any).result) {
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
