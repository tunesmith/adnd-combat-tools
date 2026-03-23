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
  resolveCircularContents,
  resolveCircularMagicPool,
  resolveCircularPool,
  resolvePoolAlignment,
  resolveTransporterLocation,
  resolveTransmuteType,
} from './circularPoolsResolvers';
import {
  buildCircularContentsPreview,
  buildCircularMagicPoolPreview,
  buildCircularPoolPreview,
  buildPoolAlignmentPreview,
  buildTransporterLocationPreview,
  buildTransmuteTypePreview,
  renderCircularContentsCompact,
  renderCircularContentsDetail,
  renderCircularMagicPoolCompact,
  renderCircularMagicPoolDetail,
  renderCircularPoolCompact,
  renderCircularPoolDetail,
  renderPoolAlignmentCompact,
  renderPoolAlignmentDetail,
  renderTransporterLocationCompact,
  renderTransporterLocationDetail,
  renderTransmuteTypeCompact,
  renderTransmuteTypeDetail,
} from './circularPoolsRender';

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

function buildWanderingLevelContext(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): Extract<TableContext, { kind: 'wandering' }> | undefined {
  const level = deriveDungeonLevel(node, ancestors);
  return level === undefined ? undefined : { kind: 'wandering', level };
}

export const circularPoolsTables: ReadonlyArray<DungeonTableDefinition> = [
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
      const level = readEnvironmentDungeonLevelFromId(context, id, 1);
      return resolveCircularContents({ roll, level });
    },
    resolvePending: (pending, ancestors) => {
      const level =
        readEnvironmentDungeonLevelFromId(
          pending.context,
          pending.id ?? pending.table,
          deriveEnvironmentDungeonLevelFromAncestors(ancestors) ?? 1
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
      const level = readEnvironmentDungeonLevelFromId(context, id, 1);
      return resolveCircularPool({ roll, level });
    },
    resolvePending: (pending, ancestors) => {
      const level =
        readEnvironmentDungeonLevelFromId(
          pending.context,
          pending.id ?? pending.table,
          deriveEnvironmentDungeonLevelFromAncestors(ancestors) ?? 1
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
