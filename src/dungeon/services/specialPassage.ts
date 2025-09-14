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

export const specialPassageResult = (): string => {
  const specialPassageRoll = rollDice(specialPassage.sides);
  const specialPassageCommand = getTableEntry(
    specialPassageRoll,
    specialPassage
  );
  console.log(
    `specialPassage roll: ${specialPassageRoll} is ${SpecialPassage[specialPassageCommand]}`
  );
  switch (specialPassageCommand) {
    case SpecialPassage.FortyFeetColumns:
      return "The passage is 40' wide, with columns down the center. ";
    case SpecialPassage.FortyFeetDoubleColumns:
      return "The passage is 40' wide, with a double row of columns. ";
    case SpecialPassage.FiftyFeetDoubleColumns:
      return "The passage is 50' wide, with a double row of columns. ";
    case SpecialPassage.FiftyFeetGalleries: {
      const result =
        "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. ";
      return result + galleryStairLocationResult();
    }
    case SpecialPassage.TenFootStream: {
      const result = "A stream, 10' wide, bisects the passage. ";
      return result + streamConstructionResult();
    }
    case SpecialPassage.TwentyFootRiver: {
      const result = "A river, 20' wide, bisects the passage. ";
      return result + riverConstructionResult();
    }
    case SpecialPassage.FortyFootRiver: {
      const result = "A river, 40' wide, bisects the passage. ";
      return result + riverConstructionResult();
    }
    case SpecialPassage.SixtyFootRiver: {
      const result = "A river, 60' wide, bisects the passage. ";
      return result + riverConstructionResult();
    }
    case SpecialPassage.TwentyFootChasm: {
      const result = "A chasm, 20' wide, bisects the passage. ";
      return result + chasmDepthResult() + chasmConstructionResult();
    }
  }
};

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

export const galleryStairLocationResult = (): string => {
  const roll = rollDice(galleryStairLocation.sides);
  const command = getTableEntry(roll, galleryStairLocation);
  console.log(
    `galleryStairLocation roll: ${roll} is ${GalleryStairLocation[command]}`
  );
  switch (command) {
    case GalleryStairLocation.PassageEnd: {
      const result =
        "Stairs up to the gallery will be at the end of the passage. ";
      return result + galleryStairOccurrenceResult();
    }
    case GalleryStairLocation.PassageBeginning:
      return "Stairs up to the gallery are at the beginning of the passage. ";
  }
};

export const galleryStairOccurrenceResult = (): string => {
  const roll = rollDice(galleryStairOccurrence.sides);
  const command = getTableEntry(roll, galleryStairOccurrence);
  console.log(
    `galleryStairOccurrence roll: ${roll} is ${GalleryStairOccurrence[command]}`
  );
  switch (command) {
    case GalleryStairOccurrence.Replace:
      return "If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. ";
    case GalleryStairOccurrence.Supplement:
      return "If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ";
  }
};

export const streamConstructionResult = (): string => {
  const roll = rollDice(streamConstruction.sides);
  const command = getTableEntry(roll, streamConstruction);
  console.log(
    `streamConstruction roll: ${roll} is ${StreamConstruction[command]}`
  );
  switch (command) {
    case StreamConstruction.Bridged:
      return "A bridge crosses the stream. ";
    case StreamConstruction.Obstacle:
      return "";
  }
};

export const riverConstructionResult = (): string => {
  const roll = rollDice(riverConstruction.sides);
  const command = getTableEntry(roll, riverConstruction);
  console.log(
    `riverConstruction roll: ${roll} is ${RiverConstruction[command]}`
  );
  switch (command) {
    case RiverConstruction.Bridged:
      return "A bridge crosses the river. ";
    case RiverConstruction.Boat: {
      const result = "There is a boat. ";
      return result + riverBoatBankResult();
    }
    case RiverConstruction.Obstacle:
      return "";
  }
};

export const riverBoatBankResult = (): string => {
  const roll = rollDice(riverBoatBank.sides);
  const command = getTableEntry(roll, riverBoatBank);
  console.log(`riverBoatBank roll: ${roll} is ${RiverBoatBank[command]}`);
  switch (command) {
    case RiverBoatBank.ThisSide:
      return "The boat is on this bank of the river. ";
    case RiverBoatBank.OppositeSide:
      return "The boat is on the opposite bank of the river. ";
  }
};

export const chasmDepthResult = (): string => {
  const roll = rollDice(chasmDepth.sides);
  const command = getTableEntry(roll, chasmDepth);
  switch (command) {
    case ChasmDepth.Feet150:
      return "The chasm is 150' deep. ";
    case ChasmDepth.Feet160:
      return "The chasm is 160' deep. ";
    case ChasmDepth.Feet170:
      return "The chasm is 170' deep. ";
    case ChasmDepth.Feet180:
      return "The chasm is 180' deep. ";
    case ChasmDepth.Feet190:
      return "The chasm is 190' deep. ";
    case ChasmDepth.Feet200:
      return "The chasm is 200' deep. ";
  }
};

export const chasmConstructionResult = (): string => {
  const roll = rollDice(chasmConstruction.sides);
  const command = getTableEntry(roll, chasmConstruction);
  console.log(
    `chasmConstruction roll: ${roll} is ${ChasmConstruction[command]}`
  );
  switch (command) {
    case ChasmConstruction.Bridged:
      return "A bridge crosses the chasm. ";
    case ChasmConstruction.JumpingPlace: {
      const result = "There is a jumping place. ";
      return result + jumpingPlaceWidthResult();
    }
    case ChasmConstruction.Obstacle:
      return "It has no bridge, and is too wide to jump across. ";
  }
};

export const jumpingPlaceWidthResult = (): string => {
  const roll = rollDice(jumpingPlaceWidth.sides);
  const command = getTableEntry(roll, jumpingPlaceWidth);
  console.log(
    `jumpingPlaceWidth roll: ${roll} is ${JumpingPlaceWidth[command]}`
  );
  switch (command) {
    case JumpingPlaceWidth.FiveFeet:
      return "It is 5' wide. ";
    case JumpingPlaceWidth.TenFeet:
      return "It is 10' wide. ";
  }
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
