import type { DungeonTableDefinition } from '../../types';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  withoutAppend,
  wrapResolver,
} from '../../shared';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { TableContext } from '../../../../types/dungeon';
import {
  deriveEnvironmentDungeonLevelFromAncestors,
  readEnvironmentDungeonLevelFromId,
} from '../shared';
import { ChamberRoomContents } from './roomsChambersTable';
import {
  resolveChamberDimensions,
  resolveChamberRoomContents,
  resolveChamberRoomStairs,
  resolveRoomDimensions,
} from './roomsChambersResolvers';
import {
  buildChamberDimensionsPreview,
  buildChamberRoomContentsPreview,
  buildChamberRoomStairsPreview,
  buildRoomDimensionsPreview,
  renderChamberDimensionsCompact,
  renderChamberDimensionsDetail,
  renderChamberRoomContentsCompact,
  renderChamberRoomContentsDetail,
  renderChamberRoomStairsCompact,
  renderChamberRoomStairsDetail,
  renderRoomDimensionsCompactNodes,
  renderRoomDimensionsDetail,
} from './roomsChambersRender';

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

export const roomsChambersTables: ReadonlyArray<DungeonTableDefinition> = [
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
      const derivedLevel =
        deriveEnvironmentDungeonLevelFromAncestors(ancestors);
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
          : readEnvironmentDungeonLevelFromId(context, id, 1);
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
      const derivedLevel =
        deriveEnvironmentDungeonLevelFromAncestors(ancestors);
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
];
