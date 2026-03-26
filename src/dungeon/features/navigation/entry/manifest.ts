import type { DungeonTableDefinition } from '../../types';
import type { TableContext } from '../../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../domain/outcome';
import {
  buildDoorBeyondPreview,
  buildPeriodicCheckPreview,
  buildWanderingWhereFromPreview,
  renderDoorBeyondCompact,
  renderDoorBeyondDetail,
  renderPeriodicCheckCompact,
  renderPeriodicCheckDetail,
  renderWanderingWhereFromCompactNodes,
  renderWanderingWhereFromDetail,
} from './entryRender';
import { readTableContextOfKind } from '../../../helpers/tableContext';
import { resolveRoomDimensions } from '../../environment/roomsChambers/roomsChambersResolvers';
import {
  resolveDoorBeyond,
  resolvePeriodicCheck,
  resolveWanderingWhereFrom,
} from './entryResolvers';
import { withoutAppend } from '../shared';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../../shared';

const resolvePendingNavigationEntry = (
  pending: string,
  context: TableContext | undefined,
  ancestors: OutcomeEventNode[]
): DungeonOutcomeNode | undefined => {
  const base = pending.split(':')[0] ?? pending;
  switch (base) {
    case 'roomDimensions': {
      const level =
        readTableContextOfKind(context, 'chamberDimensions')?.level ?? 1;
      return resolveRoomDimensions({ level });
    }
    case 'wanderingWhereFrom':
      return resolveWanderingWhereFrom({
        level: readWanderingLevel(context, ancestors),
      });
    default:
      return undefined;
  }
};

function readWanderingLevel(
  context: TableContext | undefined,
  ancestors: OutcomeEventNode[]
): number {
  const wanderingContext = readTableContextOfKind(context, 'wandering');
  if (wanderingContext) return wanderingContext.level;
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (ancestor.event.kind === 'periodicCheck') {
      return ancestor.event.level;
    }
  }
  return 1;
}

export const entryTables: ReadonlyArray<DungeonTableDefinition> = [
  markContextualResolution({
    id: 'periodicCheck',
    heading: 'Passage',
    resolver: wrapResolver(resolvePeriodicCheck),
    renderers: {
      renderDetail: renderPeriodicCheckDetail,
      renderCompact: withoutAppend(renderPeriodicCheckCompact),
    },
    buildPreview: buildPeriodicCheckPreview,
    registry: ({ roll, context }) =>
      resolvePeriodicCheck({
        roll,
        level: readTableContextOfKind(context, 'wandering')?.level ?? 1,
      }),
  }),
  {
    id: 'doorBeyond',
    heading: 'Door',
    resolver: wrapResolver(resolveDoorBeyond),
    renderers: {
      renderDetail: renderDoorBeyondDetail,
      renderCompact: withoutAppend(renderDoorBeyondCompact),
    },
    buildPreview: buildDoorBeyondPreview,
  },
  markContextualResolution({
    id: 'wanderingWhereFrom',
    heading: 'Where From',
    resolver: wrapResolver(resolveWanderingWhereFrom),
    renderers: {
      renderDetail: renderWanderingWhereFromDetail,
      renderCompact: withoutAppend(renderWanderingWhereFromCompactNodes),
    },
    buildPreview: buildWanderingWhereFromPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'wanderingWhereFrom'
        ? buildEventPreviewFromFactory(node, buildWanderingWhereFromPreview)
        : undefined,
    registry: ({ roll, context }) =>
      resolveWanderingWhereFrom({
        roll,
        level: readTableContextOfKind(context, 'wandering')?.level ?? 1,
      }),
    resolvePending: (pending, ancestors) =>
      resolvePendingNavigationEntry(pending.table, pending.context, ancestors),
  }),
];
