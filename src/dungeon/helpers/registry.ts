import type React from 'react';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../domain/outcome';

// Message services used by the registry
import { trickTrapMessages } from '../services/trickTrap';
import {
  resolveChamberDimensions,
  resolveChasmConstruction,
  resolveChasmDepth,
  resolveChute,
  resolveDoorBeyond,
  resolveDoorLocation,
  resolveDragonFiveOlder,
  resolveDragonFiveYounger,
  resolveDragonFourOlder,
  resolveDragonFourYounger,
  resolveDragonSix,
  resolveDragonThree,
  resolveEgress,
  resolveGalleryStairLocation,
  resolveGalleryStairOccurrence,
  resolveHuman,
  resolveJumpingPlaceWidth,
  resolveMonsterFive,
  resolveMonsterFour,
  resolveMonsterLevel,
  resolveMonsterOne,
  resolveMonsterSix,
  resolveMonsterThree,
  resolveMonsterTwo,
  resolveNumberOfExits,
  resolvePassageTurns,
  resolvePassageWidth,
  resolvePeriodicCheck,
  resolvePeriodicDoorOnly,
  resolveRiverBoatBank,
  resolveRiverConstruction,
  resolveRoomDimensions,
  resolveSidePassages,
  resolveSpecialPassage,
  resolveStairs,
  resolveStreamConstruction,
  resolveCircularContents,
  resolveUnusualShape,
  resolveUnusualSize,
  resolveWanderingWhereFrom,
} from '../domain/resolvers';
import { renderDetailTree, toCompactRender } from '../adapters/render';
import {
  applyResolvedOutcome,
  parseDoorChainSequence,
  readDoorChainExisting,
  readExitsContext,
} from '../helpers/outcomeTree';
import {
  circularShapePoolMessages,
  circularShapeMagicPoolMessages,
  transmuteTypeMessages,
  poolAlignmentMessages,
  transporterLocationMessages,
} from '../services/unusualShapeResult';

// Registry resolver type
type RegistryResolution = {
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
};

export type RegistryResolver = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
}) => RegistryResolution;

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

function fromOutcome(outcome: DungeonOutcomeNode): RegistryResolution {
  return { outcome, messages: renderDetailTree(outcome) };
}

function withoutOutcome(messages: DungeonRenderNode[]): RegistryResolution {
  return { messages };
}

export const TABLE_RESOLVERS: Record<TableId, RegistryResolver> = {
  sidePassages: ({ roll }) => fromOutcome(resolveSidePassages({ roll })),
  passageTurns: ({ roll }) => fromOutcome(resolvePassageTurns({ roll })),
  stairs: ({ roll }) => fromOutcome(resolveStairs({ roll })),
  doorLocation: ({ roll, context, id }) => {
    const existing = readDoorChainExisting(context);
    const sequence = parseDoorChainSequence(id, existing.length);
    return fromOutcome(resolveDoorLocation({ roll, existing, sequence }));
  },
  doorBeyond: ({ roll }) => fromOutcome(resolveDoorBeyond({ roll })),
  periodicCheck: ({ roll, context }) => {
    const c = (context || {}) as { kind?: string; level?: number };
    const level =
      c.kind === 'wandering' && typeof c.level === 'number' ? c.level : 1;
    return fromOutcome(resolvePeriodicCheck({ roll, level }));
  },
  periodicCheckDoorOnly: ({ roll, context, id }) => {
    const existing = readDoorChainExisting(context);
    const sequence = parseDoorChainSequence(id, existing.length);
    return fromOutcome(resolvePeriodicDoorOnly({ roll, existing, sequence }));
  },
  wanderingWhereFrom: ({ roll }) =>
    fromOutcome(resolveWanderingWhereFrom({ roll })),
  monsterLevel: ({ roll, id, context }) => {
    const dungeonLevel = readDungeonLevel(context, id, 1);
    return fromOutcome(resolveMonsterLevel({ roll, dungeonLevel }));
  },
  monsterOne: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterOne', 1);
    return fromOutcome(resolveMonsterOne({ roll, dungeonLevel }));
  },
  monsterTwo: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterTwo', 1);
    return fromOutcome(resolveMonsterTwo({ roll, dungeonLevel }));
  },
  monsterThree: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterThree', 1);
    return fromOutcome(resolveMonsterThree({ roll, dungeonLevel }));
  },
  monsterFour: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterFour', 1);
    return fromOutcome(resolveMonsterFour({ roll, dungeonLevel }));
  },
  monsterFive: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterFive', 1);
    return fromOutcome(resolveMonsterFive({ roll, dungeonLevel }));
  },
  monsterSix: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterSix', 1);
    return fromOutcome(resolveMonsterSix({ roll, dungeonLevel }));
  },
  dragonThree: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonThree', 3);
    return fromOutcome(resolveDragonThree({ roll, dungeonLevel }));
  },
  dragonFourYounger: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFourYounger', 4);
    return fromOutcome(resolveDragonFourYounger({ roll, dungeonLevel }));
  },
  dragonFourOlder: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFourOlder', 4);
    return fromOutcome(resolveDragonFourOlder({ roll, dungeonLevel }));
  },
  dragonFiveYounger: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFiveYounger', 5);
    return fromOutcome(resolveDragonFiveYounger({ roll, dungeonLevel }));
  },
  dragonFiveOlder: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFiveOlder', 5);
    return fromOutcome(resolveDragonFiveOlder({ roll, dungeonLevel }));
  },
  dragonSix: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonSix', 6);
    return fromOutcome(resolveDragonSix({ roll, dungeonLevel }));
  },
  human: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'human', 1);
    return fromOutcome(resolveHuman({ roll, dungeonLevel }));
  },
  galleryStairLocation: ({ roll }) =>
    fromOutcome(resolveGalleryStairLocation({ roll })),
  galleryStairOccurrence: ({ roll }) =>
    fromOutcome(resolveGalleryStairOccurrence({ roll })),
  passageWidth: ({ roll }) => fromOutcome(resolvePassageWidth({ roll })),
  specialPassage: ({ roll }) => fromOutcome(resolveSpecialPassage({ roll })),
  roomDimensions: ({ roll }) => fromOutcome(resolveRoomDimensions({ roll })),
  chamberDimensions: ({ roll }) =>
    fromOutcome(resolveChamberDimensions({ roll })),
  streamConstruction: ({ roll }) =>
    fromOutcome(resolveStreamConstruction({ roll })),
  riverConstruction: ({ roll }) =>
    fromOutcome(resolveRiverConstruction({ roll })),
  riverBoatBank: ({ roll }) => fromOutcome(resolveRiverBoatBank({ roll })),
  chasmDepth: ({ roll }) => fromOutcome(resolveChasmDepth({ roll })),
  chasmConstruction: ({ roll }) =>
    fromOutcome(resolveChasmConstruction({ roll })),
  jumpingPlaceWidth: ({ roll }) =>
    fromOutcome(resolveJumpingPlaceWidth({ roll })),
  unusualShape: ({ roll }) => fromOutcome(resolveUnusualShape({ roll })),
  unusualSize: ({ roll, context }) => {
    const extra = context && context.kind === 'unusualSize' ? context.extra : 0;
    return fromOutcome(resolveUnusualSize({ roll, extra }));
  },
  circularContents: ({ roll }) =>
    fromOutcome(resolveCircularContents({ roll })),
  circularShapePool: ({ roll }) =>
    withoutOutcome(
      circularShapePoolMessages({ roll, detailMode: true }).messages
    ),
  circularShapeMagicPool: ({ roll }) =>
    withoutOutcome(
      circularShapeMagicPoolMessages({ roll, detailMode: true }).messages
    ),
  transmuteType: ({ roll }) =>
    withoutOutcome(transmuteTypeMessages({ roll }).messages),
  poolAlignment: ({ roll }) =>
    withoutOutcome(poolAlignmentMessages({ roll }).messages),
  transporterLocation: ({ roll }) =>
    withoutOutcome(transporterLocationMessages({ roll }).messages),
  trickTrap: ({ roll }) => withoutOutcome(trickTrapMessages({ roll }).messages),
  chute: ({ roll }) => fromOutcome(resolveChute({ roll })),
  egress: ({ roll, id }) => {
    const key = (id.split(':')[1] as 'one' | 'two' | 'three') || 'one';
    return fromOutcome(resolveEgress({ which: key, roll }));
  },
  numberOfExits: ({ roll, context }) => {
    const ctx = readExitsContext(context);
    if (!ctx) {
      return fromOutcome(
        resolveNumberOfExits({ roll, length: 10, width: 10, isRoom: false })
      );
    }
    return fromOutcome(
      resolveNumberOfExits({
        roll,
        length: ctx.length,
        width: ctx.width,
        isRoom: ctx.isRoom,
      })
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

export type FeedLike = {
  id: string;
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
  renderCache?: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
};

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

  const result = resolver({
    roll: usedRoll,
    id: tp.id,
    context: tp.context,
  });

  if (setFeed) {
    setFeed((prev) =>
      prev.map((fi) =>
        fi.id !== feedItemId
          ? fi
          : (() => {
              const existingOutcome = fi.outcome;
              if (existingOutcome && result.outcome) {
                const updatedOutcome = applyResolvedOutcome(
                  existingOutcome,
                  tp.id,
                  result.outcome
                );
                const detailRender = renderDetailTree(updatedOutcome);
                const compactRender = toCompactRender(updatedOutcome);
                return {
                  ...fi,
                  outcome: updatedOutcome,
                  messages: detailRender,
                  renderCache: {
                    ...fi.renderCache,
                    detail: detailRender,
                    compact: compactRender,
                  },
                } as T;
              }
              return updateResolvedBlock(
                fi,
                feedItemId,
                tp.id,
                result.messages,
                heading
              );
            })()
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
