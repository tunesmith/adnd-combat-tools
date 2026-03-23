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
} from './exitLocationRender';
import type { TableContext } from '../../../../types/dungeon';
import {
  buildStairsPreview,
  renderStairsCompactNodes,
  renderStairsDetail,
  buildEgressPreview,
  renderEgressCompact,
  renderEgressDetail,
  renderChuteCompact,
  renderChuteDetail,
  buildChutePreview,
} from './stairsRender';
import {
  resolveDoorExitLocation,
  resolveExitAlternative,
  resolveExitDirection,
  resolvePassageExitLocation,
} from './exitLocationResolvers';
import { resolveEgress, resolveChute, resolveStairs } from './stairsResolvers';
import { resolveNumberOfExits } from './numberOfExitsResolver';
import {
  renderNumberOfExitsCompact,
  renderNumberOfExitsDetail,
  buildNumberOfExitsPreview,
} from './numberOfExitsRender';
import { withoutAppend } from '../shared';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../../shared';

export const exitTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'stairs',
    heading: 'Stairs',
    resolver: wrapResolver(resolveStairs),
    renderers: {
      renderDetail: renderStairsDetail,
      renderCompact: withoutAppend((node) => renderStairsCompactNodes(node)),
    },
    buildPreview: buildStairsPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'stairs'
        ? buildEventPreviewFromFactory(node, buildStairsPreview)
        : undefined,
    resolvePending: () => resolveStairs({}),
  },
  markContextualResolution({
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
    buildEventPreview: (node) =>
      node.event.kind === 'egress'
        ? buildEventPreviewFromFactory(node, buildEgressPreview, {
            tableId: `egress:${node.event.which}`,
          })
        : undefined,
    registry: ({ roll, id }) => {
      const key = (id.split(':')[1] as 'one' | 'two' | 'three') || 'one';
      return resolveEgress({ roll, which: key });
    },
    resolvePending: (pending) => {
      const suffix = pending.table.split(':')[1];
      const which =
        suffix === 'two' ? 'two' : suffix === 'three' ? 'three' : 'one';
      return resolveEgress({ which });
    },
  }),
  markContextualResolution({
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
    buildEventPreview: (node) =>
      node.event.kind === 'numberOfExits'
        ? buildEventPreviewFromFactory(node, buildNumberOfExitsPreview, {
            context: {
              kind: 'exits',
              length: node.event.context.length,
              width: node.event.context.width,
              isRoom: node.event.context.isRoom,
            },
          })
        : undefined,
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
      const ctx = readExitsContextLocal(
        pending.context as TableContext | undefined
      );
      return resolveNumberOfExits({
        roll: undefined,
        length: ctx?.length ?? 10,
        width: ctx?.width ?? 10,
        isRoom: ctx?.isRoom ?? false,
      });
    },
  }),
  markContextualResolution({
    id: 'passageExitLocation',
    heading: 'Passage Exit Location',
    resolver: wrapResolver(resolvePassageExitLocation),
    renderers: {
      renderDetail: renderPassageExitLocationDetail,
      renderCompact: renderPassageExitLocationCompact,
    },
    buildPreview: buildPassageExitLocationPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'passageExitLocation'
        ? buildEventPreviewFromFactory(node, buildPassageExitLocationPreview, {
            context: buildResolvedExitContext(node),
          })
        : undefined,
    registry: ({ roll, context }) =>
      resolvePassageExitLocation({
        roll,
        context: readExitContext(context),
      }),
    resolvePending: (pending) =>
      resolvePassageExitLocation({
        context: readExitContext(pending.context as TableContext | undefined),
      }),
  }),
  markContextualResolution({
    id: 'doorExitLocation',
    heading: 'Door Exit Location',
    resolver: wrapResolver(resolveDoorExitLocation),
    renderers: {
      renderDetail: renderDoorExitLocationDetail,
      renderCompact: renderDoorExitLocationCompact,
    },
    buildPreview: buildDoorExitLocationPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'doorExitLocation'
        ? buildEventPreviewFromFactory(node, buildDoorExitLocationPreview, {
            context: buildResolvedExitContext(node),
          })
        : undefined,
    registry: ({ roll, context }) =>
      resolveDoorExitLocation({
        roll,
        context: readExitContext(context),
      }),
    resolvePending: (pending) =>
      resolveDoorExitLocation({
        context: readExitContext(pending.context as TableContext | undefined),
      }),
  }),
  markContextualResolution({
    id: 'exitDirection',
    heading: 'Exit Direction',
    resolver: wrapResolver(resolveExitDirection),
    renderers: {
      renderDetail: renderExitDirectionDetail,
      renderCompact: renderExitDirectionCompact,
    },
    buildPreview: buildExitDirectionPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'exitDirection'
        ? buildEventPreviewFromFactory(node, buildExitDirectionPreview, {
            context: {
              kind: 'exitDirection',
              index: node.event.index,
              total: node.event.total,
              origin: node.event.origin,
            },
          })
        : undefined,
    registry: ({ roll, context }) =>
      resolveExitDirection({
        roll,
        context: readExitDirectionContext(context),
      }),
    resolvePending: (pending) =>
      resolveExitDirection({
        context: readExitDirectionContext(
          pending.context as TableContext | undefined
        ),
      }),
  }),
  markContextualResolution({
    id: 'exitAlternative',
    heading: 'Exit Alternative',
    resolver: wrapResolver(resolveExitAlternative),
    renderers: {
      renderDetail: renderExitAlternativeDetail,
      renderCompact: withoutAppend(renderExitAlternativeCompact),
    },
    buildPreview: buildExitAlternativePreview,
    buildEventPreview: (node) =>
      node.event.kind === 'exitAlternative'
        ? buildEventPreviewFromFactory(node, buildExitAlternativePreview, {
            context:
              node.event.exitType === undefined
                ? undefined
                : {
                    kind: 'exitAlternative',
                    exitType: node.event.exitType,
                  },
          })
        : undefined,
    registry: ({ roll, context }) =>
      resolveExitAlternative({
        roll,
        context: readExitAlternativeContext(context),
      }),
    resolvePending: (pending) =>
      resolveExitAlternative({
        context: readExitAlternativeContext(
          pending.context as TableContext | undefined
        ),
      }),
  }),
  {
    id: 'chute',
    heading: 'Chute',
    resolver: wrapResolver(resolveChute),
    renderers: {
      renderDetail: renderChuteDetail,
      renderCompact: withoutAppend(renderChuteCompact),
    },
    buildPreview: buildChutePreview,
    buildEventPreview: (node) =>
      node.event.kind === 'chute'
        ? buildEventPreviewFromFactory(node, buildChutePreview)
        : undefined,
    resolvePending: () => resolveChute({}),
  },
];

function readExitsContextLocal(
  context: TableContext | undefined
): { length: number; width: number; isRoom: boolean } | undefined {
  if (!context || typeof context !== 'object') return undefined;
  if ((context as { kind?: unknown }).kind !== 'exits') return undefined;
  const { length, width, isRoom } = context as {
    length?: number;
    width?: number;
    isRoom?: boolean;
  };
  if (
    typeof length !== 'number' ||
    typeof width !== 'number' ||
    typeof isRoom !== 'boolean'
  ) {
    return undefined;
  }
  return { length, width, isRoom };
}

function readExitsContext(
  context: TableContext | undefined
): { length: number; width: number; isRoom: boolean } | undefined {
  if (!context || context.kind !== 'exits') return undefined;
  return {
    length: context.length,
    width: context.width,
    isRoom: context.isRoom,
  };
}

function readExitContext(
  context: TableContext | undefined
): { index?: number; total?: number; origin?: 'room' | 'chamber' } | undefined {
  if (!context || context.kind !== 'exit') return undefined;
  return {
    index: context.index,
    total: context.total,
    origin: context.origin,
  };
}

function readExitDirectionContext(
  context: TableContext | undefined
): { index?: number; total?: number; origin?: 'room' | 'chamber' } | undefined {
  if (!context || context.kind !== 'exitDirection') return undefined;
  return {
    index: context.index,
    total: context.total,
    origin: context.origin,
  };
}

function readExitAlternativeContext(
  context: TableContext | undefined
): { exitType?: 'door' | 'passage' } | undefined {
  if (!context || context.kind !== 'exitAlternative') return undefined;
  return {
    exitType: context.exitType,
  };
}

function buildResolvedExitContext(
  node: Parameters<NonNullable<DungeonTableDefinition['buildEventPreview']>>[0]
): TableContext | undefined {
  if (node.event.kind === 'passageExitLocation') {
    return {
      kind: 'exit',
      exitType: 'passage',
      index: node.event.index,
      total: node.event.total,
      origin: node.event.origin,
    };
  }
  if (node.event.kind === 'doorExitLocation') {
    return {
      kind: 'exit',
      exitType: 'door',
      index: node.event.index,
      total: node.event.total,
      origin: node.event.origin,
    };
  }
  return undefined;
}
