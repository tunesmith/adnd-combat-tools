import type { DungeonTableDefinition } from '../../types';
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
  resolveDoorExitLocation,
  resolveExitAlternative,
  resolveExitDirection,
  resolvePassageExitLocation,
  resolveChute,
} from './exitResolvers';
import {
  renderChuteCompact,
  renderChuteDetail,
  buildChutePreview,
} from '../../../adapters/render/chute';
import { wrapResolver, withoutAppend } from '../shared';

export const exitLeafTables: ReadonlyArray<DungeonTableDefinition> = [
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
