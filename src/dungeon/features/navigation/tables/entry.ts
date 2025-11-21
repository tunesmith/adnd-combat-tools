import type { DungeonTableDefinition } from '../../types';
import type {
  DoorChainLaterality,
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
  renderDoorLocationDetail,
  renderPeriodicDoorOnlyDetail,
  buildDoorLocationPreview,
  buildPeriodicDoorOnlyPreview,
} from '../../../adapters/render/doorLocation';
import {
  renderDoorBeyondDetail,
  renderDoorBeyondCompact,
} from '../../../adapters/render/doorBeyond';
import {
  resolveDoorBeyond,
  resolveDoorLocation,
  resolvePeriodicCheck,
  resolvePeriodicDoorOnly,
  resolveRoomDimensions,
  resolveWanderingWhereFrom,
} from '../../../domain/resolvers';
import {
  collectDoorChainExisting,
  NO_COMPACT_RENDER,
  parseDoorChainSequence,
  wrapResolver,
  withoutAppend,
} from '../shared';

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
        typeof (context as { level?: number }).level === 'number'
          ? (context as { level?: number }).level
          : 1;
      return resolveRoomDimensions({ level });
    }
    case 'doorLocation': {
      const existing = collectDoorChainExisting(ancestors);
      const sequence = parseDoorChainSequence(pending, existing.length);
      return resolveDoorLocation({ existing, sequence });
    }
    case 'periodicCheckDoorOnly': {
      const existing = collectDoorChainExisting(ancestors);
      const sequence = parseDoorChainSequence(pending, existing.length);
      return resolvePeriodicDoorOnly({ existing, sequence });
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
    id: 'periodicCheckDoorOnly',
    heading: 'Periodic Check (doors only)',
    resolver: wrapResolver(resolvePeriodicDoorOnly),
    renderers: {
      renderDetail: renderPeriodicDoorOnlyDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildPeriodicDoorOnlyPreview,
    registry: ({ roll, doorChain, id }) => {
      const existing = (doorChain?.existing as DoorChainLaterality[]) ?? [];
      const sequence =
        doorChain?.sequence ?? parseDoorChainSequence(id, existing.length);
      return resolvePeriodicDoorOnly({ roll, existing, sequence });
    },
    resolvePending: (pending, ancestors) =>
      resolvePendingNavigationEntry(
        pending.table,
        pending.context as TableContext | undefined,
        ancestors
      ),
  },
  {
    id: 'doorLocation',
    heading: 'Door Location',
    resolver: wrapResolver(resolveDoorLocation),
    renderers: {
      renderDetail: renderDoorLocationDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildDoorLocationPreview,
    registry: ({ roll, doorChain, id }) => {
      const existing = (doorChain?.existing as DoorChainLaterality[]) ?? [];
      const sequence =
        doorChain?.sequence ?? parseDoorChainSequence(id, existing.length);
      return resolveDoorLocation({ roll, existing, sequence });
    },
    resolvePending: (pending, ancestors) =>
      resolvePendingNavigationEntry(
        pending.table,
        pending.context as TableContext | undefined,
        ancestors
      ),
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
    resolvePending: (pending, ancestors) =>
      resolvePendingNavigationEntry(
        pending.table,
        pending.context as TableContext | undefined,
        ancestors
      ),
  },
];
