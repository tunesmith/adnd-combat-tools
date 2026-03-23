import type { DungeonTableDefinition, DetailRenderer } from '../types';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../shared';
import type { OutcomeEventNode } from '../../domain/outcome';
import type { TableContext } from '../../../types/dungeon';
import {
  resolveChamberDimensions,
  resolveChamberRoomContents,
  resolveChamberRoomStairs,
  resolveCircularContents,
  resolveCircularMagicPool,
  resolveCircularPool,
  resolvePoolAlignment,
  resolveRoomDimensions,
  resolveTransporterLocation,
  resolveTransmuteType,
  resolveUnusualShape,
  resolveUnusualSize,
} from '../../domain/resolvers';
import { ChamberRoomContents } from '../../../tables/dungeon/chamberRoomContents';
import {
  buildChamberDimensionsPreview,
  renderChamberDimensionsCompact,
  renderChamberDimensionsDetail,
} from '../../adapters/render/chamberDimensions';
import {
  buildChamberRoomContentsPreview,
  renderChamberRoomContentsCompact,
  renderChamberRoomContentsDetail,
} from '../../adapters/render/chamberRoomContents';
import {
  buildChamberRoomStairsPreview,
  renderChamberRoomStairsCompact,
  renderChamberRoomStairsDetail,
} from '../../adapters/render/chamberRoomStairs';
import {
  buildCircularContentsPreview,
  renderCircularContentsCompact,
  renderCircularContentsDetail,
} from '../../adapters/render/circularContents';
import {
  buildCircularMagicPoolPreview,
  renderCircularMagicPoolCompact,
  renderCircularMagicPoolDetail,
} from '../../adapters/render/magicPool';
import {
  buildCircularPoolPreview,
  renderCircularPoolCompact,
  renderCircularPoolDetail,
} from '../../adapters/render/circularPools';
import {
  buildPoolAlignmentPreview,
  renderPoolAlignmentCompact,
  renderPoolAlignmentDetail,
} from '../../adapters/render/poolAlignment';
import {
  buildRoomDimensionsPreview,
  renderRoomDimensionsCompactNodes,
  renderRoomDimensionsDetail,
} from '../../adapters/render/roomDimensions';
import {
  buildTransporterLocationPreview,
  renderTransporterLocationCompact,
  renderTransporterLocationDetail,
} from '../../adapters/render/transporterLocation';
import {
  buildTransmuteTypePreview,
  renderTransmuteTypeCompact,
  renderTransmuteTypeDetail,
} from '../../adapters/render/transmuteType';
import {
  buildUnusualShapePreview,
  renderUnusualShapeCompact,
  renderUnusualShapeDetail,
} from '../../adapters/render/unusualShape';
import {
  buildUnusualSizePreview,
  renderUnusualSizeCompact,
  renderUnusualSizeDetail,
} from '../../adapters/render/unusualSize';

const withoutAppend =
  (
    renderer: (
      node: Parameters<DetailRenderer>[0]
    ) => ReturnType<DetailRenderer>
  ) =>
  (
    node: Parameters<DetailRenderer>[0],
    _append: Parameters<DetailRenderer>[1]
  ) =>
    renderer(node);

function readDungeonLevelFromId(
  context: unknown,
  id: string,
  fallback: number
): number {
  if (context && typeof context === 'object') {
    const kind = (context as { kind?: unknown }).kind;
    if (
      kind === 'wandering' &&
      typeof (context as { level?: unknown }).level === 'number'
    ) {
      return (context as { level: number }).level;
    }
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

function deriveDungeonLevelFromAncestors(
  ancestors: OutcomeEventNode[]
): number | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (ancestor.event.kind === 'periodicCheck') {
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

function readUnusualSizeContext(
  context: unknown
): { extra: number; isRoom?: boolean } | undefined {
  if (!context || typeof context !== 'object') return undefined;
  const kind = (context as { kind?: unknown }).kind;
  if (kind !== 'unusualSize') return undefined;
  const extra = (context as { extra?: unknown }).extra;
  const isRoom = (context as { isRoom?: unknown }).isRoom;
  if (typeof extra !== 'number') return undefined;
  const normalizedIsRoom =
    isRoom === undefined || typeof isRoom === 'boolean' ? isRoom : undefined;
  return { extra, isRoom: normalizedIsRoom };
}

function readDungeonLevelFromContext(context: unknown): number | undefined {
  if (!context || typeof context !== 'object') return undefined;
  const kind = (context as { kind?: unknown }).kind;
  if (
    (kind === 'wandering' ||
      kind === 'chamberContents' ||
      kind === 'chamberDimensions' ||
      kind === 'treasure') &&
    typeof (context as { level?: unknown }).level === 'number'
  ) {
    return (context as { level: number }).level;
  }
  return undefined;
}

function readDungeonLevelFromNode(node: OutcomeEventNode): number | undefined {
  const eventLevel = (node.event as { level?: unknown }).level;
  if (typeof eventLevel === 'number' && Number.isFinite(eventLevel)) {
    return eventLevel;
  }
  const dungeonLevel = (node.event as { dungeonLevel?: unknown }).dungeonLevel;
  if (typeof dungeonLevel === 'number' && Number.isFinite(dungeonLevel)) {
    return dungeonLevel;
  }
  for (const child of node.children ?? []) {
    if (child.type === 'pending-roll') {
      const pendingLevel = readDungeonLevelFromContext(child.context);
      if (pendingLevel !== undefined) return pendingLevel;
      continue;
    }
    const childLevel = readDungeonLevelFromNode(child);
    if (childLevel !== undefined) return childLevel;
  }
  return undefined;
}

function deriveDungeonLevel(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): number | undefined {
  const level = readDungeonLevelFromNode(node);
  if (level !== undefined) return level;
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    const ancestorLevel = readDungeonLevelFromNode(ancestor);
    if (ancestorLevel !== undefined) return ancestorLevel;
  }
  return undefined;
}

function readForcedContentsFromNode(
  node: OutcomeEventNode
): ChamberRoomContents | undefined {
  for (const child of node.children ?? []) {
    if (
      child.type === 'event' &&
      child.event.kind === 'chamberRoomContents' &&
      child.event.autoResolved
    ) {
      return child.event.result;
    }
  }
  return undefined;
}

function readIsRoomFromNode(node: OutcomeEventNode): boolean | undefined {
  if (node.event.kind === 'roomDimensions') return true;
  if (node.event.kind === 'chamberDimensions') return false;
  if (node.event.kind === 'numberOfExits') return node.event.context.isRoom;
  for (const child of node.children ?? []) {
    if (child.type === 'pending-roll') {
      const context = child.context;
      if (
        context &&
        typeof context === 'object' &&
        (context as { kind?: unknown }).kind === 'exits' &&
        typeof (context as { isRoom?: unknown }).isRoom === 'boolean'
      ) {
        return (context as { isRoom: boolean }).isRoom;
      }
      continue;
    }
    const childIsRoom = readIsRoomFromNode(child);
    if (childIsRoom !== undefined) return childIsRoom;
  }
  return undefined;
}

function deriveIsRoom(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): boolean | undefined {
  const isRoom = readIsRoomFromNode(node);
  if (isRoom !== undefined) return isRoom;
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (ancestor.event.kind === 'roomDimensions') return true;
    if (ancestor.event.kind === 'chamberDimensions') return false;
  }
  return undefined;
}

function buildRoomDimensionsContext(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): Extract<TableContext, { kind: 'chamberDimensions' }> | undefined {
  const level = deriveDungeonLevel(node, ancestors);
  return level === undefined ? undefined : { kind: 'chamberDimensions', level };
}

function buildChamberDimensionsContext(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): Extract<TableContext, { kind: 'chamberDimensions' }> | undefined {
  const level = deriveDungeonLevel(node, ancestors);
  const forcedContents = readForcedContentsFromNode(node);
  if (level === undefined && forcedContents === undefined) return undefined;
  return {
    kind: 'chamberDimensions',
    forcedContents,
    level,
  };
}

function buildChamberRoomContentsContext(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): Extract<TableContext, { kind: 'chamberContents' }> | undefined {
  const level = deriveDungeonLevel(node, ancestors);
  return level === undefined ? undefined : { kind: 'chamberContents', level };
}

function buildWanderingLevelContext(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): Extract<TableContext, { kind: 'wandering' }> | undefined {
  const level = deriveDungeonLevel(node, ancestors);
  return level === undefined ? undefined : { kind: 'wandering', level };
}

function buildUnusualSizeEventContext(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): Extract<TableContext, { kind: 'unusualSize' }> | undefined {
  if (node.event.kind !== 'unusualSize') return undefined;
  return {
    kind: 'unusualSize',
    extra: node.event.extra,
    isRoom: deriveIsRoom(node, ancestors),
  };
}

export const BASE_TABLE_DEFINITIONS: ReadonlyArray<DungeonTableDefinition> = [
  markContextualResolution({
    id: 'roomDimensions',
    heading: 'Room Dimensions',
    resolver: wrapResolver(resolveRoomDimensions),
    renderers: {
      renderDetail: renderRoomDimensionsDetail,
      renderCompact: withoutAppend(renderRoomDimensionsCompactNodes),
    },
    buildPreview: buildRoomDimensionsPreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'roomDimensions'
        ? buildEventPreviewFromFactory(node, buildRoomDimensionsPreview, {
            context: buildRoomDimensionsContext(node, ancestors),
          })
        : undefined,
    registry: ({ roll, context }) => {
      const level =
        context &&
        context.kind === 'chamberDimensions' &&
        context.level !== undefined
          ? context.level
          : 1;
      return resolveRoomDimensions({ roll, level });
    },
    resolvePending: (pending) => {
      const level =
        pending.context &&
        typeof pending.context === 'object' &&
        (pending.context as { kind?: unknown }).kind === 'chamberDimensions' &&
        typeof (pending.context as { level?: unknown }).level === 'number'
          ? (pending.context as { level: number }).level
          : 1;
      return resolveRoomDimensions({ level });
    },
  }),
  markContextualResolution({
    id: 'chamberDimensions',
    heading: 'Chamber Dimensions',
    resolver: wrapResolver(resolveChamberDimensions),
    renderers: {
      renderDetail: renderChamberDimensionsDetail,
      renderCompact: withoutAppend(renderChamberDimensionsCompact),
    },
    buildPreview: buildChamberDimensionsPreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'chamberDimensions'
        ? buildEventPreviewFromFactory(node, buildChamberDimensionsPreview, {
            context: buildChamberDimensionsContext(node, ancestors),
          })
        : undefined,
    registry: ({ roll, context }) => {
      const parsed = readChamberDimensionsContext(context);
      const forcedContents = parsed?.forcedContents;
      const level = parsed?.level;
      const hasContext = forcedContents !== undefined || level !== undefined;
      return resolveChamberDimensions({
        roll,
        context: hasContext ? { forcedContents, level } : undefined,
      });
    },
    resolvePending: (pending, ancestors) => {
      const parsed = readChamberDimensionsContext(pending.context);
      const derivedLevel = deriveDungeonLevelFromAncestors(ancestors);
      const level = parsed?.level !== undefined ? parsed.level : derivedLevel;
      const forcedContents = parsed?.forcedContents;
      const hasContext = forcedContents !== undefined || level !== undefined;
      return resolveChamberDimensions(
        hasContext ? { context: { forcedContents, level } } : undefined
      );
    },
  }),
  markContextualResolution({
    id: 'chamberRoomContents',
    heading: 'Contents',
    resolver: wrapResolver(resolveChamberRoomContents),
    renderers: {
      renderDetail: renderChamberRoomContentsDetail,
      renderCompact: renderChamberRoomContentsCompact,
    },
    buildPreview: buildChamberRoomContentsPreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'chamberRoomContents' && !node.event.autoResolved
        ? buildEventPreviewFromFactory(node, buildChamberRoomContentsPreview, {
            context: buildChamberRoomContentsContext(node, ancestors),
          })
        : undefined,
    registry: ({ roll, context, id }) => {
      const level =
        context && context.kind === 'chamberContents'
          ? context.level
          : readDungeonLevelFromId(context, id, 1);
      return resolveChamberRoomContents({ roll, level });
    },
    resolvePending: (pending, ancestors) => {
      const contextLevel =
        pending.context &&
        typeof pending.context === 'object' &&
        (pending.context as { kind?: unknown }).kind === 'chamberContents' &&
        typeof (pending.context as { level?: unknown }).level === 'number'
          ? (pending.context as { level: number }).level
          : undefined;
      const derivedLevel = deriveDungeonLevelFromAncestors(ancestors);
      const level = contextLevel ?? derivedLevel ?? 1;
      return resolveChamberRoomContents({ level });
    },
  }),
  {
    id: 'chamberRoomStairs',
    heading: 'Stairway',
    resolver: wrapResolver(resolveChamberRoomStairs),
    renderers: {
      renderDetail: renderChamberRoomStairsDetail,
      renderCompact: withoutAppend(renderChamberRoomStairsCompact),
    },
    buildPreview: buildChamberRoomStairsPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'chamberRoomStairs'
        ? buildEventPreviewFromFactory(node, buildChamberRoomStairsPreview)
        : undefined,
    resolvePending: () => resolveChamberRoomStairs({}),
  },
  markContextualResolution({
    id: 'unusualShape',
    heading: 'Unusual Shape',
    resolver: wrapResolver(resolveUnusualShape),
    renderers: {
      renderDetail: renderUnusualShapeDetail,
      renderCompact: withoutAppend(renderUnusualShapeCompact),
    },
    buildPreview: buildUnusualShapePreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'unusualShape'
        ? buildEventPreviewFromFactory(node, buildUnusualShapePreview, {
            context: buildWanderingLevelContext(node, ancestors),
          })
        : undefined,
    registry: ({ roll, context, id }) => {
      const level = readDungeonLevelFromId(context, id, 1);
      return resolveUnusualShape({ roll, level });
    },
    resolvePending: (pending, ancestors) => {
      const level =
        readDungeonLevelFromId(
          pending.context,
          pending.id ?? pending.table,
          deriveDungeonLevelFromAncestors(ancestors) ?? 1
        ) ?? 1;
      return resolveUnusualShape({ level });
    },
  }),
  markContextualResolution({
    id: 'unusualSize',
    heading: 'Unusual Size',
    resolver: wrapResolver(resolveUnusualSize),
    renderers: {
      renderDetail: renderUnusualSizeDetail,
      renderCompact: withoutAppend(renderUnusualSizeCompact),
    },
    buildPreview: buildUnusualSizePreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'unusualSize'
        ? buildEventPreviewFromFactory(node, buildUnusualSizePreview, {
            context: buildUnusualSizeEventContext(node, ancestors),
          })
        : undefined,
    registry: ({ roll, context }) => {
      const parsed = readUnusualSizeContext(context);
      const extra = parsed?.extra ?? 0;
      const isRoom = parsed?.isRoom;
      return resolveUnusualSize({ roll, extra, isRoom });
    },
    resolvePending: (pending) => {
      const parsed = readUnusualSizeContext(pending.context);
      return resolveUnusualSize({
        extra: parsed?.extra,
        isRoom: parsed?.isRoom,
      });
    },
  }),
  markContextualResolution({
    id: 'circularContents',
    heading: 'Circular Contents',
    resolver: wrapResolver(resolveCircularContents),
    renderers: {
      renderDetail: renderCircularContentsDetail,
      renderCompact: renderCircularContentsCompact,
    },
    buildPreview: buildCircularContentsPreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'circularContents'
        ? buildEventPreviewFromFactory(node, buildCircularContentsPreview, {
            context: buildWanderingLevelContext(node, ancestors),
          })
        : undefined,
    registry: ({ roll, context, id }) => {
      const level = readDungeonLevelFromId(context, id, 1);
      return resolveCircularContents({ roll, level });
    },
    resolvePending: (pending, ancestors) => {
      const level =
        readDungeonLevelFromId(
          pending.context,
          pending.id ?? pending.table,
          deriveDungeonLevelFromAncestors(ancestors) ?? 1
        ) ?? 1;
      return resolveCircularContents({ level });
    },
  }),
  markContextualResolution({
    id: 'circularPool',
    heading: 'Pool',
    resolver: wrapResolver(resolveCircularPool),
    renderers: {
      renderDetail: renderCircularPoolDetail,
      renderCompact: renderCircularPoolCompact,
    },
    buildPreview: buildCircularPoolPreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'circularPool'
        ? buildEventPreviewFromFactory(node, buildCircularPoolPreview, {
            context: buildWanderingLevelContext(node, ancestors),
          })
        : undefined,
    registry: ({ roll, context, id }) => {
      const level = readDungeonLevelFromId(context, id, 1);
      return resolveCircularPool({ roll, level });
    },
    resolvePending: (pending, ancestors) => {
      const level =
        readDungeonLevelFromId(
          pending.context,
          pending.id ?? pending.table,
          deriveDungeonLevelFromAncestors(ancestors) ?? 1
        ) ?? 1;
      return resolveCircularPool({ level });
    },
  }),
  {
    id: 'circularMagicPool',
    heading: 'Magic Pool Effect',
    resolver: wrapResolver(resolveCircularMagicPool),
    renderers: {
      renderDetail: renderCircularMagicPoolDetail,
      renderCompact: renderCircularMagicPoolCompact,
    },
    buildPreview: buildCircularMagicPoolPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'circularMagicPool'
        ? buildEventPreviewFromFactory(node, buildCircularMagicPoolPreview)
        : undefined,
    resolvePending: () => resolveCircularMagicPool({}),
  },
  {
    id: 'transmuteType',
    heading: 'Transmutation Type',
    resolver: wrapResolver(resolveTransmuteType),
    renderers: {
      renderDetail: renderTransmuteTypeDetail,
      renderCompact: withoutAppend(renderTransmuteTypeCompact),
    },
    buildPreview: buildTransmuteTypePreview,
    buildEventPreview: (node) =>
      node.event.kind === 'transmuteType'
        ? buildEventPreviewFromFactory(node, buildTransmuteTypePreview)
        : undefined,
    resolvePending: () => resolveTransmuteType({}),
  },
  {
    id: 'poolAlignment',
    heading: 'Pool Alignment',
    resolver: wrapResolver(resolvePoolAlignment),
    renderers: {
      renderDetail: renderPoolAlignmentDetail,
      renderCompact: withoutAppend(renderPoolAlignmentCompact),
    },
    buildPreview: buildPoolAlignmentPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'poolAlignment'
        ? buildEventPreviewFromFactory(node, buildPoolAlignmentPreview)
        : undefined,
    resolvePending: () => resolvePoolAlignment({}),
  },
  {
    id: 'transporterLocation',
    heading: 'Transporter Location',
    resolver: wrapResolver(resolveTransporterLocation),
    renderers: {
      renderDetail: renderTransporterLocationDetail,
      renderCompact: withoutAppend(renderTransporterLocationCompact),
    },
    buildPreview: buildTransporterLocationPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'transporterLocation'
        ? buildEventPreviewFromFactory(node, buildTransporterLocationPreview)
        : undefined,
    resolvePending: () => resolveTransporterLocation({}),
  },
];
