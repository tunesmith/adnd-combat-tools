import type { DungeonTableDefinition } from '../../types';
import {
  buildEventPreviewFromFactory,
  withoutAppend,
  wrapResolver,
} from '../../shared';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { TableContext } from '../../../../types/dungeon';
import { getPendingRollArgs } from '../../../domain/pendingRoll';
import {
  buildEnvironmentWanderingLevelContext,
  defineEnvironmentLevelTable,
} from '../shared';
import { readTableContextOfKind } from '../../../helpers/tableContext';
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
  const parsed = readTableContextOfKind(context, 'unusualSize');
  if (!parsed) return undefined;
  return { extra: parsed.extra, isRoom: parsed.isRoom };
}

function readIsRoomFromNode(node: OutcomeEventNode): boolean | undefined {
  if (node.event.kind === 'roomDimensions') return true;
  if (node.event.kind === 'chamberDimensions') return false;
  if (node.event.kind === 'numberOfExits') return node.event.context.isRoom;
  for (const child of node.children ?? []) {
    if (child.type === 'pending-roll') {
      const exitsContext = readTableContextOfKind(
        getPendingRollArgs(child),
        'exits'
      );
      if (exitsContext) return exitsContext.isRoom;
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
  defineEnvironmentLevelTable({
    id: 'unusualShape',
    heading: 'Unusual Shape',
    event: 'unusualShape',
    resolve: resolveUnusualShape,
    render: {
      detail: renderUnusualShapeDetail,
      compact: withoutAppend(renderUnusualShapeCompact),
    },
    preview: buildUnusualShapePreview,
    fallbackLevel: 1,
    buildEventContext: buildEnvironmentWanderingLevelContext,
  }),
  {
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
      const parsed = readUnusualSizeContext(getPendingRollArgs(pending));
      return resolveUnusualSize({
        extra: parsed?.extra,
        isRoom: parsed?.isRoom,
      });
    },
  },
];
