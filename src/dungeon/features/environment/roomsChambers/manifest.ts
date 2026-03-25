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
  createEnvironmentDungeonLevelContextHandlers,
  deriveEnvironmentDungeonLevel,
  deriveEnvironmentDungeonLevelFromAncestors,
} from '../shared';
import { readTableContextOfKind } from '../../../helpers/tableContext';
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

const roomDimensionsContextHandlers =
  createEnvironmentDungeonLevelContextHandlers(resolveRoomDimensions, 1);
const chamberRoomContentsContextHandlers =
  createEnvironmentDungeonLevelContextHandlers(resolveChamberRoomContents, 1);

function readChamberDimensionsContext(
  context: unknown
): { forcedContents?: ChamberRoomContents; level?: number } | undefined {
  const parsed = readTableContextOfKind(context, 'chamberDimensions');
  if (!parsed) return undefined;
  const result: {
    forcedContents?: ChamberRoomContents;
    level?: number;
  } = {};
  if (typeof parsed.forcedContents === 'number') {
    const numeric = parsed.forcedContents;
    if (
      numeric >= ChamberRoomContents.Empty &&
      numeric <= ChamberRoomContents.Treasure
    ) {
      result.forcedContents = numeric;
    }
  }
  if (typeof parsed.level === 'number' && Number.isFinite(parsed.level)) {
    result.level = parsed.level;
  }
  return result;
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
  const level = deriveEnvironmentDungeonLevel(node, ancestors);
  return level === undefined ? undefined : { kind: 'chamberDimensions', level };
}

function buildChamberDimensionsContext(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): Extract<TableContext, { kind: 'chamberDimensions' }> | undefined {
  const level = deriveEnvironmentDungeonLevel(node, ancestors);
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
  const level = deriveEnvironmentDungeonLevel(node, ancestors);
  return level === undefined ? undefined : { kind: 'chamberContents', level };
}

export const roomsChambersTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    ...roomDimensionsContextHandlers,
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
  },
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
  {
    ...chamberRoomContentsContextHandlers,
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
    buildEventPreview: (node) =>
      node.event.kind === 'chamberRoomStairs'
        ? buildEventPreviewFromFactory(node, buildChamberRoomStairsPreview)
        : undefined,
    resolvePending: () => resolveChamberRoomStairs({}),
  },
];
