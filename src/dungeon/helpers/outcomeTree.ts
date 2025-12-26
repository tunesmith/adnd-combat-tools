import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import { describeSwordSpecialPurpose } from '../../tables/dungeon/treasureSwords';
import type {
  TreasureSword,
  TreasureSwordExtraordinaryPowerResult,
  TreasureSwordSpecialPurposeResult,
} from '../../tables/dungeon/treasureSwords';
import type { TreasureSwordAlignment } from '../../tables/dungeon/treasureSwordAlignment';
import {
  resolveIllusionaryWallNature,
  resolveChamberDimensions,
  resolveUnusualShape,
  resolveUnusualSize,
  resolveChamberRoomContents,
  resolveChamberRoomStairs,
  resolveCircularContents,
  resolveCircularPool,
  resolveCircularMagicPool,
  resolveTransmuteType,
  resolvePoolAlignment,
  resolveTransporterLocation,
  resolveTrickTrap,
  resolveMonsterFour,
  resolveMonsterFive,
  resolveMonsterSix,
  resolveMonsterSeven,
  resolveMonsterEight,
  resolveMonsterNine,
  resolveMonsterTen,
  resolveDragonFourYounger,
  resolveDragonFourOlder,
  resolveDragonFiveYounger,
  resolveDragonFiveOlder,
  resolveDragonSix,
  resolveDragonSeven,
  resolveDragonEight,
  resolveDragonNine,
  resolveDragonTen,
  resolveHuman,
  resolveTreasure,
  resolveTreasureMiscMagicE4,
  resolveTreasureMiscMagicE5,
  resolveTreasureRobeOfUsefulItems,
  resolveTreasureRobeOfTheArchmagi,
  resolveTreasureScarabOfProtectionCurse,
  resolveTreasureScarabOfProtectionCurseResolution,
  resolveTreasureMiscWeapons,
  resolveTreasureArmorShields,
  resolveTreasureSwords,
  resolveTreasureSwordKind,
  resolveTreasureSwordUnusual,
  resolveTreasureSwordAlignment,
  resolveTreasureSwordPrimaryAbility,
  resolveTreasureMedallionRange,
  resolveTreasureNecklaceOfMissiles,
  resolveTreasureNecklaceOfPrayerBeads,
  resolveTreasurePearlOfPowerEffect,
  resolveTreasurePearlOfPowerRecall,
  resolveTreasurePearlOfWisdom,
  resolveTreasurePeriaptProofAgainstPoison,
  resolveTreasurePhylacteryLongYears,
  resolveTreasureQuaalFeatherToken,
  resolveTreasureManualOfGolems,
  resolveRoomDimensions,
} from '../domain/resolvers';
import { readTreasureMagicContext } from '../features/treasure/shared';
import {
  NAVIGATION_CHILD_POST_PROCESSORS,
  NAVIGATION_PENDING_RESOLVERS,
} from '../features/navigation/bundle';
import {
  HAZARD_CHILD_POST_PROCESSORS,
  HAZARD_PENDING_RESOLVERS,
} from '../features/hazards/bundle';
import { TREASURE_PENDING_RESOLVERS } from '../features/treasure/bundle';
import { MONSTER_PENDING_RESOLVERS } from '../features/monsters/bundle';
import { resolveGasTrapEffect } from '../features/hazards/gasTrap/gasTrapResolvers';
import type { TableContext } from '../../types/dungeon';
import { DoorLocation } from '../features/navigation/doorChain/doorChainTable';
import { ChamberRoomContents } from '../../tables/dungeon/chamberRoomContents';

const MAX_DEPTH = 32;

export function normalizeOutcomeTree(
  node: DungeonOutcomeNode,
  rootId?: string
): DungeonOutcomeNode {
  if (node.type === 'pending-roll') {
    const pendingId =
      rootId ?? node.id ?? `root.pending.${sanitizeId(node.table)}`;
    if (node.id === pendingId) return node;
    return { ...node, id: pendingId };
  }
  const assignedId = rootId ?? node.id ?? `root.${sanitizeId(node.event.kind)}`;
  const changed = node.id !== assignedId;
  const baseChildren = node.children;
  if (!baseChildren || baseChildren.length === 0) {
    if (!changed) return node;
    return { ...node, id: assignedId };
  }
  let childChanged = false;
  const nextChildren = baseChildren.map((child, index) => {
    const childId = buildChildId(assignedId, child, index);
    const normalized = normalizeOutcomeTree(child, childId);
    if (normalized !== child) childChanged = true;
    return normalized;
  });
  if (!changed && !childChanged) return node;
  return {
    ...node,
    id: assignedId,
    children: childChanged ? nextChildren : baseChildren,
  };
}

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
    const obj = x as { extra?: unknown; isRoom?: unknown };
    const extraIsNumber = typeof obj.extra === 'number';
    const isRoomOk =
      obj.isRoom === undefined || typeof obj.isRoom === 'boolean';
    return extraIsNumber && isRoomOk;
  }
  if (kind === 'exit') {
    const obj = x as {
      exitType?: unknown;
      index?: unknown;
      total?: unknown;
      origin?: unknown;
    };
    return (
      (obj.exitType === 'door' || obj.exitType === 'passage') &&
      typeof obj.index === 'number' &&
      typeof obj.total === 'number' &&
      (obj.origin === 'room' || obj.origin === 'chamber')
    );
  }
  if (kind === 'exitDirection') {
    const obj = x as { index?: unknown; total?: unknown; origin?: unknown };
    return (
      typeof obj.index === 'number' &&
      typeof obj.total === 'number' &&
      (obj.origin === 'room' || obj.origin === 'chamber')
    );
  }
  if (kind === 'exitAlternative') {
    const obj = x as { exitType?: unknown };
    return obj.exitType === 'door' || obj.exitType === 'passage';
  }
  if (kind === 'chamberDimensions') {
    const obj = x as {
      forcedContents?: unknown;
      level?: unknown;
    };
    const forcedOk =
      obj.forcedContents === undefined ||
      typeof obj.forcedContents === 'number';
    const levelOk = obj.level === undefined || typeof obj.level === 'number';
    return forcedOk && levelOk;
  }
  if (kind === 'chamberContents') {
    const obj = x as { level?: unknown };
    return typeof obj.level === 'number';
  }
  if (kind === 'treasure') {
    const obj = x as {
      level?: unknown;
      withMonster?: unknown;
      rollIndex?: unknown;
      totalRolls?: unknown;
    };
    return (
      typeof obj.level === 'number' &&
      typeof obj.withMonster === 'boolean' &&
      (obj.rollIndex === undefined || typeof obj.rollIndex === 'number') &&
      (obj.totalRolls === undefined || typeof obj.totalRolls === 'number')
    );
  }
  if (kind === 'treasureProtection') {
    const obj = x as { treasureRoll?: unknown };
    return (
      obj.treasureRoll === undefined || typeof obj.treasureRoll === 'number'
    );
  }
  if (kind === 'treasureContainer') {
    return true;
  }
  if (kind === 'treasureMagic') {
    const obj = x as {
      level?: unknown;
      treasureRoll?: unknown;
      rollIndex?: unknown;
    };
    return (
      typeof obj.level === 'number' &&
      typeof obj.treasureRoll === 'number' &&
      (obj.rollIndex === undefined || typeof obj.rollIndex === 'number')
    );
  }
  if (kind === 'treasureSword') {
    const obj = x as {
      sword?: unknown;
      rollIndex?: unknown;
      languageRolls?: unknown;
      primaryAbilityRolls?: unknown;
      extraordinaryPowerRolls?: unknown;
      dragonSlayerColorRoll?: unknown;
      luckBladeWishes?: unknown;
    };
    const swordOk = typeof obj.sword === 'number';
    const indexOk =
      obj.rollIndex === undefined || typeof obj.rollIndex === 'number';
    const languageOk =
      obj.languageRolls === undefined || Array.isArray(obj.languageRolls);
    const primaryOk =
      obj.primaryAbilityRolls === undefined ||
      Array.isArray(obj.primaryAbilityRolls);
    const extraOk =
      obj.extraordinaryPowerRolls === undefined ||
      Array.isArray(obj.extraordinaryPowerRolls);
    const colorOk =
      obj.dragonSlayerColorRoll === undefined ||
      typeof obj.dragonSlayerColorRoll === 'number';
    const wishesOk =
      obj.luckBladeWishes === undefined ||
      typeof obj.luckBladeWishes === 'number';
    return (
      swordOk &&
      indexOk &&
      languageOk &&
      primaryOk &&
      extraOk &&
      colorOk &&
      wishesOk
    );
  }
  if (kind === 'treasureSwordAlignment') {
    const obj = x as { variant?: unknown };
    return (
      obj.variant === 'standard' ||
      obj.variant === 'chaotic' ||
      obj.variant === 'lawful'
    );
  }
  if (kind === 'treasureSwordExtraordinaryPower') {
    const obj = x as {
      slotKey?: unknown;
      rollIndex?: unknown;
      tableVariant?: unknown;
      alignment?: unknown;
    };
    const slotOk = obj.slotKey === undefined || typeof obj.slotKey === 'string';
    const indexOk =
      obj.rollIndex === undefined || typeof obj.rollIndex === 'number';
    const variantOk =
      obj.tableVariant === undefined ||
      obj.tableVariant === 'standard' ||
      obj.tableVariant === 'restricted';
    const alignmentOk =
      obj.alignment === undefined || typeof obj.alignment === 'number';
    return slotOk && indexOk && variantOk && alignmentOk;
  }
  if (kind === 'treasureSwordSpecialPurpose') {
    const obj = x as {
      slotKey?: unknown;
      rollIndex?: unknown;
      parentSlotKey?: unknown;
      alignment?: unknown;
      alignmentReady?: unknown;
    };
    const slotOk = obj.slotKey === undefined || typeof obj.slotKey === 'string';
    const parentOk =
      obj.parentSlotKey === undefined || typeof obj.parentSlotKey === 'string';
    const indexOk =
      obj.rollIndex === undefined || typeof obj.rollIndex === 'number';
    const alignmentOk =
      obj.alignment === undefined || typeof obj.alignment === 'number';
    const readyOk =
      obj.alignmentReady === undefined ||
      typeof obj.alignmentReady === 'boolean';
    return slotOk && parentOk && indexOk && alignmentOk && readyOk;
  }
  if (kind === 'treasureSwordSpecialPurposePower') {
    const obj = x as {
      slotKey?: unknown;
      rollIndex?: unknown;
      parentSlotKey?: unknown;
      alignment?: unknown;
    };
    const slotOk = obj.slotKey === undefined || typeof obj.slotKey === 'string';
    const parentOk =
      obj.parentSlotKey === undefined || typeof obj.parentSlotKey === 'string';
    const indexOk =
      obj.rollIndex === undefined || typeof obj.rollIndex === 'number';
    const alignmentOk =
      obj.alignment === undefined || typeof obj.alignment === 'number';
    return slotOk && parentOk && indexOk && alignmentOk;
  }
  if (kind === 'treasureSwordDragonSlayerColor') {
    const obj = x as {
      slotKey?: unknown;
      rollIndex?: unknown;
      alignment?: unknown;
      alignmentReady?: unknown;
    };
    const slotOk = obj.slotKey === undefined || typeof obj.slotKey === 'string';
    const indexOk =
      obj.rollIndex === undefined || typeof obj.rollIndex === 'number';
    const alignmentOk =
      obj.alignment === undefined || typeof obj.alignment === 'number';
    const readyOk =
      obj.alignmentReady === undefined ||
      typeof obj.alignmentReady === 'boolean';
    return slotOk && indexOk && alignmentOk && readyOk;
  }
  if (kind === 'treasureSwordDragonSlayerColor') {
    const obj = x as { slotKey?: unknown; rollIndex?: unknown };
    const slotOk = obj.slotKey === undefined || typeof obj.slotKey === 'string';
    const indexOk =
      obj.rollIndex === undefined || typeof obj.rollIndex === 'number';
    return slotOk && indexOk;
  }
  return false;
}

function readChamberDimensionsContext(
  context: unknown
): { forcedContents?: ChamberRoomContents; level?: number } | undefined {
  if (!context || typeof context !== 'object') return undefined;
  const kind = (context as { kind?: unknown }).kind;
  if (kind !== 'chamberDimensions') return undefined;
  const forced = (context as { forcedContents?: unknown }).forcedContents;
  const levelValue = (context as { level?: unknown }).level;
  const result: {
    forcedContents?: ChamberRoomContents;
    level?: number;
  } = {};
  if (typeof forced === 'number') {
    const numeric = forced;
    if (
      numeric >= ChamberRoomContents.Empty &&
      numeric <= ChamberRoomContents.Treasure
    ) {
      result.forcedContents = numeric as ChamberRoomContents;
    }
  }
  if (typeof levelValue === 'number' && Number.isFinite(levelValue)) {
    result.level = levelValue;
  }
  return result;
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

function collectDoorChainExisting(
  ancestors: OutcomeEventNode[]
): DoorChainLaterality[] {
  const existing: DoorChainLaterality[] = [];
  for (const ancestor of ancestors) {
    if (ancestor.event.kind !== 'doorLocation') continue;
    const lateral = toDoorChainLaterality(ancestor.event.result);
    if (!lateral) continue;
    if (!existing.includes(lateral)) existing.push(lateral);
  }
  return existing;
}

function toDoorChainLaterality(
  result: DoorLocation
): DoorChainLaterality | undefined {
  if (result === DoorLocation.Left) return 'Left';
  if (result === DoorLocation.Right) return 'Right';
  return undefined;
}

export function resolveOutcomeNode(
  node: DungeonOutcomeNode,
  depth = 0,
  ancestors: OutcomeEventNode[] = []
): OutcomeEventNode | undefined {
  if (depth > MAX_DEPTH) return undefined;
  if (node.type === 'event') {
    const baseChildren = node.children;
    ancestors.push(node);
    const resolvedChildren = resolveChildren(
      baseChildren,
      depth + 1,
      ancestors
    );
    ancestors.pop();
    const enriched = enrichEventNode(node, resolvedChildren, depth + 1);
    return enriched;
  }
  const resolved = resolvePendingNode(node, ancestors);
  if (!resolved) return undefined;
  return resolveOutcomeNode(resolved, depth + 1, ancestors);
}

export function applyResolvedOutcome(
  node: DungeonOutcomeNode,
  targetId: string,
  resolved: DungeonOutcomeNode
): DungeonOutcomeNode {
  if (node.type === 'pending-roll') {
    if (
      matchesTarget(node.id, targetId) ||
      (!node.id && node.table === targetId)
    ) {
      return resolved;
    }
    return node;
  }
  if (node.type !== 'event') return node;
  if (
    matchesTarget(node.id, targetId) ||
    (!node.id && node.event.kind === targetId)
  ) {
    return resolved;
  }
  const children = node.children;
  if (!children || children.length === 0) return node;
  let changed = false;
  const nextChildren = children.map((child) => {
    const updated = applyResolvedOutcome(child, targetId, resolved);
    if (updated !== child) changed = true;
    return updated;
  });
  if (!changed) return node;
  const updatedNode: OutcomeEventNode = {
    ...node,
    children: nextChildren,
  };
  const dragonText = inheritDragonChildText(updatedNode);
  if (dragonText && 'text' in updatedNode.event) {
    updatedNode.event = {
      ...updatedNode.event,
      text: dragonText,
    } as OutcomeEvent;
  }
  return updatedNode;
}

const DRAGON_PARENT_BY_CHILD: Partial<
  Record<OutcomeEvent['kind'], OutcomeEvent['kind']>
> = {
  dragonThree: 'monsterThree',
  dragonFourYounger: 'monsterFour',
  dragonFourOlder: 'monsterFour',
  dragonFiveYounger: 'monsterFive',
  dragonFiveOlder: 'monsterFive',
  dragonSix: 'monsterSix',
  dragonSeven: 'monsterSeven',
  dragonEight: 'monsterEight',
  dragonNine: 'monsterNine',
  dragonTen: 'monsterTen',
};

function inheritDragonChildText(node: OutcomeEventNode): string | undefined {
  const children = node.children;
  if (!children) return undefined;
  for (const child of children) {
    if (child.type !== 'event') continue;
    const expectedParent = DRAGON_PARENT_BY_CHILD[child.event.kind];
    if (!expectedParent || expectedParent !== node.event.kind) continue;
    if ('text' in child.event && typeof child.event.text === 'string') {
      const text = child.event.text.trim();
      if (text.length > 0) return child.event.text;
    }
  }
  return undefined;
}

export function findPendingWithAncestors(
  node: DungeonOutcomeNode | undefined,
  predicate: (pending: PendingRoll) => boolean
): { pending: PendingRoll; ancestors: OutcomeEventNode[] } | undefined {
  return findPendingWithAncestorsInternal(node, predicate, []);
}

export function deriveDoorChainContext(
  node: DungeonOutcomeNode | undefined,
  targetId: string
): { existing: DoorChainLaterality[]; sequence: number } | undefined {
  const match = findPendingWithAncestors(
    node,
    (pending) =>
      matchesTarget(pending.id, targetId) || pending.table === targetId
  );
  if (!match) return undefined;
  const existing = collectDoorChainExisting(match.ancestors);
  const sequence = parseDoorChainSequence(targetId, existing.length);
  return { existing, sequence };
}

function resolveChildren(
  children: DungeonOutcomeNode[] | undefined,
  depth: number,
  ancestors: OutcomeEventNode[]
): OutcomeEventNode[] {
  if (!children) return [];
  const result: OutcomeEventNode[] = [];
  for (const child of children) {
    const resolved = resolveOutcomeNode(child, depth + 1, ancestors);
    if (resolved) result.push(resolved);
  }
  return result;
}

function enrichEventNode(
  node: OutcomeEventNode,
  resolvedChildren: OutcomeEventNode[],
  depth: number
): OutcomeEventNode {
  let children = [...resolvedChildren];
  const resolveNested = (outcome: DungeonOutcomeNode) =>
    resolveOutcomeNode(outcome, depth + 1, []);
  switch (node.event.kind) {
    case 'roomDimensions':
    case 'chamberDimensions': {
      const unusualSizeIndex = children.findIndex(
        (child) => child.event.kind === 'unusualSize'
      );
      const unusualSizeNode =
        unusualSizeIndex >= 0 ? children[unusualSizeIndex] : undefined;
      const area = unusualSizeNode
        ? totalAreaFromUnusualSize(unusualSizeNode)
        : undefined;

      let promotedExit: OutcomeEventNode | undefined;
      if (unusualSizeNode && Array.isArray(unusualSizeNode.children)) {
        const remainingNested: DungeonOutcomeNode[] = [];
        for (const nestedChild of unusualSizeNode.children) {
          if (
            !promotedExit &&
            nestedChild.type === 'event' &&
            nestedChild.event.kind === 'numberOfExits'
          ) {
            promotedExit = nestedChild;
            continue;
          }
          remainingNested.push(nestedChild);
        }
        if (promotedExit) {
          const nextChildren = [...children];
          nextChildren[unusualSizeIndex] = {
            ...unusualSizeNode,
            children: remainingNested.length > 0 ? remainingNested : undefined,
          } as OutcomeEventNode;
          children = nextChildren;
        }
      }
      if (promotedExit) {
        children = [...children, promotedExit];
      }

      const hasNumberOfExits = children.some(
        (child) => child.event.kind === 'numberOfExits'
      );
      if (!hasNumberOfExits && area !== undefined && area > 0) {
        const pending: PendingRoll = {
          type: 'pending-roll',
          table: 'numberOfExits',
          context: {
            kind: 'exits',
            length: area,
            width: 1,
            isRoom: node.event.kind === 'roomDimensions',
          },
        };
        const resolved = resolveOutcomeNode(pending, depth + 1, []);
        if (resolved) {
          children.push(resolved);
        }
      }
      break;
    }
    case 'treasureSwordUnusual':
      break;
    default:
      break;
  }
  const navPostProcess = NAVIGATION_CHILD_POST_PROCESSORS[node.event.kind];
  if (navPostProcess) {
    children = navPostProcess(node, children, resolveNested);
  }
  const hazardPostProcess = HAZARD_CHILD_POST_PROCESSORS[node.event.kind];
  if (hazardPostProcess) {
    children = hazardPostProcess(node, children, resolveNested);
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

// Alignment propagation helpers defined later

function findPendingWithAncestorsInternal(
  node: DungeonOutcomeNode | undefined,
  predicate: (pending: PendingRoll) => boolean,
  ancestors: OutcomeEventNode[]
): { pending: PendingRoll; ancestors: OutcomeEventNode[] } | undefined {
  if (!node) return undefined;
  if (node.type === 'pending-roll') {
    if (predicate(node)) {
      return { pending: node, ancestors: [...ancestors] };
    }
    return undefined;
  }
  if (node.type !== 'event' || !node.children) return undefined;
  ancestors.push(node);
  for (const child of node.children) {
    const match = findPendingWithAncestorsInternal(child, predicate, ancestors);
    if (match) {
      ancestors.pop();
      return match;
    }
  }
  ancestors.pop();
  return undefined;
}

function resolvePendingNode(
  pending: PendingRoll,
  ancestors: OutcomeEventNode[]
): DungeonOutcomeNode | undefined {
  const base = pending.table.split(':')[0] ?? '';
  const navResolve = NAVIGATION_PENDING_RESOLVERS[base];
  if (navResolve) {
    const resolved = navResolve(pending, ancestors);
    if (resolved) return resolved;
  }
  const hazardResolve = HAZARD_PENDING_RESOLVERS[base];
  if (hazardResolve) {
    const resolved = hazardResolve(pending, ancestors);
    if (resolved) return resolved;
  }
  const treasureResolve = TREASURE_PENDING_RESOLVERS[base];
  if (treasureResolve) {
    const resolved = treasureResolve(pending, ancestors);
    if (resolved) return resolved;
  }
  const monsterResolve = MONSTER_PENDING_RESOLVERS[base];
  if (monsterResolve) {
    const resolved = monsterResolve(pending, ancestors);
    if (resolved) return resolved;
  }
  switch (base) {
    case 'roomDimensions': {
      const ctx = pending.context as
        | { kind?: unknown; level?: unknown }
        | undefined;
      const level =
        ctx && ctx.kind === 'chamberDimensions' && typeof ctx.level === 'number'
          ? ctx.level
          : 1;
      return resolveRoomDimensions({ level });
    }
    case 'chamberDimensions': {
      const chamberContext = readChamberDimensionsContext(pending.context);
      const derivedLevel = deriveDungeonLevelFromAncestors(ancestors);
      const level =
        chamberContext?.level !== undefined
          ? chamberContext.level
          : derivedLevel;
      const hasContext =
        (chamberContext && chamberContext.forcedContents !== undefined) ||
        level !== undefined;
      return resolveChamberDimensions(
        hasContext
          ? {
              context: {
                forcedContents: chamberContext?.forcedContents,
                level,
              },
            }
          : undefined
      );
    }
    case 'unusualShape':
      return resolveUnusualShape({});
    case 'unusualSize': {
      const context = readUnusualSizeContext(pending.context);
      return resolveUnusualSize({
        extra: context?.extra,
        isRoom: context?.isRoom,
      });
    }
    case 'chamberRoomContents': {
      const contextLevel =
        isTableContext(pending.context) &&
        pending.context.kind === 'chamberContents'
          ? pending.context.level
          : undefined;
      const derivedLevel = deriveDungeonLevelFromAncestors(ancestors);
      const level = contextLevel ?? derivedLevel ?? 1;
      return resolveChamberRoomContents({ level });
    }
    case 'chamberRoomStairs':
      return resolveChamberRoomStairs({});
    case 'circularContents':
      return resolveCircularContents({});
    case 'circularPool': {
      const level = deriveDungeonLevelFromAncestors(ancestors) ?? 1;
      return resolveCircularPool({ level });
    }
    case 'circularMagicPool':
      return resolveCircularMagicPool({});
    case 'treasure': {
      const rawContext = pending.context as TableContext | undefined;
      const ctx =
        rawContext && rawContext.kind === 'treasure' ? rawContext : undefined;
      const level =
        ctx?.level ?? deriveDungeonLevelFromAncestors(ancestors) ?? 1;
      const withMonster = ctx?.withMonster ?? false;
      return resolveTreasure({
        level,
        withMonster,
        rollIndex: ctx?.rollIndex,
        totalRolls: ctx?.totalRolls,
      });
    }
    case 'gasTrapEffect':
      return resolveGasTrapEffect({});
    case 'treasureMiscMagicE4':
      return resolveTreasureMiscMagicE4({});
    case 'treasureMiscMagicE5':
      return resolveTreasureMiscMagicE5({});
    case 'treasureArmorShields': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureArmorShields(context);
    }
    case 'treasureSwords': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureSwords(context);
    }
    case 'treasureSwordKind':
      return resolveTreasureSwordKind({});
    case 'treasureSwordUnusual': {
      const context = readTreasureSwordContext(pending.context, ancestors);
      return resolveTreasureSwordUnusual(context);
    }
    case 'treasureSwordPrimaryAbility': {
      const context = readSwordPrimaryAbilityContext(pending.context);
      return resolveTreasureSwordPrimaryAbility({
        slotKey: context.slotKey,
        rollIndex: context.rollIndex,
        tableVariant: context.tableVariant ?? 'standard',
      });
    }
    case 'treasureSwordPrimaryAbilityRestricted': {
      const context = readSwordPrimaryAbilityContext(pending.context);
      return resolveTreasureSwordPrimaryAbility({
        slotKey: context.slotKey,
        rollIndex: context.rollIndex,
        tableVariant: 'restricted',
      });
    }
    case 'treasureSwordAlignment':
      return resolveTreasureSwordAlignment({ variant: 'standard' });
    case 'treasureSwordAlignmentChaotic':
      return resolveTreasureSwordAlignment({ variant: 'chaotic' });
    case 'treasureSwordAlignmentLawful':
      return resolveTreasureSwordAlignment({ variant: 'lawful' });
    case 'treasureMiscWeapons': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureMiscWeapons(context);
    }
    case 'treasureRobeOfUsefulItems':
      return resolveTreasureRobeOfUsefulItems({});
    case 'treasureRobeOfTheArchmagi':
      return resolveTreasureRobeOfTheArchmagi({});
    case 'treasureScarabOfProtectionCurse':
      return resolveTreasureScarabOfProtectionCurse({});
    case 'treasureScarabOfProtectionCurseResolution':
      return resolveTreasureScarabOfProtectionCurseResolution({});
    case 'treasureManualOfGolems':
      return resolveTreasureManualOfGolems({});
    case 'treasureNecklaceOfMissiles':
      return resolveTreasureNecklaceOfMissiles({});
    case 'treasureNecklaceOfPrayerBeads':
      return resolveTreasureNecklaceOfPrayerBeads({});
    case 'treasurePearlOfPowerEffect':
      return resolveTreasurePearlOfPowerEffect({});
    case 'treasurePearlOfPowerRecall':
      return resolveTreasurePearlOfPowerRecall({});
    case 'treasurePearlOfWisdom':
      return resolveTreasurePearlOfWisdom({});
    case 'treasurePeriaptProofAgainstPoison':
      return resolveTreasurePeriaptProofAgainstPoison({});
    case 'treasurePhylacteryLongYears':
      return resolveTreasurePhylacteryLongYears({});
    case 'treasureQuaalFeatherToken':
      return resolveTreasureQuaalFeatherToken({});
    case 'treasureNecklaceOfPrayerBeads':
      return resolveTreasureNecklaceOfPrayerBeads({});
    case 'treasureMedallionRange':
      return resolveTreasureMedallionRange({});
    case 'transmuteType':
      return resolveTransmuteType({});
    case 'poolAlignment':
      return resolvePoolAlignment({});
    case 'transporterLocation':
      return resolveTransporterLocation({});
    case 'trickTrap':
      return resolveTrickTrap({});
    case 'illusionaryWallNature':
      return resolveIllusionaryWallNature({});
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
    case 'monsterSeven': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterSeven({ dungeonLevel });
    }
    case 'monsterEight': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterEight({ dungeonLevel });
    }
    case 'monsterNine': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterNine({ dungeonLevel });
    }
    case 'monsterTen': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterTen({ dungeonLevel });
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
    case 'dragonSeven': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 7);
      return resolveDragonSeven({ dungeonLevel });
    }
    case 'dragonEight': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 8);
      return resolveDragonEight({ dungeonLevel });
    }
    case 'dragonNine': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 9);
      return resolveDragonNine({ dungeonLevel });
    }
    case 'dragonTen': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 10);
      return resolveDragonTen({ dungeonLevel });
    }
    case 'human': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveHuman({ dungeonLevel });
    }
    default:
      return undefined;
  }
}

export function propagateSwordAlignmentInfo(
  node: DungeonOutcomeNode
): DungeonOutcomeNode {
  return propagateAlignment(node, undefined);
}

function propagateAlignment(
  node: DungeonOutcomeNode,
  currentAlignment: TreasureSwordAlignment | undefined
): DungeonOutcomeNode {
  if (node.type === 'event') {
    let nextAlignment = currentAlignment;
    if (node.event.kind === 'treasureSwordAlignment') {
      nextAlignment = node.event.result.alignment;
    } else if (node.event.kind === 'treasureSwordUnusual') {
      const alignmentChild = (node.children || []).find(
        (child): child is OutcomeEventNode =>
          child.type === 'event' &&
          child.event.kind === 'treasureSwordAlignment'
      );
      if (
        alignmentChild &&
        alignmentChild.event.kind === 'treasureSwordAlignment'
      ) {
        const alignmentResult = alignmentChild.event.result;
        nextAlignment = alignmentResult.alignment;
      }
    }
    const originalChildren = node.children ?? [];
    const updatedChildren = originalChildren.map((child) =>
      propagateAlignment(child, nextAlignment)
    );
    let childrenChanged = false;
    for (let i = 0; i < originalChildren.length; i += 1) {
      if (originalChildren[i] !== updatedChildren[i]) {
        childrenChanged = true;
        break;
      }
    }

    let updatedNode = node;
    if (
      node.event.kind === 'treasureSwordExtraordinaryPower' &&
      nextAlignment !== undefined
    ) {
      updatedNode = applyAlignmentToExtraordinaryEvent(node, updatedChildren);
    } else if (
      node.event.kind === 'treasureSwordSpecialPurpose' &&
      nextAlignment !== undefined
    ) {
      updatedNode = applyAlignmentToSpecialPurposeEvent(node, nextAlignment);
      if (childrenChanged && updatedNode.children) {
        updatedNode = {
          ...updatedNode,
          children: updatedChildren,
        };
      }
    } else if (childrenChanged) {
      updatedNode = {
        ...node,
        children: updatedChildren,
      };
    }
    return updatedNode;
  }

  if (
    node.type === 'pending-roll' &&
    node.table === 'treasureSwordSpecialPurpose' &&
    currentAlignment !== undefined
  ) {
    const existing =
      node.context && typeof node.context === 'object'
        ? (node.context as SpecialPurposeContext)
        : undefined;
    const alreadyAligned =
      existing?.alignment === currentAlignment &&
      existing?.alignmentReady === true;
    if (alreadyAligned) return node;
    const nextContext: SpecialPurposeContext = {
      kind: 'treasureSwordSpecialPurpose',
      ...existing,
      alignment: currentAlignment,
      alignmentReady: true,
    };
    return {
      ...node,
      context: nextContext,
    };
  }
  if (
    node.type === 'pending-roll' &&
    node.table === 'treasureSwordSpecialPurposePower' &&
    currentAlignment !== undefined
  ) {
    const existing =
      node.context && typeof node.context === 'object'
        ? (node.context as {
            slotKey?: string;
            rollIndex?: number;
            parentSlotKey?: string;
            alignment?: TreasureSwordAlignment;
          })
        : undefined;
    const alreadyAligned = existing?.alignment === currentAlignment;
    if (alreadyAligned) return node;
    const nextContext = {
      kind: 'treasureSwordSpecialPurposePower' as const,
      ...existing,
      alignment: currentAlignment,
    };
    return {
      ...node,
      context: nextContext,
    };
  }
  if (
    node.type === 'pending-roll' &&
    node.table === 'treasureSwordDragonSlayerColor'
  ) {
    const existing =
      node.context && typeof node.context === 'object'
        ? (node.context as {
            slotKey?: string;
            rollIndex?: number;
            alignment?: TreasureSwordAlignment;
            alignmentReady?: boolean;
          })
        : undefined;
    if (currentAlignment === undefined) {
      if (existing?.alignmentReady === false) return node;
      return node;
    }
    const alreadyAligned =
      existing?.alignment === currentAlignment &&
      existing?.alignmentReady === true;
    if (alreadyAligned) return node;
    const nextContext = {
      kind: 'treasureSwordDragonSlayerColor' as const,
      ...existing,
      alignment: currentAlignment,
      alignmentReady: true,
    };
    return {
      ...node,
      context: nextContext,
    };
  }
  return node;
}

function applyAlignmentToExtraordinaryEvent(
  node: OutcomeEventNode,
  children: DungeonOutcomeNode[]
): OutcomeEventNode {
  if (node.event.kind !== 'treasureSwordExtraordinaryPower') return node;
  const result = node.event.result;
  let updated = node;
  if (result.kind === 'power' && result.alignmentRequired) {
    const nextResult: Extract<
      TreasureSwordExtraordinaryPowerResult,
      { kind: 'power' }
    > = {
      ...result,
      alignmentRequired: undefined,
    };
    updated = {
      ...node,
      event: {
        ...node.event,
        result: nextResult,
      },
    };
  }
  if (children.length > 0) {
    updated = {
      ...updated,
      children,
    };
  }
  return updated;
}

function applyAlignmentToSpecialPurposeEvent(
  node: OutcomeEventNode,
  alignment: TreasureSwordAlignment
): OutcomeEventNode {
  if (node.event.kind !== 'treasureSwordSpecialPurpose') return node;
  const result = node.event.result;
  if (result.alignment === alignment) return node;
  const updatedResult: TreasureSwordSpecialPurposeResult = {
    ...result,
    alignment,
    description: describeSwordSpecialPurpose(result.purpose, { alignment }),
  };
  return {
    ...node,
    event: {
      ...node.event,
      result: updatedResult,
    },
    children: node.children,
  };
}

type SpecialPurposeContext = {
  kind: 'treasureSwordSpecialPurpose';
  slotKey?: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
  alignmentReady?: boolean;
};

function buildChildId(
  parentId: string,
  child: DungeonOutcomeNode,
  index: number
): string {
  const suffix =
    child.type === 'event'
      ? sanitizeId(child.event.kind)
      : sanitizeId(child.table);
  return `${parentId}.${index}.${suffix}`;
}

function sanitizeId(value: string): string {
  return value.replace(/\s+/g, '-');
}

function matchesTarget(nodeId: string | undefined, targetId: string): boolean {
  return !!nodeId && nodeId === targetId;
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

function readUnusualSizeContext(
  context: unknown
): { extra: number; isRoom?: boolean } | undefined {
  if (!isTableContext(context)) return undefined;
  if (context.kind !== 'unusualSize') return undefined;
  const extra = typeof context.extra === 'number' ? context.extra : undefined;
  if (extra === undefined) return undefined;
  const isRoom =
    context.isRoom === undefined || typeof context.isRoom === 'boolean'
      ? context.isRoom
      : undefined;
  return { extra, isRoom };
}

function readTreasureSwordContext(
  context: unknown,
  ancestors: OutcomeEventNode[]
): {
  sword?: TreasureSword;
  rollIndex?: number;
  alignmentRoll?: number;
  languageRolls?: number[];
  primaryAbilityRolls?: number[];
  extraordinaryPowerRolls?: number[];
} {
  if (
    context &&
    typeof context === 'object' &&
    (context as { kind?: unknown }).kind === 'treasureSword'
  ) {
    const swordValue = (context as { sword?: unknown }).sword;
    const rollIndexValue = (context as { rollIndex?: unknown }).rollIndex;
    const alignmentRollValue = (context as { alignmentRoll?: unknown })
      .alignmentRoll;
    const languageRollsValue = (context as { languageRolls?: unknown })
      .languageRolls;
    const primaryAbilityRollsValue = (
      context as { primaryAbilityRolls?: unknown }
    ).primaryAbilityRolls;
    const extraordinaryPowerRollsValue = (
      context as { extraordinaryPowerRolls?: unknown }
    ).extraordinaryPowerRolls;
    return {
      sword:
        typeof swordValue === 'number'
          ? (swordValue as TreasureSword)
          : findSwordFromAncestors(ancestors),
      rollIndex:
        typeof rollIndexValue === 'number' ? rollIndexValue : undefined,
      alignmentRoll:
        typeof alignmentRollValue === 'number' ? alignmentRollValue : undefined,
      languageRolls: Array.isArray(languageRollsValue)
        ? [...(languageRollsValue as number[])]
        : undefined,
      primaryAbilityRolls: Array.isArray(primaryAbilityRollsValue)
        ? [...(primaryAbilityRollsValue as number[])]
        : undefined,
      extraordinaryPowerRolls: Array.isArray(extraordinaryPowerRollsValue)
        ? [...(extraordinaryPowerRollsValue as number[])]
        : undefined,
    };
  }
  return { sword: findSwordFromAncestors(ancestors) };
}

function readSwordPrimaryAbilityContext(context: unknown): {
  slotKey?: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
} {
  if (!context || typeof context !== 'object') {
    return {};
  }
  const candidate = context as {
    slotKey?: unknown;
    rollIndex?: unknown;
    tableVariant?: unknown;
    ignoreHigh?: unknown;
  };
  const slotKey =
    typeof candidate.slotKey === 'string' ? candidate.slotKey : undefined;
  const rollIndex =
    typeof candidate.rollIndex === 'number' ? candidate.rollIndex : undefined;
  let tableVariant: 'standard' | 'restricted' | undefined;
  if (
    candidate.tableVariant === 'restricted' ||
    candidate.ignoreHigh === true
  ) {
    tableVariant = 'restricted';
  } else if (candidate.tableVariant === 'standard') {
    tableVariant = 'standard';
  }
  return { slotKey, rollIndex, tableVariant };
}

function findSwordFromAncestors(
  ancestors: OutcomeEventNode[]
): TreasureSword | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor || ancestor.type !== 'event') continue;
    if (ancestor.event.kind === 'treasureSwords') {
      return ancestor.event.result;
    }
  }
  return undefined;
}

function deriveDungeonLevelFromAncestors(
  ancestors: OutcomeEventNode[]
): number | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (
      ancestor.event.kind === 'periodicCheck' &&
      typeof ancestor.event.level === 'number'
    ) {
      return ancestor.event.level;
    }
    if (ancestor.event.kind === 'doorBeyond') {
      const doorLevel = ancestor.event.level;
      if (typeof doorLevel === 'number') {
        return doorLevel;
      }
    }
  }
  return undefined;
}

function totalAreaFromUnusualSize(node: OutcomeEventNode): number | undefined {
  if (node.event.kind !== 'unusualSize') return undefined;
  const area = (node.event as { area?: number }).area;
  if (area !== undefined) return area;
  if (!node.children) return undefined;
  for (const child of node.children) {
    if (child.type !== 'event') continue;
    const childArea = totalAreaFromUnusualSize(child);
    if (childArea !== undefined) return childArea;
  }
  return undefined;
}

export function countPendingNodes(
  node: DungeonOutcomeNode | undefined
): number {
  if (!node) return 0;
  if (node.type === 'pending-roll') return 1;
  if (!node.children) return 0;
  return node.children.reduce(
    (total, child) => total + countPendingNodes(child),
    0
  );
}
