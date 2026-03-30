import type { DungeonTableDefinition } from '../../types';
import {
  buildEventPreviewFromFactory,
  defineRollOnlyTable,
  markContextualResolution,
  withoutAppend,
  wrapResolver,
} from '../../shared';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { TableContext } from '../../../../types/dungeon';
import {
  defineEnvironmentLevelTable,
  deriveEnvironmentDungeonLevel,
  deriveEnvironmentDungeonLevelFromAncestors,
} from '../shared';
import { getPendingRollArgs } from '../../../domain/pendingRoll';
import { readTableContextOfKind } from '../../../helpers/tableContext';
import { ChamberRoomContents } from './roomsChambersTable';
import {
  resolveChamberDimensions,
  resolveChamberRoomContents,
  resolveChamberRoomStairs,
  resolveRoomDimensions,
} from './roomsChambersResolvers';
import { postProcessRoomOrChamberChildren } from './roomsChambersFlow';
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
  defineEnvironmentLevelTable({
    id: 'roomDimensions',
    heading: 'Room Dimensions',
    event: 'roomDimensions',
    resolve: resolveRoomDimensions,
    render: {
      detail: renderRoomDimensionsDetail,
      compact: withoutAppend(renderRoomDimensionsCompactNodes),
    },
    preview: buildRoomDimensionsPreview,
    fallbackLevel: 1,
    buildEventContext: buildRoomDimensionsContext,
    postProcessChildren: postProcessRoomOrChamberChildren,
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
      const parsed = readChamberDimensionsContext(getPendingRollArgs(pending));
      const derivedLevel =
        deriveEnvironmentDungeonLevelFromAncestors(ancestors);
      const level = parsed?.level !== undefined ? parsed.level : derivedLevel;
      const forcedContents = parsed?.forcedContents;
      const hasContext = forcedContents !== undefined || level !== undefined;
      return resolveChamberDimensions(
        hasContext ? { context: { forcedContents, level } } : undefined
      );
    },
    postProcessChildren: postProcessRoomOrChamberChildren,
  }),
  defineEnvironmentLevelTable({
    id: 'chamberRoomContents',
    heading: 'Contents',
    event: 'chamberRoomContents',
    resolve: resolveChamberRoomContents,
    render: {
      detail: renderChamberRoomContentsDetail,
      compact: renderChamberRoomContentsCompact,
    },
    preview: buildChamberRoomContentsPreview,
    fallbackLevel: 1,
    buildEventContext: buildChamberRoomContentsContext,
    shouldBuildEventPreview: (node) =>
      node.event.kind === 'chamberRoomContents' && !node.event.autoResolved,
  }),
  defineRollOnlyTable({
    id: 'chamberRoomStairs',
    heading: 'Stairway',
    event: 'chamberRoomStairs',
    resolve: resolveChamberRoomStairs,
    render: {
      detail: renderChamberRoomStairsDetail,
      compact: withoutAppend(renderChamberRoomStairsCompact),
    },
    preview: buildChamberRoomStairsPreview,
  }),
];
