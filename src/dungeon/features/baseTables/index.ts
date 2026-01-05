import type { DungeonTableDefinition, DetailRenderer } from '../types';
import { wrapResolver } from '../shared';
import type { OutcomeEventNode } from '../../domain/outcome';
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

export const BASE_TABLE_DEFINITIONS: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'roomDimensions',
    heading: 'Room Dimensions',
    resolver: wrapResolver(resolveRoomDimensions),
    renderers: {
      renderDetail: renderRoomDimensionsDetail,
      renderCompact: withoutAppend(renderRoomDimensionsCompactNodes),
    },
    buildPreview: buildRoomDimensionsPreview,
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
  },
  {
    id: 'chamberDimensions',
    heading: 'Chamber Dimensions',
    resolver: wrapResolver(resolveChamberDimensions),
    renderers: {
      renderDetail: renderChamberDimensionsDetail,
      renderCompact: withoutAppend(renderChamberDimensionsCompact),
    },
    buildPreview: buildChamberDimensionsPreview,
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
  },
  {
    id: 'chamberRoomContents',
    heading: 'Contents',
    resolver: wrapResolver(resolveChamberRoomContents),
    renderers: {
      renderDetail: renderChamberRoomContentsDetail,
      renderCompact: renderChamberRoomContentsCompact,
    },
    buildPreview: buildChamberRoomContentsPreview,
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
  },
  {
    id: 'chamberRoomStairs',
    heading: 'Stairway',
    resolver: wrapResolver(resolveChamberRoomStairs),
    renderers: {
      renderDetail: renderChamberRoomStairsDetail,
      renderCompact: withoutAppend(renderChamberRoomStairsCompact),
    },
    buildPreview: buildChamberRoomStairsPreview,
    resolvePending: () => resolveChamberRoomStairs({}),
  },
  {
    id: 'unusualShape',
    heading: 'Unusual Shape',
    resolver: wrapResolver(resolveUnusualShape),
    renderers: {
      renderDetail: renderUnusualShapeDetail,
      renderCompact: withoutAppend(renderUnusualShapeCompact),
    },
    buildPreview: buildUnusualShapePreview,
    resolvePending: () => resolveUnusualShape({}),
  },
  {
    id: 'unusualSize',
    heading: 'Unusual Size',
    resolver: wrapResolver(resolveUnusualSize),
    renderers: {
      renderDetail: renderUnusualSizeDetail,
      renderCompact: withoutAppend(renderUnusualSizeCompact),
    },
    buildPreview: buildUnusualSizePreview,
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
  },
  {
    id: 'circularContents',
    heading: 'Circular Contents',
    resolver: wrapResolver(resolveCircularContents),
    renderers: {
      renderDetail: renderCircularContentsDetail,
      renderCompact: renderCircularContentsCompact,
    },
    buildPreview: buildCircularContentsPreview,
    resolvePending: () => resolveCircularContents({}),
  },
  {
    id: 'circularPool',
    heading: 'Pool',
    resolver: wrapResolver(resolveCircularPool),
    renderers: {
      renderDetail: renderCircularPoolDetail,
      renderCompact: renderCircularPoolCompact,
    },
    buildPreview: buildCircularPoolPreview,
    resolvePending: (_pending, ancestors) => {
      const level = deriveDungeonLevelFromAncestors(ancestors) ?? 1;
      return resolveCircularPool({ level });
    },
  },
  {
    id: 'circularMagicPool',
    heading: 'Magic Pool Effect',
    resolver: wrapResolver(resolveCircularMagicPool),
    renderers: {
      renderDetail: renderCircularMagicPoolDetail,
      renderCompact: renderCircularMagicPoolCompact,
    },
    buildPreview: buildCircularMagicPoolPreview,
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
    resolvePending: () => resolveTransporterLocation({}),
  },
];
