import {
  ChasmConstruction,
  chasmConstruction,
  ChasmDepth,
  chasmDepth,
  GalleryStairLocation,
  galleryStairLocation,
  GalleryStairOccurrence,
  galleryStairOccurrence,
  JumpingPlaceWidth,
  jumpingPlaceWidth,
  RiverBoatBank,
  riverBoatBank,
  RiverConstruction,
  riverConstruction,
  SpecialPassage,
  specialPassage,
  StreamConstruction,
  streamConstruction,
} from "../../tables/dungeon/specialPassage";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  DungeonMessage,
} from "../../types/dungeon";
import { resolveSpecialPassage } from "../domain/resolvers";
import { toCompactRender, toDetailRender } from "../adapters/render";


export const specialPassageMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "specialPassage",
      title: "Special Passage",
      sides: specialPassage.sides,
      entries: specialPassage.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: SpecialPassage[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const node = resolveSpecialPassage({ roll: options?.roll });
  const usedRoll = node.type === "event" ? node.roll : undefined;
  const messages = options?.detailMode ? toDetailRender(node) : toCompactRender(node);
  return { usedRoll, messages };
};









// Typed wrappers for sub-tables
export const galleryStairLocationMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "galleryStairLocation",
          title: "Gallery Stair Location",
          sides: galleryStairLocation.sides,
          entries: galleryStairLocation.entries.map((e) => ({
            range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: GalleryStairLocation[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(galleryStairLocation.sides);
  const command = getTableEntry(usedRoll, galleryStairLocation);
  const text =
    command === GalleryStairLocation.PassageEnd
      ? "Stairs up to the gallery will be at the end of the passage. "
      : "Stairs up to the gallery are at the beginning of the passage. ";
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Gallery Stair Location" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${GalleryStairLocation[command]}`] },
    { kind: "paragraph", text },
  ];
  if (options?.detailMode && command === GalleryStairLocation.PassageEnd) {
    messages.push({
      kind: "table-preview",
      id: "galleryStairOccurrence",
      title: "Gallery Stair Occurrence",
      sides: galleryStairOccurrence.sides,
      entries: galleryStairOccurrence.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: GalleryStairOccurrence[e.command] ?? String(e.command),
      })),
    });
  }
  return { usedRoll, messages };
};

export const galleryStairOccurrenceMessages = (
  options?: { roll?: number }
): { usedRoll: number; messages: DungeonMessage[] } => {
  const usedRoll = options?.roll ?? rollDice(galleryStairOccurrence.sides);
  const command = getTableEntry(usedRoll, galleryStairOccurrence);
  const text =
    command === GalleryStairOccurrence.Replace
      ? "If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. "
      : "If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ";
  return {
    usedRoll,
    messages: [
      { kind: "heading", level: 4, text: "Gallery Stair Occurrence" },
      { kind: "bullet-list", items: [`roll: ${usedRoll} — ${GalleryStairOccurrence[command]}`] },
      { kind: "paragraph", text },
    ],
  };
};

export const streamConstructionMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "streamConstruction",
          title: "Stream Construction",
          sides: streamConstruction.sides,
          entries: streamConstruction.entries.map((e) => ({
            range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: StreamConstruction[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(streamConstruction.sides);
  const command = getTableEntry(usedRoll, streamConstruction);
  const text = command === StreamConstruction.Bridged ? "A bridge crosses the stream. " : "";
  return {
    usedRoll,
    messages: [
      { kind: "heading", level: 4, text: "Stream Construction" },
      { kind: "bullet-list", items: [`roll: ${usedRoll} — ${StreamConstruction[command]}`] },
      { kind: "paragraph", text },
    ],
  };
};

export const riverConstructionMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "riverConstruction",
          title: "River Construction",
          sides: riverConstruction.sides,
          entries: riverConstruction.entries.map((e) => ({
            range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: RiverConstruction[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(riverConstruction.sides);
  const command = getTableEntry(usedRoll, riverConstruction);
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "River Construction" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${RiverConstruction[command]}`] },
  ];
  if (command === RiverConstruction.Bridged) {
    messages.push({ kind: "paragraph", text: "A bridge crosses the river. " });
  } else if (command === RiverConstruction.Boat) {
    messages.push({ kind: "paragraph", text: "There is a boat. " });
    if (options?.detailMode) {
      messages.push({
        kind: "table-preview",
        id: "riverBoatBank",
        title: "Boat Bank",
        sides: riverBoatBank.sides,
        entries: riverBoatBank.entries.map((e) => ({
          range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
          label: RiverBoatBank[e.command] ?? String(e.command),
        })),
      });
    }
  }
  return { usedRoll, messages };
};

export const riverBoatBankMessages = (
  options?: { roll?: number }
): { usedRoll: number; messages: DungeonMessage[] } => {
  const usedRoll = options?.roll ?? rollDice(riverBoatBank.sides);
  const command = getTableEntry(usedRoll, riverBoatBank);
  const text =
    command === RiverBoatBank.ThisSide
      ? "The boat is on this bank of the river. "
      : "The boat is on the opposite bank of the river. ";
  return {
    usedRoll,
    messages: [
      { kind: "heading", level: 4, text: "Boat Bank" },
      { kind: "bullet-list", items: [`roll: ${usedRoll} — ${RiverBoatBank[command]}`] },
      { kind: "paragraph", text },
    ],
  };
};

export const chasmDepthMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "chasmDepth",
          title: "Chasm Depth",
          sides: chasmDepth.sides,
          entries: chasmDepth.entries.map((e) => ({
            range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: ChasmDepth[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(chasmDepth.sides);
  const command = getTableEntry(usedRoll, chasmDepth);
  const depthText =
    command === ChasmDepth.Feet150
      ? "150'"
      : command === ChasmDepth.Feet160
      ? "160'"
      : command === ChasmDepth.Feet170
      ? "170'"
      : command === ChasmDepth.Feet180
      ? "180'"
      : command === ChasmDepth.Feet190
      ? "190'"
      : "200'";
  const text = `The chasm is ${depthText} deep. `;
  return {
    usedRoll,
    messages: [
      { kind: "heading", level: 4, text: "Chasm Depth" },
      { kind: "bullet-list", items: [`roll: ${usedRoll} — ${ChasmDepth[command]}`] },
      { kind: "paragraph", text },
    ],
  };
};

export const chasmConstructionMessages = (
  options?: { roll?: number; detailMode?: boolean }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "chasmConstruction",
          title: "Chasm Construction",
          sides: chasmConstruction.sides,
          entries: chasmConstruction.entries.map((e) => ({
            range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: ChasmConstruction[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(chasmConstruction.sides);
  const command = getTableEntry(usedRoll, chasmConstruction);
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Chasm Construction" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${ChasmConstruction[command]}`] },
  ];
  if (command === ChasmConstruction.Bridged) {
    messages.push({ kind: "paragraph", text: "A bridge crosses the chasm. " });
  } else if (command === ChasmConstruction.JumpingPlace) {
    messages.push({ kind: "paragraph", text: "There is a jumping place. " });
    if (options?.detailMode) {
      messages.push({
        kind: "table-preview",
        id: "jumpingPlaceWidth",
        title: "Jumping Place Width",
        sides: jumpingPlaceWidth.sides,
        entries: jumpingPlaceWidth.entries.map((e) => ({
          range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
          label: JumpingPlaceWidth[e.command] ?? String(e.command),
        })),
      });
    }
  } else {
    messages.push({ kind: "paragraph", text: "It has no bridge, and is too wide to jump across. " });
  }
  return { usedRoll, messages };
};

export const jumpingPlaceWidthMessages = (
  options?: { roll?: number }
): { usedRoll: number; messages: DungeonMessage[] } => {
  const usedRoll = options?.roll ?? rollDice(jumpingPlaceWidth.sides);
  const command = getTableEntry(usedRoll, jumpingPlaceWidth);
  const widthText = command === JumpingPlaceWidth.FiveFeet ? "5'" : "10'";
  const text = `It is ${widthText} wide. `;
  return {
    usedRoll,
    messages: [
      { kind: "heading", level: 4, text: "Jumping Place Width" },
      { kind: "bullet-list", items: [`roll: ${usedRoll} — ${JumpingPlaceWidth[command]}`] },
      { kind: "paragraph", text },
    ],
  };
};
