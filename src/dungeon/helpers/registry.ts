import type React from 'react';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';

// Message services used by the registry
import { sidePassageMessages } from '../services/sidePassage';
import { passageTurnMessages } from '../services/passageTurn';
import { stairsMessages } from '../services/stairsResult';
import { doorLocationMessages } from '../services/closedDoorResult';
import { periodicDoorOnlyMessages } from '../services/periodicDoorOnly';
import { wanderingWhereFromMessages } from '../services/wanderingWhereFrom';
import {
  galleryStairLocationMessages,
  galleryStairOccurrenceMessages,
  streamConstructionMessages,
  riverConstructionMessages,
  riverBoatBankMessages,
  chasmDepthMessages,
  chasmConstructionMessages,
  jumpingPlaceWidthMessages,
} from '../services/specialPassage';
import { unusualSizeMessages } from '../services/unusualSizeResult';
import { trickTrapMessages } from '../services/trickTrap';
import {
  resolveEgress,
  resolveChute,
  resolveNumberOfExits,
  resolveUnusualShape,
  resolvePassageWidth,
  resolveSpecialPassage,
  resolveDoorBeyond,
  resolvePeriodicCheck,
  resolveRoomDimensions,
  resolveChamberDimensions,
  resolveMonsterLevel,
  resolveMonsterOne,
  resolveMonsterTwo,
  resolveMonsterThree,
  resolveMonsterFour,
  resolveMonsterFive,
  resolveMonsterSix,
  resolveDragonThree,
  resolveDragonFourYounger,
  resolveDragonFourOlder,
  resolveDragonFiveYounger,
  resolveDragonFiveOlder,
  resolveDragonSix,
  resolveHuman,
} from '../domain/resolvers';
import { toDetailRender } from '../adapters/render';
import {
  circularContentsMessages,
  circularShapePoolMessages,
  circularShapeMagicPoolMessages,
  transmuteTypeMessages,
  poolAlignmentMessages,
  transporterLocationMessages,
} from '../services/unusualShapeResult';

// Registry resolver type
export type RegistryResolver = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
}) => DungeonRenderNode[];

const TABLE_ID_LIST = [
  'sidePassages',
  'passageTurns',
  'stairs',
  'doorLocation',
  'doorBeyond',
  'periodicCheck',
  'periodicCheckDoorOnly',
  'wanderingWhereFrom',
  'monsterLevel',
  'monsterOne',
  'monsterTwo',
  'monsterThree',
  'monsterFour',
  'monsterFive',
  'monsterSix',
  'dragonThree',
  'dragonFourYounger',
  'dragonFourOlder',
  'dragonFiveYounger',
  'dragonFiveOlder',
  'dragonSix',
  'human',
  'galleryStairLocation',
  'galleryStairOccurrence',
  'passageWidth',
  'specialPassage',
  'roomDimensions',
  'chamberDimensions',
  'streamConstruction',
  'riverConstruction',
  'riverBoatBank',
  'chasmDepth',
  'chasmConstruction',
  'jumpingPlaceWidth',
  'unusualShape',
  'unusualSize',
  'trickTrap',
  'circularContents',
  'circularShapePool',
  'circularShapeMagicPool',
  'transmuteType',
  'poolAlignment',
  'transporterLocation',
  'chute',
  'egress',
  'numberOfExits',
] as const;

function isTableId(x: string): x is TableId {
  return (TABLE_ID_LIST as readonly string[]).includes(x);
}

export type TableId = typeof TABLE_ID_LIST[number];

export const TABLE_HEADINGS: Record<TableId, string> = {
  sidePassages: 'Side Passages',
  passageTurns: 'Passage Turns',
  stairs: 'Stairs',
  doorLocation: 'Door Location',
  doorBeyond: 'Door',
  periodicCheck: 'Passage',
  periodicCheckDoorOnly: 'Periodic Check (doors only)',
  wanderingWhereFrom: 'Where From',
  monsterLevel: 'Monster Level',
  monsterOne: 'Monster (Level 1)',
  monsterTwo: 'Monster (Level 2)',
  monsterThree: 'Monster (Level 3)',
  monsterFour: 'Monster (Level 4)',
  monsterFive: 'Monster (Level 5)',
  monsterSix: 'Monster (Level 6)',
  dragonThree: 'Dragon (Level 3)',
  dragonFourYounger: 'Dragon (Younger)',
  dragonFourOlder: 'Dragon (Older)',
  dragonFiveYounger: 'Dragon (Younger)',
  dragonFiveOlder: 'Dragon (Older)',
  dragonSix: 'Dragon',
  human: 'Human Subtable',
  galleryStairLocation: 'Gallery Stair Location',
  galleryStairOccurrence: 'Gallery Stair Occurrence',
  passageWidth: 'Passage Width',
  specialPassage: 'Special Passage',
  roomDimensions: 'Room Dimensions',
  chamberDimensions: 'Chamber Dimensions',
  streamConstruction: 'Stream Construction',
  riverConstruction: 'River Construction',
  riverBoatBank: 'Boat Bank',
  chasmDepth: 'Chasm Depth',
  chasmConstruction: 'Chasm Construction',
  jumpingPlaceWidth: 'Jumping Place Width',
  unusualShape: 'Unusual Shape',
  unusualSize: 'Unusual Size',
  trickTrap: 'Trick / Trap',
  circularContents: 'Circular Contents',
  circularShapePool: 'Pool',
  circularShapeMagicPool: 'Magic Pool Effect',
  transmuteType: 'Transmutation Type',
  poolAlignment: 'Pool Alignment',
  transporterLocation: 'Transporter Location',
  chute: 'Chute',
  egress: 'Egress',
  numberOfExits: 'Exits',
};

export const TABLE_RESOLVERS: Record<TableId, RegistryResolver> = {
  sidePassages: ({ roll }) =>
    sidePassageMessages({ roll, detailMode: true }).messages,
  passageTurns: ({ roll }) =>
    passageTurnMessages({ roll, detailMode: true }).messages,
  stairs: ({ roll }) => stairsMessages({ roll, detailMode: true }).messages,
  doorLocation: ({ roll, context }) =>
    doorLocationMessages({ roll, detailMode: true, context }).messages,
  doorBeyond: ({ roll }) => toDetailRender(resolveDoorBeyond({ roll })),
  periodicCheck: ({ roll, context }) => {
    const c = (context || {}) as { kind?: string; level?: number };
    const level =
      c.kind === 'wandering' && typeof c.level === 'number' ? c.level : 1;
    return toDetailRender(resolvePeriodicCheck({ roll, level }));
  },
  periodicCheckDoorOnly: ({ roll, context }) =>
    periodicDoorOnlyMessages({ roll, detailMode: true, context }).messages,
  wanderingWhereFrom: ({ roll, context }) =>
    wanderingWhereFromMessages({ roll, detailMode: true, context }).messages,
  monsterLevel: ({ roll, id, context }) => {
    const dungeonLevel = readDungeonLevel(context, id, 1);
    return toDetailRender(resolveMonsterLevel({ roll, dungeonLevel }));
  },
  monsterOne: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterOne', 1);
    return toDetailRender(resolveMonsterOne({ roll, dungeonLevel }));
  },
  monsterTwo: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterTwo', 1);
    return toDetailRender(resolveMonsterTwo({ roll, dungeonLevel }));
  },
  monsterThree: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterThree', 1);
    return toDetailRender(resolveMonsterThree({ roll, dungeonLevel }));
  },
  monsterFour: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterFour', 1);
    return toDetailRender(resolveMonsterFour({ roll, dungeonLevel }));
  },
  monsterFive: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterFive', 1);
    return toDetailRender(resolveMonsterFive({ roll, dungeonLevel }));
  },
  monsterSix: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterSix', 1);
    return toDetailRender(resolveMonsterSix({ roll, dungeonLevel }));
  },
  dragonThree: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonThree', 3);
    return toDetailRender(resolveDragonThree({ roll, dungeonLevel }));
  },
  dragonFourYounger: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFourYounger', 4);
    return toDetailRender(resolveDragonFourYounger({ roll, dungeonLevel }));
  },
  dragonFourOlder: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFourOlder', 4);
    return toDetailRender(resolveDragonFourOlder({ roll, dungeonLevel }));
  },
  dragonFiveYounger: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFiveYounger', 5);
    return toDetailRender(resolveDragonFiveYounger({ roll, dungeonLevel }));
  },
  dragonFiveOlder: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFiveOlder', 5);
    return toDetailRender(resolveDragonFiveOlder({ roll, dungeonLevel }));
  },
  dragonSix: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonSix', 6);
    return toDetailRender(resolveDragonSix({ roll, dungeonLevel }));
  },
  human: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'human', 1);
    return toDetailRender(resolveHuman({ roll, dungeonLevel }));
  },
  galleryStairLocation: ({ roll }) =>
    galleryStairLocationMessages({ roll, detailMode: true }).messages,
  galleryStairOccurrence: ({ roll }) =>
    galleryStairOccurrenceMessages({ roll }).messages,
  passageWidth: ({ roll }) => toDetailRender(resolvePassageWidth({ roll })),
  specialPassage: ({ roll }) => toDetailRender(resolveSpecialPassage({ roll })),
  roomDimensions: ({ roll }) => toDetailRender(resolveRoomDimensions({ roll })),
  chamberDimensions: ({ roll }) =>
    toDetailRender(resolveChamberDimensions({ roll })),
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
  unusualShape: ({ roll }) => toDetailRender(resolveUnusualShape({ roll })),
  unusualSize: ({ roll, id }) => {
    // Parse seq/extra from id if present: unusualSize:seq:extra
    let seq = 0;
    let extra = 0;
    const parts = id.split(':');
    if (parts.length >= 2) seq = Number(parts[1]) || 0;
    if (parts.length >= 3) extra = Number(parts[2]) || 0;
    return unusualSizeMessages({ roll, detailMode: true, seq, extra }).messages;
  },
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
  trickTrap: ({ roll }) => trickTrapMessages({ roll }).messages,
  chute: ({ roll }) => toDetailRender(resolveChute({ roll })),
  egress: ({ roll, id }) => {
    const key = (id.split(':')[1] as 'one' | 'two' | 'three') || 'one';
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
    const length = typeof c.length === 'number' ? c.length : 10;
    const width = typeof c.width === 'number' ? c.width : 10;
    const isRoom = typeof c.isRoom === 'boolean' ? c.isRoom : false;
    return toDetailRender(
      resolveNumberOfExits({ roll, length, width, isRoom })
    );
  },
};

function readDungeonLevel(
  context: TableContext | undefined,
  id: string,
  fallback: number
): number {
  if (context && context.kind === 'wandering') {
    return context.level;
  }
  const parts = id.split(':');
  if (parts.length >= 2) {
    const parsed = Number(parts[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

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
    if (node.kind === 'table-preview' && node.id === tableId) {
      newMessages.push(node);
      skippingOld = true;
      for (const m of messages) newMessages.push(m);
    } else {
      if (skippingOld) {
        if (node.kind === 'table-preview' && node.id !== tableId) {
          skippingOld = false;
        } else if (node.kind === 'heading' && node.text !== headingText) {
          skippingOld = false;
        } else if (node.kind === 'heading' && node.text === headingText) {
          // keep skipping
        } else if (node.kind === 'bullet-list' || node.kind === 'paragraph') {
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
  const base = String(tp.id.split(':')[0] ?? '');
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
