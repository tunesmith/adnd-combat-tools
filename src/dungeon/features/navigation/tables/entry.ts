import type { DungeonTableDefinition } from '../../types';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
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
import { wrapResolver, withoutAppend } from '../shared';

const resolvePendingNavigationEntry = (
  pending: string,
  context: TableContext | undefined
): DungeonOutcomeNode | undefined => {
  const base = pending.split(':')[0] ?? pending;
  switch (base) {
    case 'roomDimensions': {
      const level =
        context &&
        (context as { kind?: string; level?: number }).kind ===
          'chamberDimensions' &&
        typeof (context as { level?: number }).level === 'number'
          ? (context as { level?: number }).level
          : 1;
      return resolveRoomDimensions({ level });
    }
    case 'wanderingWhereFrom':
      return resolveWanderingWhereFrom({});
    default:
      return undefined;
  }
};

export const entryTables: ReadonlyArray<DungeonTableDefinition> = [
  {
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
  },
  {
    id: 'doorBeyond',
    heading: 'Door',
    resolver: wrapResolver(resolveDoorBeyond),
    renderers: {
      renderDetail: renderDoorBeyondDetail,
      renderCompact: withoutAppend(renderDoorBeyondCompact),
    },
  },
  {
    id: 'wanderingWhereFrom',
    heading: 'Where From',
    resolver: wrapResolver(resolveWanderingWhereFrom),
    renderers: {
      renderDetail: renderWanderingWhereFromDetail,
      renderCompact: withoutAppend(renderWanderingWhereFromCompactNodes),
    },
    buildPreview: buildWanderingWhereFromPreview,
    resolvePending: (pending) =>
      resolvePendingNavigationEntry(
        pending.table,
        pending.context as TableContext | undefined
      ),
  },
];
