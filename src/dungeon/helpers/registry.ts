import type React from "react";
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from "../../types/dungeon";

// Message services used by the registry
import { sidePassageMessages } from "../services/sidePassage";
import { passageTurnMessages } from "../services/passageTurn";
import { stairsMessages } from "../services/stairsResult";
import { doorLocationMessages } from "../services/closedDoorResult";
import { periodicDoorOnlyMessages } from "../services/periodicDoorOnly";
import { wanderingWhereFromMessages } from "../services/wanderingWhereFrom";
import {
  monsterLevelMessages,
  monsterOneMessages,
  monsterTwoMessages,
  monsterThreeMessages,
  monsterFourMessages,
  monsterFiveMessages,
  monsterSixMessages,
  dragonThreeMessages,
  dragonFourYoungerMessages,
  dragonFourOlderMessages,
  dragonFiveYoungerMessages,
  dragonFiveOlderMessages,
  dragonSixMessages,
  humanMessages,
} from "../services/monsterLevelMessages";
import {
  galleryStairLocationMessages,
  galleryStairOccurrenceMessages,
  streamConstructionMessages,
  riverConstructionMessages,
  riverBoatBankMessages,
  chasmDepthMessages,
  chasmConstructionMessages,
  jumpingPlaceWidthMessages,
} from "../services/specialPassage";
import {
  resolveEgress,
  resolveChute,
  resolveNumberOfExits,
} from "../domain/resolvers";
import { toDetailRender } from "../adapters/render";
import {
  circularContentsMessages,
  circularShapePoolMessages,
  circularShapeMagicPoolMessages,
  transmuteTypeMessages,
  poolAlignmentMessages,
  transporterLocationMessages,
} from "../services/unusualShapeResult";

// Registry resolver type
export type RegistryResolver = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
}) => DungeonRenderNode[];

const TABLE_ID_LIST = [
  "sidePassages",
  "passageTurns",
  "stairs",
  "doorLocation",
  "periodicCheckDoorOnly",
  "wanderingWhereFrom",
  "monsterLevel",
  "monsterOne",
  "monsterTwo",
  "monsterThree",
  "monsterFour",
  "monsterFive",
  "monsterSix",
  "dragonThree",
  "dragonFourYounger",
  "dragonFourOlder",
  "dragonFiveYounger",
  "dragonFiveOlder",
  "dragonSix",
  "human",
  "galleryStairLocation",
  "galleryStairOccurrence",
  "streamConstruction",
  "riverConstruction",
  "riverBoatBank",
  "chasmDepth",
  "chasmConstruction",
  "jumpingPlaceWidth",
  "circularContents",
  "circularShapePool",
  "circularShapeMagicPool",
  "transmuteType",
  "poolAlignment",
  "transporterLocation",
  "chute",
  "egress",
  "numberOfExits",
] as const;

function isTableId(x: string): x is TableId {
  return (TABLE_ID_LIST as readonly string[]).includes(x);
}

export type TableId = typeof TABLE_ID_LIST[number];

export const TABLE_HEADINGS: Record<TableId, string> = {
  sidePassages: "Side Passages",
  passageTurns: "Passage Turns",
  stairs: "Stairs",
  doorLocation: "Door Location",
  periodicCheckDoorOnly: "Periodic Check (doors only)",
  wanderingWhereFrom: "Where From",
  monsterLevel: "Monster Level",
  monsterOne: "Monster (Level 1)",
  monsterTwo: "Monster (Level 2)",
  monsterThree: "Monster (Level 3)",
  monsterFour: "Monster (Level 4)",
  monsterFive: "Monster (Level 5)",
  monsterSix: "Monster (Level 6)",
  dragonThree: "Dragon (Level 3)",
  dragonFourYounger: "Dragon (Younger)",
  dragonFourOlder: "Dragon (Older)",
  dragonFiveYounger: "Dragon (Younger)",
  dragonFiveOlder: "Dragon (Older)",
  dragonSix: "Dragon",
  human: "Human Subtable",
  galleryStairLocation: "Gallery Stair Location",
  galleryStairOccurrence: "Gallery Stair Occurrence",
  streamConstruction: "Stream Construction",
  riverConstruction: "River Construction",
  riverBoatBank: "Boat Bank",
  chasmDepth: "Chasm Depth",
  chasmConstruction: "Chasm Construction",
  jumpingPlaceWidth: "Jumping Place Width",
  circularContents: "Circular Contents",
  circularShapePool: "Pool",
  circularShapeMagicPool: "Magic Pool Effect",
  transmuteType: "Transmutation Type",
  poolAlignment: "Pool Alignment",
  transporterLocation: "Transporter Location",
  chute: "Chute",
  egress: "Egress",
  numberOfExits: "Exits",
};

export const TABLE_RESOLVERS: Record<TableId, RegistryResolver> = {
  sidePassages: ({ roll }) =>
    sidePassageMessages({ roll, detailMode: true }).messages,
  passageTurns: ({ roll }) =>
    passageTurnMessages({ roll, detailMode: true }).messages,
  stairs: ({ roll }) => stairsMessages({ roll, detailMode: true }).messages,
  doorLocation: ({ roll, context }) =>
    doorLocationMessages({ roll, detailMode: true, context }).messages,
  periodicCheckDoorOnly: ({ roll, context }) =>
    periodicDoorOnlyMessages({ roll, detailMode: true, context }).messages,
  wanderingWhereFrom: ({ roll, context }) =>
    wanderingWhereFromMessages({ roll, detailMode: true, context }).messages,
  monsterLevel: ({ roll, id, context }) =>
    monsterLevelMessages({ id, roll, detailMode: true, context }).messages,
  monsterOne: ({ roll, context }) =>
    monsterOneMessages({ roll, detailMode: true, context }).messages,
  monsterTwo: ({ roll, context }) =>
    monsterTwoMessages({ roll, detailMode: true, context }).messages,
  monsterThree: ({ roll, context }) =>
    monsterThreeMessages({ roll, detailMode: true, context }).messages,
  monsterFour: ({ roll, context }) =>
    monsterFourMessages({ roll, detailMode: true, context }).messages,
  monsterFive: ({ roll, context }) =>
    monsterFiveMessages({ roll, detailMode: true, context }).messages,
  monsterSix: ({ roll, context }) =>
    monsterSixMessages({ roll, detailMode: true, context }).messages,
  dragonThree: ({ roll, context }) =>
    dragonThreeMessages({ roll, detailMode: true, context }).messages,
  dragonFourYounger: ({ roll, context }) =>
    dragonFourYoungerMessages({ roll, detailMode: true, context }).messages,
  dragonFourOlder: ({ roll, context }) =>
    dragonFourOlderMessages({ roll, detailMode: true, context }).messages,
  dragonFiveYounger: ({ roll, context }) =>
    dragonFiveYoungerMessages({ roll, detailMode: true, context }).messages,
  dragonFiveOlder: ({ roll, context }) =>
    dragonFiveOlderMessages({ roll, detailMode: true, context }).messages,
  dragonSix: ({ roll, context }) =>
    dragonSixMessages({ roll, detailMode: true, context }).messages,
  human: ({ roll, context }) =>
    humanMessages({ roll, detailMode: true, context }).messages,
  galleryStairLocation: ({ roll }) =>
    galleryStairLocationMessages({ roll, detailMode: true }).messages,
  galleryStairOccurrence: ({ roll }) =>
    galleryStairOccurrenceMessages({ roll }).messages,
  streamConstruction: ({ roll }) =>
    streamConstructionMessages({ roll, detailMode: true }).messages,
  riverConstruction: ({ roll }) =>
    riverConstructionMessages({ roll, detailMode: true }).messages,
  riverBoatBank: ({ roll }) => riverBoatBankMessages({ roll }).messages,
  chasmDepth: ({ roll }) =>
    chasmDepthMessages({ roll, detailMode: true }).messages,
  chasmConstruction: ({ roll }) =>
    chasmConstructionMessages({ roll, detailMode: true }).messages,
  jumpingPlaceWidth: ({ roll }) => jumpingPlaceWidthMessages({ roll }).messages,
  circularContents: ({ roll }) =>
    circularContentsMessages({ roll, detailMode: true }).messages,
  circularShapePool: ({ roll }) =>
    circularShapePoolMessages({ roll, detailMode: true }).messages,
  circularShapeMagicPool: ({ roll }) =>
    circularShapeMagicPoolMessages({ roll, detailMode: true }).messages,
  transmuteType: ({ roll }) => transmuteTypeMessages({ roll }).messages,
  poolAlignment: ({ roll }) => poolAlignmentMessages({ roll }).messages,
  transporterLocation: ({ roll }) =>
    transporterLocationMessages({ roll }).messages,
  chute: ({ roll }) => toDetailRender(resolveChute({ roll })),
  egress: ({ roll, id }) => {
    const key = (id.split(":")[1] as "one" | "two" | "three") || "one";
    return toDetailRender(resolveEgress({ which: key, roll }));
  },
  numberOfExits: ({ roll, context }) => {
    const c =
      (context as {
        kind?: string;
        length?: number;
        width?: number;
        isRoom?: boolean;
      }) || {};
    const length = typeof c.length === "number" ? c.length : 10;
    const width = typeof c.width === "number" ? c.width : 10;
    const isRoom = typeof c.isRoom === "boolean" ? c.isRoom : false;
    return toDetailRender(
      resolveNumberOfExits({ roll, length, width, isRoom })
    );
  },
};

export type FeedLike = { id: string; messages: DungeonRenderNode[] };

export function updateResolvedBlock<T extends FeedLike>(
  fi: T,
  feedItemId: string,
  tableId: string,
  messages: DungeonRenderNode[],
  headingText: string
): T {
  if (fi.id !== feedItemId) return fi;
  const newMessages: DungeonRenderNode[] = [];
  let skippingOld = false;
  for (const node of fi.messages) {
    if (node.kind === "table-preview" && node.id === tableId) {
      newMessages.push(node);
      skippingOld = true;
      for (const m of messages) newMessages.push(m);
    } else {
      if (skippingOld) {
        if (node.kind === "table-preview" && node.id !== tableId) {
          skippingOld = false;
        } else if (node.kind === "heading" && node.text !== headingText) {
          skippingOld = false;
        } else if (node.kind === "heading" && node.text === headingText) {
          // keep skipping
        } else if (node.kind === "bullet-list" || node.kind === "paragraph") {
          // skip
        } else {
          skippingOld = false;
        }
        if (!skippingOld) newMessages.push(node);
      } else {
        newMessages.push(node);
      }
    }
  }
  return { ...fi, messages: newMessages };
}

export function resolveViaRegistry<T extends FeedLike>(
  tp: DungeonTablePreview,
  feedItemId: string,
  usedRoll: number | undefined,
  setFeed?: React.Dispatch<React.SetStateAction<T[]>>,
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
): boolean {
  const base = String(tp.id.split(":")[0] ?? "");
  if (!isTableId(base)) return false;

  const resolver = TABLE_RESOLVERS[base];
  const heading = TABLE_HEADINGS[base];

  const resolvedMsgs = resolver({
    roll: usedRoll,
    id: tp.id,
    context: tp.context,
  });

  if (setFeed) {
    setFeed((prev) =>
      prev.map((fi) =>
        updateResolvedBlock(fi, feedItemId, tp.id, resolvedMsgs, heading)
      )
    );
  }
  if (setCollapsed) {
    setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (setResolved) {
    setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  return true;
}
