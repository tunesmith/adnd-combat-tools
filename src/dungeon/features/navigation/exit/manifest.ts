import type { DungeonTableDefinition } from '../../types';
import type { TableContext } from '../../../../types/dungeon';
import {
  buildDoorExitLocationPreview,
  buildExitAlternativePreview,
  buildExitDirectionPreview,
  buildPassageExitLocationPreview,
  renderDoorExitLocationCompact,
  renderDoorExitLocationDetail,
  renderExitAlternativeCompact,
  renderExitAlternativeDetail,
  renderExitDirectionCompact,
  renderExitDirectionDetail,
  renderPassageExitLocationCompact,
  renderPassageExitLocationDetail,
} from './exitRender';
import {
  buildStairsPreview,
  renderStairsCompactNodes,
  renderStairsDetail,
} from './stairsRender';
import {
  buildEgressPreview,
  renderEgressCompact,
  renderEgressDetail,
} from './egressRender';
import {
  resolveDoorExitLocation,
  resolveExitAlternative,
  resolveExitDirection,
  resolvePassageExitLocation,
} from './exitLocationResolvers';
import {
  resolveEgress,
  resolveChute,
  resolveStairs,
} from './stairsResolvers';
import { resolveNumberOfExits } from './numberOfExitsResolver';
import {
  renderChuteCompact,
  renderChuteDetail,
  buildChutePreview,
} from './chuteRender';
import {
  renderNumberOfExitsCompact,
  renderNumberOfExitsDetail,
  buildNumberOfExitsPreview,
} from './numberOfExitsRender';
import {
  readExitsContext,
  readExitsContextLocal,
  wrapResolver,
  withoutAppend,
} from '../shared';

export const exitLeafTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'stairs',
    heading: 'Stairs',
    resolver: wrapResolver(resolveStairs),
    renderers: {
      renderDetail: renderStairsDetail,
      renderCompact: withoutAppend((node) => renderStairsCompactNodes(node)),
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
    resolvePending: (pending) => {
      const suffix = pending.table.split(':')[1];
      const which = suffix === 'two' ? 'two' : suffix === 'three' ? 'three' : 'one';
      return resolveEgress({ which });
    },
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
      return resolveNumberOfExits({
        roll,
        length: ctx?.length ?? 10,
        width: ctx?.width ?? 10,
        isRoom: ctx?.isRoom ?? false,
      });
    },
    resolvePending: (pending) => {
      const ctx = readExitsContextLocal(pending.context as TableContext | undefined);
      return resolveNumberOfExits({
        roll: undefined,
        length: ctx?.length ?? 10,
        width: ctx?.width ?? 10,
        isRoom: ctx?.isRoom ?? false,
      });
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
    resolvePending: (pending) =>
      resolvePassageExitLocation({
        context:
          pending.context &&
          (pending.context as { kind?: unknown }).kind === 'exit'
            ? {
                index: (pending.context as { index?: number }).index,
                total: (pending.context as { total?: number }).total,
                origin: (pending.context as { origin?: 'room' | 'chamber' })
                  .origin,
              }
            : undefined,
      }),
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
    resolvePending: (pending) =>
      resolveDoorExitLocation({
        context:
          pending.context &&
          (pending.context as { kind?: unknown }).kind === 'exit'
            ? {
                index: (pending.context as { index?: number }).index,
                total: (pending.context as { total?: number }).total,
                origin: (pending.context as { origin?: 'room' | 'chamber' })
                  .origin,
              }
            : undefined,
      }),
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
    resolvePending: (pending) =>
      resolveExitDirection({
        context:
          pending.context &&
          (pending.context as { kind?: unknown }).kind === 'exitDirection'
            ? {
                index: (pending.context as { index?: number }).index,
                total: (pending.context as { total?: number }).total,
                origin: (pending.context as { origin?: 'room' | 'chamber' })
                  .origin,
              }
            : undefined,
      }),
  },
  {
    id: 'exitAlternative',
    heading: 'Exit Alternative',
    resolver: wrapResolver(resolveExitAlternative),
    renderers: {
      renderDetail: renderExitAlternativeDetail,
      renderCompact: withoutAppend(renderExitAlternativeCompact),
    },
    buildPreview: buildExitAlternativePreview,
    resolvePending: (pending) =>
      resolveExitAlternative({
        context:
          pending.context &&
          (pending.context as { kind?: unknown }).kind === 'exitAlternative'
            ? {
                exitType: (pending.context as { exitType?: 'door' | 'passage' })
                  .exitType,
              }
            : undefined,
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
];
