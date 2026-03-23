import type { DungeonTableDefinition } from '../../types';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../domain/outcome';
import type { TableContext } from '../../../../types/dungeon';
import {
  renderPeriodicCheckDetail,
  renderPeriodicCheckCompact,
  renderWanderingWhereFromDetail,
  renderWanderingWhereFromCompactNodes,
  buildWanderingWhereFromPreview,
} from '../../../adapters/render/periodicOutcome';
import {
  renderDoorBeyondDetail,
  renderDoorBeyondCompact,
} from '../../../adapters/render/doorBeyond';
import {
  resolveDoorBeyond,
  resolvePeriodicCheck,
  resolveRoomDimensions,
  resolveWanderingWhereFrom,
} from '../../../domain/resolvers';
import { withoutAppend } from '../shared';
import { markContextualResolution, wrapResolver } from '../../shared';

const resolvePendingNavigationEntry = (
  pending: string,
  context: TableContext | undefined,
  ancestors: OutcomeEventNode[]
): DungeonOutcomeNode | undefined => {
  const base = pending.split(':')[0] ?? pending;
  switch (base) {
    case 'roomDimensions': {
      const level =
        context &&
        (context as { kind?: string; level?: number }).kind ===
          'chamberDimensions' &&
        true
          ? (context as { level?: number }).level
          : 1;
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
  if (context?.kind === 'wandering') {
    return context.level;
  }
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
    registry: ({ roll, context }) => {
      const c = (context || {}) as { kind?: string; level?: number };
      const level =
        c.kind === 'wandering' && typeof c.level === 'number' ? c.level : 1;
      return resolvePeriodicCheck({ roll, level });
    },
  }),
  {
    id: 'doorBeyond',
    heading: 'Door',
    resolver: wrapResolver(resolveDoorBeyond),
    renderers: {
      renderDetail: renderDoorBeyondDetail,
      renderCompact: withoutAppend(renderDoorBeyondCompact),
    },
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
    registry: ({ roll, context }) =>
      resolveWanderingWhereFrom({
        roll,
        level: context?.kind === 'wandering' ? context.level : 1,
      }),
    resolvePending: (pending, ancestors) =>
      resolvePendingNavigationEntry(
        pending.table,
        pending.context as TableContext | undefined,
        ancestors
      ),
  }),
];
