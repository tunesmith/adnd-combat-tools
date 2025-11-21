import type {
  CompactRenderer,
  DetailRenderer,
  DungeonTableDefinition,
} from '../../types';
import type { TableContext } from '../../../../types/dungeon';
import {
  renderStairsDetail,
  renderStairsCompactNodes,
  buildStairsPreview,
} from '../../../adapters/render/stairs';
import {
  renderEgressDetail,
  renderEgressCompact,
  buildEgressPreview,
} from '../../../adapters/render/egress';
import {
  renderChuteDetail,
  renderChuteCompact,
  buildChutePreview,
} from '../../../adapters/render/chute';
import {
  renderNumberOfExitsDetail,
  renderNumberOfExitsCompact,
  buildNumberOfExitsPreview,
} from '../../../adapters/render/numberOfExits';
import {
  renderPassageExitLocationDetail,
  renderPassageExitLocationCompact,
  renderDoorExitLocationDetail,
  renderDoorExitLocationCompact,
  renderExitDirectionDetail,
  renderExitDirectionCompact,
  renderExitAlternativeDetail,
  renderExitAlternativeCompact,
  buildPassageExitLocationPreview,
  buildDoorExitLocationPreview,
  buildExitDirectionPreview,
  buildExitAlternativePreview,
} from '../../../adapters/render/exitLocation';
import {
  resolveChute,
  resolveDoorExitLocation,
  resolveEgress,
  resolveExitAlternative,
  resolveExitDirection,
  resolveNumberOfExits,
  resolvePassageExitLocation,
  resolveStairs,
} from '../../../domain/resolvers';
import { describeChamberDimensions } from '../../../adapters/render/chamberDimensions';
import {
  parseEgressWhich,
  readExitsContext,
  readExitsContextLocal,
  wrapResolver,
  withoutAppend,
} from '../shared';

const renderStairsDetailWithChamberSummary: DetailRenderer = (node, append) =>
  renderStairsDetail(node, append, {
    renderChamberSummary: describeChamberDimensions,
  });

const renderStairsCompactWithChamberSummary: CompactRenderer = (
  node,
  _append
) =>
  renderStairsCompactNodes(node, {
    renderChamberSummary: describeChamberDimensions,
  });

export const exitTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'stairs',
    heading: 'Stairs',
    resolver: wrapResolver(resolveStairs),
    renderers: {
      renderDetail: renderStairsDetailWithChamberSummary,
      renderCompact: renderStairsCompactWithChamberSummary,
    },
    buildPreview: buildStairsPreview,
    resolvePending: () => resolveStairs({}),
  },
  {
    id: 'egress',
    heading: 'Egress',
    resolver: (options) =>
      resolveEgress(
        (options as { roll?: number; which: 'one' | 'two' | 'three' }) ?? {
          which: 'one',
        }
      ),
    renderers: {
      renderDetail: renderEgressDetail,
      renderCompact: withoutAppend(renderEgressCompact),
    },
    buildPreview: buildEgressPreview,
    registry: ({ roll, id }) => {
      const key = (id.split(':')[1] as 'one' | 'two' | 'three') || 'one';
      return resolveEgress({ roll, which: key });
    },
    resolvePending: (pending) =>
      resolveEgress({
        roll: undefined,
        which: parseEgressWhich(pending.table),
      }),
  },
  {
    id: 'chute',
    heading: 'Chute',
    resolver: wrapResolver(resolveChute),
    renderers: {
      renderDetail: renderChuteDetail,
      renderCompact: withoutAppend(renderChuteCompact),
    },
    buildPreview: buildChutePreview,
    resolvePending: () => resolveChute({}),
  },
  {
    id: 'numberOfExits',
    heading: 'Exits',
    resolver: (options) =>
      resolveNumberOfExits(
        (options as {
          roll?: number;
          length: number;
          width: number;
          isRoom: boolean;
        }) ?? { length: 10, width: 10, isRoom: false }
      ),
    renderers: {
      renderDetail: renderNumberOfExitsDetail,
      renderCompact: withoutAppend(renderNumberOfExitsCompact),
    },
    buildPreview: (tableId, context) =>
      buildNumberOfExitsPreview(tableId, context),
    registry: ({ roll, context }) => {
      const ctx = readExitsContext(context);
      if (!ctx) {
        return resolveNumberOfExits({
          roll,
          length: 10,
          width: 10,
          isRoom: false,
        });
      }
      return resolveNumberOfExits({
        roll,
        length: ctx.length,
        width: ctx.width,
        isRoom: ctx.isRoom,
      });
    },
    resolvePending: (pending) => {
      const exits = readExitsContextLocal(
        pending.context as TableContext | undefined
      );
      return resolveNumberOfExits(
        exits ?? { length: 10, width: 10, isRoom: false }
      );
    },
  },
  {
    id: 'passageExitLocation',
    heading: 'Passage Exit Location',
    resolver: wrapResolver(resolvePassageExitLocation),
    renderers: {
      renderDetail: renderPassageExitLocationDetail,
      renderCompact: renderPassageExitLocationCompact,
    },
    buildPreview: buildPassageExitLocationPreview,
    registry: ({ roll, context }) =>
      resolvePassageExitLocation({
        roll,
        context:
          context && context.kind === 'exit'
            ? {
                index: context.index,
                total: context.total,
                origin: context.origin,
              }
            : undefined,
      }),
    resolvePending: (pending) => {
      const ctx = pending.context as {
        kind?: unknown;
        index?: number;
        total?: number;
        origin?: 'room' | 'chamber';
      };
      return resolvePassageExitLocation({
        context:
          ctx && ctx.kind === 'exit'
            ? {
                index: ctx.index,
                total: ctx.total,
                origin: ctx.origin,
              }
            : undefined,
      });
    },
  },
  {
    id: 'doorExitLocation',
    heading: 'Door Exit Location',
    resolver: wrapResolver(resolveDoorExitLocation),
    renderers: {
      renderDetail: renderDoorExitLocationDetail,
      renderCompact: renderDoorExitLocationCompact,
    },
    buildPreview: buildDoorExitLocationPreview,
    registry: ({ roll, context }) =>
      resolveDoorExitLocation({
        roll,
        context:
          context && context.kind === 'exit'
            ? {
                index: context.index,
                total: context.total,
                origin: context.origin,
              }
            : undefined,
      }),
    resolvePending: (pending) => {
      const ctx = pending.context as {
        kind?: unknown;
        index?: number;
        total?: number;
        origin?: 'room' | 'chamber';
      };
      return resolveDoorExitLocation({
        context:
          ctx && ctx.kind === 'exit'
            ? {
                index: ctx.index,
                total: ctx.total,
                origin: ctx.origin,
              }
            : undefined,
      });
    },
  },
  {
    id: 'exitDirection',
    heading: 'Exit Direction',
    resolver: wrapResolver(resolveExitDirection),
    renderers: {
      renderDetail: renderExitDirectionDetail,
      renderCompact: renderExitDirectionCompact,
    },
    buildPreview: buildExitDirectionPreview,
    registry: ({ roll, context }) =>
      resolveExitDirection({
        roll,
        context:
          context && context.kind === 'exitDirection'
            ? {
                index: context.index,
                total: context.total,
                origin: context.origin,
              }
            : undefined,
      }),
    resolvePending: (pending) => {
      const ctx = pending.context as {
        kind?: unknown;
        index?: number;
        total?: number;
        origin?: 'room' | 'chamber';
      };
      return resolveExitDirection({
        context:
          ctx && ctx.kind === 'exitDirection'
            ? {
                index: ctx.index,
                total: ctx.total,
                origin: ctx.origin,
              }
            : undefined,
      });
    },
  },
  {
    id: 'exitAlternative',
    heading: 'Exit Alternative',
    resolver: wrapResolver(resolveExitAlternative),
    renderers: {
      renderDetail: renderExitAlternativeDetail,
      renderCompact: renderExitAlternativeCompact,
    },
    buildPreview: buildExitAlternativePreview,
    registry: ({ roll, context }) =>
      resolveExitAlternative({
        roll,
        context:
          context && context.kind === 'exitAlternative'
            ? { exitType: context.exitType }
            : undefined,
      }),
    resolvePending: (pending) => {
      const ctx = pending.context as {
        kind?: unknown;
        exitType?: 'door' | 'passage';
      };
      return resolveExitAlternative({
        context:
          ctx && ctx.kind === 'exitAlternative'
            ? { exitType: ctx.exitType }
            : undefined,
      });
    },
  },
];
