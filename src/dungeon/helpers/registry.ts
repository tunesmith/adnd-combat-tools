import type React from 'react';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
} from '../domain/outcome';

// Message services used by the registry
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
  resolveCircularPool,
  resolveCircularMagicPool,
  resolveTransmuteType,
  resolvePoolAlignment,
  resolveTransporterLocation,
  resolveTrickTrap,
  resolveIllusoryWallNature,
  resolveUnusualShape,
  resolveUnusualSize,
  resolveWanderingWhereFrom,
} from '../domain/resolvers';
import { renderDetailTree } from '../adapters/render';
import {
  applyResolvedOutcome,
  deriveDoorChainContext,
  normalizeOutcomeTree,
  parseDoorChainSequence,
  readExitsContext,
} from '../helpers/outcomeTree';
import {
  createOutcomeRenderSnapshot,
  type OutcomeRenderSnapshot,
} from './outcomePipeline';

// Registry resolver type
type RegistryResolution = {
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
};

export type RegistryResolver = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
  doorChain?: {
    existing: DoorChainLaterality[];
    sequence: number;
  };
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
  'illusoryWallNature',
  'circularContents',
  'circularPool',
  'circularMagicPool',
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
  illusoryWallNature: 'What Lies Beyond',
  circularContents: 'Circular Contents',
  circularPool: 'Pool',
  circularMagicPool: 'Magic Pool Effect',
  transmuteType: 'Transmutation Type',
  poolAlignment: 'Pool Alignment',
  transporterLocation: 'Transporter Location',
  chute: 'Chute',
  egress: 'Egress',
  numberOfExits: 'Exits',
};

function fromOutcome(outcome: DungeonOutcomeNode): RegistryResolution {
  const normalized = normalizeOutcomeTree(outcome);
  return { outcome: normalized, messages: renderDetailTree(normalized) };
}

export const TABLE_RESOLVERS: Record<TableId, RegistryResolver> = {
  sidePassages: ({ roll }) => fromOutcome(resolveSidePassages({ roll })),
  passageTurns: ({ roll }) => fromOutcome(resolvePassageTurns({ roll })),
  stairs: ({ roll }) => fromOutcome(resolveStairs({ roll })),
  doorLocation: ({ roll, doorChain, id }) => {
    const existing = doorChain?.existing ?? [];
    const sequence =
      doorChain?.sequence ?? parseDoorChainSequence(id, existing.length);
    return fromOutcome(resolveDoorLocation({ roll, existing, sequence }));
  },
  doorBeyond: ({ roll }) => fromOutcome(resolveDoorBeyond({ roll })),
  periodicCheck: ({ roll, context }) => {
    const c = (context || {}) as { kind?: string; level?: number };
    const level =
      c.kind === 'wandering' && typeof c.level === 'number' ? c.level : 1;
    return fromOutcome(resolvePeriodicCheck({ roll, level }));
  },
  periodicCheckDoorOnly: ({ roll, doorChain, id }) => {
    const existing = doorChain?.existing ?? [];
    const sequence =
      doorChain?.sequence ?? parseDoorChainSequence(id, existing.length);
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
  circularPool: ({ roll }) => fromOutcome(resolveCircularPool({ roll })),
  circularMagicPool: ({ roll }) =>
    fromOutcome(resolveCircularMagicPool({ roll })),
  transmuteType: ({ roll }) => fromOutcome(resolveTransmuteType({ roll })),
  poolAlignment: ({ roll }) => fromOutcome(resolvePoolAlignment({ roll })),
  transporterLocation: ({ roll }) =>
    fromOutcome(resolveTransporterLocation({ roll })),
  trickTrap: ({ roll }) => fromOutcome(resolveTrickTrap({ roll })),
  illusoryWallNature: ({ roll }) =>
    fromOutcome(resolveIllusoryWallNature({ roll })),
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

export function resolveRegistryTable(opts: {
  tableId: string;
  roll?: number;
  context?: TableContext;
  outcome?: DungeonOutcomeNode;
  targetId?: string;
}): RegistryResolution | undefined {
  const base = String(opts.tableId.split(':')[0] ?? '');
  if (!isTableId(base)) return undefined;
  const doorChain =
    (base === 'doorLocation' || base === 'periodicCheckDoorOnly') &&
    opts.outcome &&
    opts.targetId
      ? deriveDoorChainContext(opts.outcome, opts.targetId)
      : undefined;
  const resolver = TABLE_RESOLVERS[base];
  return resolver({
    roll: opts.roll,
    id: opts.tableId,
    context: opts.context,
    doorChain,
  });
}

export type OutcomeRollApplication = {
  outcome: DungeonOutcomeNode;
  snapshot: OutcomeRenderSnapshot;
};

export function applyOutcomeRoll(opts: {
  outcome: DungeonOutcomeNode;
  tableId: string;
  targetId?: string;
  roll?: number;
  context?: TableContext;
}): OutcomeRollApplication | undefined {
  const normalizedExisting = normalizeOutcomeTree(opts.outcome);
  const targetId = opts.targetId ?? opts.tableId;
  const resolution = resolveRegistryTable({
    tableId: opts.tableId,
    roll: opts.roll,
    context: opts.context,
    outcome: normalizedExisting,
    targetId,
  });
  if (!resolution || !resolution.outcome) return undefined;
  const normalizedResolution = normalizeOutcomeTree(
    resolution.outcome,
    targetId
  );
  const applied = applyResolvedOutcome(
    normalizedExisting,
    targetId,
    normalizedResolution
  );
  const normalizedApplied = normalizeOutcomeTree(applied);
  const snapshot = createOutcomeRenderSnapshot(normalizedApplied);
  if (!snapshot) return undefined;
  return { outcome: normalizedApplied, snapshot };
}

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
  pendingCount?: number;
};

export function updateResolvedBlock<T extends FeedLike>(
  fi: T,
  feedItemId: string,
  targetId: string,
  messages: DungeonRenderNode[],
  headingText: string
): T {
  if (fi.id !== feedItemId) return fi;
  const newMessages: DungeonRenderNode[] = [];
  let skippingOld = false;
  for (const node of fi.messages) {
    const nodeTargetId =
      node.kind === 'table-preview' ? node.targetId ?? node.id : undefined;
    if (node.kind === 'table-preview' && nodeTargetId === targetId) {
      newMessages.push(node);
      skippingOld = true;
      for (const m of messages) newMessages.push(m);
    } else {
      if (skippingOld) {
        if (node.kind === 'table-preview') {
          const compareId = node.targetId ?? node.id;
          if (compareId !== targetId) {
            skippingOld = false;
          }
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

  const heading = TABLE_HEADINGS[base];
  const targetKey = tp.targetId ?? tp.id;
  const keyVariants = collectKeyVariants(targetKey, tp.id);
  let resolved = false;

  if (setFeed) {
    setFeed((prev) =>
      prev.map((fi) =>
        fi.id !== feedItemId
          ? fi
          : (() => {
              const existingOutcome = fi.outcome;
              if (existingOutcome) {
                const applied = applyOutcomeRoll({
                  outcome: existingOutcome,
                  tableId: tp.id,
                  targetId: targetKey,
                  roll: usedRoll,
                  context: tp.context,
                });
                if (applied) {
                  resolved = true;
                  const { outcome, snapshot } = applied;
                  if (setCollapsed) {
                    setCollapsed((prev) => {
                      const next = { ...prev };
                      for (const k of keyVariants)
                        next[`${feedItemId}:${k}`] = true;
                      return next;
                    });
                  }
                  if (setResolved) {
                    setResolved((prev) => {
                      const next = { ...prev };
                      for (const k of keyVariants)
                        next[`${feedItemId}:${k}`] = true;
                      return next;
                    });
                  }
                  return {
                    ...fi,
                    outcome,
                    pendingCount: snapshot.pendingCount,
                    messages: snapshot.detail,
                    renderCache: {
                      ...fi.renderCache,
                      detail: snapshot.detail,
                      compact: snapshot.compact,
                    },
                  } as T;
                }
              }
              const tableResult = resolveRegistryTable({
                tableId: tp.id,
                roll: usedRoll,
                context: tp.context,
                outcome: fi.outcome,
                targetId: targetKey,
              });
              if (!tableResult) return fi;
              resolved = true;
              if (setCollapsed) {
                setCollapsed((prev) => {
                  const next = { ...prev };
                  for (const k of keyVariants)
                    next[`${feedItemId}:${k}`] = true;
                  return next;
                });
              }
              if (setResolved) {
                setResolved((prev) => {
                  const next = { ...prev };
                  for (const k of keyVariants)
                    next[`${feedItemId}:${k}`] = true;
                  return next;
                });
              }
              return updateResolvedBlock(
                fi,
                feedItemId,
                targetKey,
                tableResult.messages,
                heading
              );
            })()
      )
    );
  }
  if (!resolved) return false;
  if (setCollapsed) {
    setCollapsed((prev) => {
      const next = { ...prev };
      for (const k of keyVariants) next[`${feedItemId}:${k}`] = true;
      return next;
    });
  }
  if (setResolved) {
    setResolved((prev) => {
      const next = { ...prev };
      for (const k of keyVariants) next[`${feedItemId}:${k}`] = true;
      return next;
    });
  }
  return true;
}

function collectKeyVariants(primary: string, fallbackId?: string): string[] {
  const variants = new Set<string>();
  const add = (k?: string) => {
    if (!k || k.length === 0) return;
    variants.add(k);
    const norm = normalizeKey(k);
    if (norm) variants.add(norm);
  };
  add(primary);
  add(fallbackId);

  return Array.from(variants);
}

function normalizeKey(key: string): string | undefined {
  const idx = key.lastIndexOf(':');
  if (idx === -1) return undefined;
  const tail = key.slice(idx + 1);
  if (/^\d+$/.test(tail)) return key.slice(0, idx);
  return undefined;
}
