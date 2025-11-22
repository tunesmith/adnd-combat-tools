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
  renderNumberOfExitsDetail,
  renderNumberOfExitsCompact,
  buildNumberOfExitsPreview,
} from '../../../adapters/render/numberOfExits';
import {
  resolveEgress,
  resolveNumberOfExits,
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
];
