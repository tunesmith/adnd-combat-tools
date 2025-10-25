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
  resolveIllusionaryWallNature,
  resolveRoomDimensions,
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
  resolvePassageExitLocation,
  resolveDoorExitLocation,
  resolveExitDirection,
  resolveExitAlternative,
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
  resolveTreasure,
  resolveTreasureContainer,
  resolveTreasureProtectionType,
  resolveTreasureProtectionGuardedBy,
  resolveTreasureProtectionHiddenBy,
  resolveTreasureMagicCategory,
  resolveTreasurePotion,
  resolveTreasurePotionAnimalControl,
  resolveTreasurePotionDragonControl,
  resolveTreasurePotionGiantControl,
  resolveTreasurePotionGiantStrength,
  resolveTreasurePotionHumanControl,
  resolveTreasurePotionUndeadControl,
  resolveTreasureScroll,
  resolveTreasureScrollProtectionElementals,
  resolveTreasureScrollProtectionLycanthropes,
  resolveTreasureRing,
  resolveTreasureRingContrariness,
  resolveTreasureRingElementalCommand,
  resolveTreasureRingProtection,
  resolveTreasureRingRegeneration,
  resolveTreasureRingTelekinesis,
  resolveTreasureRingThreeWishes,
  resolveTreasureRingWizardry,
  resolveTreasureRodStaffWand,
  resolveTreasureBagOfHolding,
  resolveTreasureBagOfTricks,
  resolveTreasureBracersOfDefense,
  resolveTreasureBucknardsEverfullPurse,
  resolveTreasureArtifactOrRelic,
  resolveTreasureDeckOfManyThings,
  resolveTreasureFigurineOfWondrousPower,
  resolveTreasureFigurineMarbleElephant,
  resolveTreasureGirdleOfGiantStrength,
  resolveTreasureInstrumentOfTheBards,
  resolveTreasureIronFlask,
  resolveTreasureHornOfValhallaType,
  resolveTreasureHornOfValhallaAttunement,
  resolveTreasureHornOfValhallaAlignment,
  resolveTreasureMiscMagicE3,
  resolveTreasureMiscMagicE4,
  resolveTreasureMiscMagicE5,
  resolveTreasureRobeOfTheArchmagi,
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
  resolveTreasureEyesOfPetrification,
  resolveTreasureMiscMagicE2,
  resolveTreasureCarpetOfFlying,
  resolveTreasureCloakOfProtection,
  resolveTreasureCrystalBall,
  resolveTreasureMiscMagicE1,
  resolveTreasureStaffSerpent,
  resolveGasTrapEffect,
} from '../domain/resolvers';
import type { TableContext } from '../../types/dungeon';
import {
  GalleryStairLocation,
  RiverConstruction,
  ChasmConstruction,
} from '../../tables/dungeon/specialPassage';
import { DoorLocation } from '../../tables/dungeon/doorLocation';
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
  return {
    ...node,
    children: nextChildren,
  };
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
    case 'galleryStairLocation': {
      if (
        node.event.result === GalleryStairLocation.PassageEnd &&
        !children.some((c) => c.event.kind === 'galleryStairOccurrence')
      ) {
        const occurrence = resolveOutcomeNode(
          resolveGalleryStairOccurrence({}),
          depth + 1,
          []
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
        const bank = resolveOutcomeNode(
          resolveRiverBoatBank({}),
          depth + 1,
          []
        );
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
          depth + 1,
          []
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
  switch (base) {
    case 'doorLocation': {
      const existing = collectDoorChainExisting(ancestors);
      const sequence = parseDoorChainSequence(pending.table, existing.length);
      return resolveDoorLocation({ existing, sequence });
    }
    case 'periodicCheckDoorOnly': {
      const existing = collectDoorChainExisting(ancestors);
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
      return resolveRoomDimensions({
        level: deriveDungeonLevelFromAncestors(ancestors) ?? 1,
      });
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
    case 'treasureContainer':
      return resolveTreasureContainer({});
    case 'gasTrapEffect':
      return resolveGasTrapEffect({});
    case 'treasureMagicCategory': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureMagicCategory(context);
    }
    case 'treasurePotion': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotion(context);
    }
    case 'treasurePotionAnimalControl': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionAnimalControl(context);
    }
    case 'treasurePotionDragonControl': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionDragonControl(context);
    }
    case 'treasurePotionGiantControl': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionGiantControl(context);
    }
    case 'treasurePotionGiantStrength': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionGiantStrength(context);
    }
    case 'treasurePotionHumanControl': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionHumanControl(context);
    }
    case 'treasurePotionUndeadControl': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionUndeadControl(context);
    }
    case 'treasureScroll': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureScroll(context);
    }
    case 'treasureScrollProtectionElementals':
      return resolveTreasureScrollProtectionElementals({});
    case 'treasureScrollProtectionLycanthropes':
      return resolveTreasureScrollProtectionLycanthropes({});
    case 'treasureRing': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureRing(context);
    }
    case 'treasureRingContrariness':
      return resolveTreasureRingContrariness({});
    case 'treasureRingElementalCommand':
      return resolveTreasureRingElementalCommand({});
    case 'treasureRingProtection':
      return resolveTreasureRingProtection({});
    case 'treasureRingRegeneration':
      return resolveTreasureRingRegeneration({});
    case 'treasureRingTelekinesis':
      return resolveTreasureRingTelekinesis({});
    case 'treasureRingThreeWishes':
      return resolveTreasureRingThreeWishes({});
    case 'treasureRingWizardry':
      return resolveTreasureRingWizardry({});
    case 'treasureRodStaffWand':
      return resolveTreasureRodStaffWand({});
    case 'treasureBagOfHolding':
      return resolveTreasureBagOfHolding({});
    case 'treasureBagOfTricks':
      return resolveTreasureBagOfTricks({});
    case 'treasureBracersOfDefense':
      return resolveTreasureBracersOfDefense({});
    case 'treasureBucknardsEverfullPurse':
      return resolveTreasureBucknardsEverfullPurse({});
    case 'treasureArtifactOrRelic':
      return resolveTreasureArtifactOrRelic({});
    case 'treasureMiscMagicE2':
      return resolveTreasureMiscMagicE2({});
    case 'treasureMiscMagicE3':
      return resolveTreasureMiscMagicE3({});
    case 'treasureMiscMagicE4':
      return resolveTreasureMiscMagicE4({});
    case 'treasureMiscMagicE5':
      return resolveTreasureMiscMagicE5({});
    case 'treasureRobeOfTheArchmagi':
      return resolveTreasureRobeOfTheArchmagi({});
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
    case 'treasureCarpetOfFlying':
      return resolveTreasureCarpetOfFlying({});
    case 'treasureCloakOfProtection':
      return resolveTreasureCloakOfProtection({});
    case 'treasureCrystalBall':
      return resolveTreasureCrystalBall({});
    case 'treasureDeckOfManyThings':
      return resolveTreasureDeckOfManyThings({});
    case 'treasureFigurineOfWondrousPower':
      return resolveTreasureFigurineOfWondrousPower({});
    case 'treasureFigurineMarbleElephant':
      return resolveTreasureFigurineMarbleElephant({});
    case 'treasureGirdleOfGiantStrength':
      return resolveTreasureGirdleOfGiantStrength({});
    case 'treasureInstrumentOfTheBards':
      return resolveTreasureInstrumentOfTheBards({});
    case 'treasureIronFlask':
      return resolveTreasureIronFlask({});
    case 'treasureHornOfValhallaType':
      return resolveTreasureHornOfValhallaType({});
    case 'treasureHornOfValhallaAttunement':
      return resolveTreasureHornOfValhallaAttunement({});
    case 'treasureHornOfValhallaAlignment':
      return resolveTreasureHornOfValhallaAlignment({});
    case 'treasureEyesOfPetrification':
      return resolveTreasureEyesOfPetrification({});
    case 'treasureMiscMagicE1': {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasureMiscMagicE1(context);
    }
    case 'treasureStaffSerpent':
      return resolveTreasureStaffSerpent({});
    case 'treasureProtectionType':
      return resolveTreasureProtectionType({});
    case 'treasureProtectionGuardedBy':
      return resolveTreasureProtectionGuardedBy({});
    case 'treasureProtectionHiddenBy':
      return resolveTreasureProtectionHiddenBy({});
    case 'transmuteType':
      return resolveTransmuteType({});
    case 'poolAlignment':
      return resolvePoolAlignment({});
    case 'transporterLocation':
      return resolveTransporterLocation({});
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
    case 'trickTrap':
      return resolveTrickTrap({});
    case 'illusionaryWallNature':
      return resolveIllusionaryWallNature({});
    case 'numberOfExits': {
      const context = readExitsContext(pending.context);
      if (!context) return undefined;
      return resolveNumberOfExits({
        length: context.length,
        width: context.width,
        isRoom: context.isRoom,
      });
    }
    case 'passageExitLocation': {
      const context = readExitContext(pending.context);
      if (!context) return undefined;
      return resolvePassageExitLocation({ context });
    }
    case 'doorExitLocation': {
      const context = readExitContext(pending.context);
      if (!context) return undefined;
      return resolveDoorExitLocation({ context });
    }
    case 'exitDirection': {
      const context = readExitDirectionContext(pending.context);
      if (!context) return undefined;
      return resolveExitDirection({ context });
    }
    case 'exitAlternative': {
      const exitType = readExitAlternativeContext(pending.context);
      return resolveExitAlternative({
        context: { exitType: exitType ?? undefined },
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

function readExitContext(
  context: unknown
): { index: number; total: number; origin: 'room' | 'chamber' } | undefined {
  if (!isTableContext(context)) return undefined;
  if (context.kind !== 'exit') return undefined;
  const index =
    typeof context.index === 'number' && Number.isInteger(context.index)
      ? context.index
      : undefined;
  const total =
    typeof context.total === 'number' && Number.isInteger(context.total)
      ? context.total
      : undefined;
  const origin = context.origin;
  if (index === undefined || total === undefined) return undefined;
  if (origin !== 'room' && origin !== 'chamber') return undefined;
  return { index, total, origin };
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

function readExitDirectionContext(
  context: unknown
): { index: number; total: number; origin: 'room' | 'chamber' } | undefined {
  if (!isTableContext(context)) return undefined;
  if (context.kind !== 'exitDirection') return undefined;
  const index =
    typeof context.index === 'number' && Number.isInteger(context.index)
      ? context.index
      : undefined;
  const total =
    typeof context.total === 'number' && Number.isInteger(context.total)
      ? context.total
      : undefined;
  const origin = context.origin;
  if (index === undefined || total === undefined) return undefined;
  if (origin !== 'room' && origin !== 'chamber') return undefined;
  return { index, total, origin };
}

function readExitAlternativeContext(
  context: unknown
): 'door' | 'passage' | null {
  if (!isTableContext(context)) return null;
  if (context.kind !== 'exitAlternative') return null;
  return context.exitType === 'door' || context.exitType === 'passage'
    ? context.exitType
    : null;
}

function readTreasureMagicContext(
  context: unknown,
  ancestors: OutcomeEventNode[]
): { level?: number; treasureRoll?: number; rollIndex?: number } {
  if (isTableContext(context) && context.kind === 'treasureMagic') {
    const level = typeof context.level === 'number' ? context.level : undefined;
    const treasureRoll =
      typeof context.treasureRoll === 'number'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      typeof context.rollIndex === 'number' ? context.rollIndex : undefined;
    return { level, treasureRoll, rollIndex };
  }

  let level: number | undefined;
  let treasureRoll: number | undefined;
  let rollIndex: number | undefined;

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor || ancestor.event.kind === undefined) continue;
    const event = ancestor.event as {
      kind: string;
      level?: unknown;
      treasureRoll?: unknown;
      rollIndex?: unknown;
    };

    switch (event.kind) {
      case 'treasure':
      case 'treasureMagicCategory':
      case 'treasurePotion':
      case 'treasureScroll':
      case 'treasureRing':
        if (level === undefined && typeof event.level === 'number') {
          level = event.level;
        }
        if (
          treasureRoll === undefined &&
          typeof event.treasureRoll === 'number'
        ) {
          treasureRoll = event.treasureRoll;
        }
        if (rollIndex === undefined && typeof event.rollIndex === 'number') {
          rollIndex = event.rollIndex;
        }
        break;
      default:
        break;
    }
  }

  return { level, treasureRoll, rollIndex };
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
