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
import {
  resolveUnusualShape,
  resolveUnusualSize,
} from './unusualSpaceResolvers';
import {
  buildUnusualShapePreview,
  buildUnusualSizePreview,
  renderUnusualShapeCompact,
  renderUnusualShapeDetail,
  renderUnusualSizeCompact,
  renderUnusualSizeDetail,
} from './unusualSpaceRender';

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

export const unusualSpaceTables: ReadonlyArray<DungeonTableDefinition> = [
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
      const level = readEnvironmentDungeonLevelFromId(context, id, 1);
      return resolveUnusualShape({ roll, level });
    },
    resolvePending: (pending, ancestors) => {
      const level =
        readEnvironmentDungeonLevelFromId(
          pending.context,
          pending.id ?? pending.table,
          deriveEnvironmentDungeonLevelFromAncestors(ancestors) ?? 1
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
];
