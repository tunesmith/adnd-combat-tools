import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import {
  resolveDoorLocation,
  resolvePeriodicDoorOnly,
  resolveSidePassages,
  resolvePassageTurns,
  resolvePassageWidth,
  resolveStairs,
  resolveEgress,
  resolveChute,
  resolveSpecialPassage,
  resolveRoomDimensions,
  resolveChamberDimensions,
  resolveUnusualShape,
  resolveUnusualSize,
  resolveCircularContents,
  resolveWanderingWhereFrom,
  resolveGalleryStairLocation,
  resolveGalleryStairOccurrence,
  resolveStreamConstruction,
  resolveRiverConstruction,
  resolveRiverBoatBank,
  resolveChasmDepth,
  resolveChasmConstruction,
  resolveJumpingPlaceWidth,
  resolveNumberOfExits,
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
import type { TableContext } from '../../types/dungeon';
import {
  GalleryStairLocation,
  RiverConstruction,
  ChasmConstruction,
} from '../../tables/dungeon/specialPassage';

const MAX_DEPTH = 32;

export function isTableContext(x: unknown): x is TableContext {
  if (!x || typeof x !== 'object') return false;
  const kind = (x as { kind?: unknown }).kind;
  if (kind === 'doorChain') {
    return Array.isArray((x as { existing?: unknown }).existing);
  }
  if (kind === 'wandering') {
    return typeof (x as { level?: unknown }).level === 'number';
  }
  if (kind === 'exits') {
    const obj = x as {
      length?: unknown;
      width?: unknown;
      isRoom?: unknown;
    };
    return (
      typeof obj.length === 'number' &&
      typeof obj.width === 'number' &&
      typeof obj.isRoom === 'boolean'
    );
  }
  if (kind === 'unusualSize') {
    return typeof (x as { extra?: unknown }).extra === 'number';
  }
  return false;
}

export function readDungeonLevelFromPending(
  pending: PendingRoll,
  fallback: number
): number {
  const parts = pending.table.split(':');
  if (parts.length >= 2) {
    const parsed = Number(parts[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (isTableContext(pending.context) && pending.context.kind === 'wandering') {
    return pending.context.level;
  }
  return fallback;
}

export function resolveOutcomeNode(
  node: DungeonOutcomeNode,
  depth = 0
): OutcomeEventNode | undefined {
  if (depth > MAX_DEPTH) return undefined;
  if (node.type === 'event') {
    const baseChildren = node.children;
    const resolvedChildren = resolveChildren(baseChildren, depth + 1);
    const enriched = enrichEventNode(node, resolvedChildren, depth + 1);
    return enriched;
  }
  const resolved = resolvePendingNode(node);
  if (!resolved) return undefined;
  return resolveOutcomeNode(resolved, depth + 1);
}

export function applyResolvedOutcome(
  node: DungeonOutcomeNode,
  tableId: string,
  resolved: DungeonOutcomeNode
): DungeonOutcomeNode {
  const baseId = String(tableId.split(':')[0] ?? tableId);
  if (node.type === 'event' && node.event.kind === baseId) {
    return resolved;
  }
  if (node.type === 'pending-roll') {
    return node.table === tableId ? resolved : node;
  }
  if (!node.children) return node;
  let changed = false;
  const nextChildren = node.children.map((child) => {
    const updated = applyResolvedOutcome(child, tableId, resolved);
    if (updated !== child) changed = true;
    return updated;
  });
  if (!changed) return node;
  return {
    type: 'event',
    event: node.event,
    roll: node.roll,
    children: nextChildren as unknown as DungeonOutcomeNode[],
  };
}

function resolveChildren(
  children: DungeonOutcomeNode[] | undefined,
  depth: number
): OutcomeEventNode[] {
  if (!children) return [];
  const result: OutcomeEventNode[] = [];
  for (const child of children) {
    const resolved = resolveOutcomeNode(child, depth + 1);
    if (resolved) result.push(resolved);
  }
  return result;
}

function enrichEventNode(
  node: OutcomeEventNode,
  resolvedChildren: OutcomeEventNode[],
  depth: number
): OutcomeEventNode {
  const children = [...resolvedChildren];
  switch (node.event.kind) {
    case 'galleryStairLocation': {
      if (
        node.event.result === GalleryStairLocation.PassageEnd &&
        !children.some((c) => c.event.kind === 'galleryStairOccurrence')
      ) {
        const occurrence = resolveOutcomeNode(
          resolveGalleryStairOccurrence({}),
          depth + 1
        );
        if (occurrence) children.push(occurrence);
      }
      break;
    }
    case 'riverConstruction': {
      if (
        node.event.result === RiverConstruction.Boat &&
        !children.some((c) => c.event.kind === 'riverBoatBank')
      ) {
        const bank = resolveOutcomeNode(resolveRiverBoatBank({}), depth + 1);
        if (bank) children.push(bank);
      }
      break;
    }
    case 'chasmConstruction': {
      if (
        node.event.result === ChasmConstruction.JumpingPlace &&
        !children.some((c) => c.event.kind === 'jumpingPlaceWidth')
      ) {
        const width = resolveOutcomeNode(
          resolveJumpingPlaceWidth({}),
          depth + 1
        );
        if (width) children.push(width);
      }
      break;
    }
    default:
      break;
  }
  return {
    type: 'event',
    event: node.event,
    roll: node.roll,
    children: children.length
      ? (children as unknown as DungeonOutcomeNode[])
      : undefined,
  };
}

function resolvePendingNode(
  pending: PendingRoll
): DungeonOutcomeNode | undefined {
  const base = pending.table.split(':')[0] ?? '';
  switch (base) {
    case 'doorLocation': {
      const existing = readDoorChainExisting(pending.context);
      const sequence = parseDoorChainSequence(pending.table, existing.length);
      return resolveDoorLocation({ existing, sequence });
    }
    case 'periodicCheckDoorOnly': {
      const existing = readDoorChainExisting(pending.context);
      const sequence = parseDoorChainSequence(pending.table, existing.length);
      return resolvePeriodicDoorOnly({ existing, sequence });
    }
    case 'sidePassages':
      return resolveSidePassages({});
    case 'passageTurns':
      return resolvePassageTurns({});
    case 'passageWidth':
      return resolvePassageWidth({});
    case 'stairs':
      return resolveStairs({});
    case 'egress': {
      const which = parseEgressWhich(pending.table);
      return resolveEgress({ which, roll: undefined });
    }
    case 'chute':
      return resolveChute({});
    case 'specialPassage':
      return resolveSpecialPassage({});
    case 'roomDimensions':
      return resolveRoomDimensions({});
    case 'chamberDimensions':
      return resolveChamberDimensions({});
    case 'unusualShape':
      return resolveUnusualShape({});
    case 'unusualSize': {
      const extra =
        isTableContext(pending.context) &&
        pending.context.kind === 'unusualSize'
          ? pending.context.extra
          : 0;
      return resolveUnusualSize({ extra });
    }
    case 'circularContents':
      return resolveCircularContents({});
    case 'wanderingWhereFrom':
      return resolveWanderingWhereFrom({});
    case 'galleryStairLocation':
      return resolveGalleryStairLocation({});
    case 'galleryStairOccurrence':
      return resolveGalleryStairOccurrence({});
    case 'streamConstruction':
      return resolveStreamConstruction({});
    case 'riverConstruction':
      return resolveRiverConstruction({});
    case 'riverBoatBank':
      return resolveRiverBoatBank({});
    case 'chasmDepth':
      return resolveChasmDepth({});
    case 'chasmConstruction':
      return resolveChasmConstruction({});
    case 'jumpingPlaceWidth':
      return resolveJumpingPlaceWidth({});
    case 'numberOfExits': {
      const context = readExitsContext(pending.context);
      if (!context) return undefined;
      return resolveNumberOfExits({
        length: context.length,
        width: context.width,
        isRoom: context.isRoom,
      });
    }
    case 'monsterLevel': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterLevel({ dungeonLevel });
    }
    case 'monsterOne': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterOne({ dungeonLevel });
    }
    case 'monsterTwo': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterTwo({ dungeonLevel });
    }
    case 'monsterThree': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterThree({ dungeonLevel });
    }
    case 'monsterFour': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterFour({ dungeonLevel });
    }
    case 'monsterFive': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterFive({ dungeonLevel });
    }
    case 'monsterSix': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterSix({ dungeonLevel });
    }
    case 'dragonThree': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 3);
      return resolveDragonThree({ dungeonLevel });
    }
    case 'dragonFourYounger': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 4);
      return resolveDragonFourYounger({ dungeonLevel });
    }
    case 'dragonFourOlder': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 4);
      return resolveDragonFourOlder({ dungeonLevel });
    }
    case 'dragonFiveYounger': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 5);
      return resolveDragonFiveYounger({ dungeonLevel });
    }
    case 'dragonFiveOlder': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 5);
      return resolveDragonFiveOlder({ dungeonLevel });
    }
    case 'dragonSix': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 6);
      return resolveDragonSix({ dungeonLevel });
    }
    case 'human': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveHuman({ dungeonLevel });
    }
    default:
      return undefined;
  }
}

export function parseDoorChainSequence(
  table: string,
  fallback: number
): number {
  const parts = table.split(':');
  if (parts.length >= 2) {
    const seq = Number(parts[1]);
    if (Number.isInteger(seq)) return seq;
  }
  return fallback;
}

function parseEgressWhich(table: string): 'one' | 'two' | 'three' {
  const parts = table.split(':');
  if (parts.length >= 2) {
    const key = parts[1] as 'one' | 'two' | 'three';
    if (key === 'one' || key === 'two' || key === 'three') return key;
  }
  return 'one';
}

export function readDoorChainExisting(context: unknown): DoorChainLaterality[] {
  if (!isTableContext(context)) return [];
  if (context.kind !== 'doorChain') return [];
  const arr = Array.isArray(context.existing) ? context.existing : [];
  return arr.filter(
    (v): v is DoorChainLaterality => v === 'Left' || v === 'Right'
  );
}

export function readExitsContext(
  context: unknown
): { length: number; width: number; isRoom: boolean } | undefined {
  if (!isTableContext(context)) return undefined;
  if (context.kind !== 'exits') return undefined;
  const length =
    typeof context.length === 'number' ? context.length : undefined;
  const width = typeof context.width === 'number' ? context.width : undefined;
  const isRoom =
    typeof context.isRoom === 'boolean' ? context.isRoom : undefined;
  if (length === undefined || width === undefined || isRoom === undefined)
    return undefined;
  return { length, width, isRoom };
}
