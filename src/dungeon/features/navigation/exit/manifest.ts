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
import {
  buildEventPreviewFromFactory,
  defineRollOnlyTable,
  markContextualResolution,
  withoutAppend,
  withDefaultResolverOptions,
  wrapResolver,
} from '../../shared';
import { readTableContextOfKind } from '../../../helpers/tableContext';
import {
  getPendingRollArgs,
  getPendingRollTableId,
  getScopedTableSuffix,
} from '../../../domain/pendingRoll';

type EgressResolverOptions = Parameters<typeof resolveEgress>[0];
type NumberOfExitsResolverOptions = Parameters<typeof resolveNumberOfExits>[0];
type ExitLocationContext = NonNullable<
  NonNullable<Parameters<typeof resolvePassageExitLocation>[0]>['context']
>;
type ExitDirectionContext = NonNullable<
  NonNullable<Parameters<typeof resolveExitDirection>[0]>['context']
>;
type ExitAlternativeContext = NonNullable<
  NonNullable<Parameters<typeof resolveExitAlternative>[0]>['context']
>;

const DEFAULT_EGRESS_OPTIONS: EgressResolverOptions = { which: 'one' };
const DEFAULT_NUMBER_OF_EXITS_OPTIONS: NumberOfExitsResolverOptions = {
  length: 10,
  width: 10,
  isRoom: false,
};

export const exitTables: ReadonlyArray<DungeonTableDefinition> = [
  defineRollOnlyTable({
    id: 'stairs',
    heading: 'Stairs',
    event: 'stairs',
    resolve: resolveStairs,
    render: {
      detail: renderStairsDetail,
      compact: withoutAppend((node) => renderStairsCompactNodes(node)),
    },
    preview: buildStairsPreview,
  }),
  markContextualResolution({
    id: 'egress',
    heading: 'Egress',
    resolver: withDefaultResolverOptions(resolveEgress, DEFAULT_EGRESS_OPTIONS),
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
      const key =
        (getScopedTableSuffix(id) as 'one' | 'two' | 'three' | undefined) ||
        'one';
      return resolveEgress({ roll, which: key });
    },
    resolvePending: (pending) => {
      const suffix = getScopedTableSuffix(getPendingRollTableId(pending));
      const which =
        suffix === 'two' ? 'two' : suffix === 'three' ? 'three' : 'one';
      return resolveEgress({ which });
    },
  }),
  markContextualResolution({
    id: 'numberOfExits',
    heading: 'Exits',
    resolver: withDefaultResolverOptions(
      resolveNumberOfExits,
      DEFAULT_NUMBER_OF_EXITS_OPTIONS
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
      return resolveNumberOfExits(
        buildNumberOfExitsResolverOptions(context, roll)
      );
    },
    resolvePending: (pending) =>
      resolveNumberOfExits(
        buildNumberOfExitsResolverOptions(getPendingRollArgs(pending))
      ),
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
        context: readExitContext(getPendingRollArgs(pending)),
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
        context: readExitContext(getPendingRollArgs(pending)),
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
        context: readExitDirectionContext(getPendingRollArgs(pending)),
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
        context: readExitAlternativeContext(getPendingRollArgs(pending)),
      }),
  }),
  defineRollOnlyTable({
    id: 'chute',
    heading: 'Chute',
    event: 'chute',
    resolve: resolveChute,
    render: {
      detail: renderChuteDetail,
      compact: withoutAppend(renderChuteCompact),
    },
    preview: buildChutePreview,
  }),
];

function readExitsContext(
  context: TableContext | undefined
): NumberOfExitsResolverOptions | undefined {
  const exitsContext = readTableContextOfKind(context, 'exits');
  if (!exitsContext) return undefined;
  return {
    length: exitsContext.length,
    width: exitsContext.width,
    isRoom: exitsContext.isRoom,
  };
}

function readExitContext(
  context: TableContext | undefined
): ExitLocationContext | undefined {
  const exitContext = readTableContextOfKind(context, 'exit');
  if (!exitContext) return undefined;
  return {
    index: exitContext.index,
    total: exitContext.total,
    origin: exitContext.origin,
  };
}

function readExitDirectionContext(
  context: TableContext | undefined
): ExitDirectionContext | undefined {
  const exitDirectionContext = readTableContextOfKind(context, 'exitDirection');
  if (!exitDirectionContext) return undefined;
  return {
    index: exitDirectionContext.index,
    total: exitDirectionContext.total,
    origin: exitDirectionContext.origin,
  };
}

function readExitAlternativeContext(
  context: TableContext | undefined
): ExitAlternativeContext | undefined {
  const exitAlternativeContext = readTableContextOfKind(
    context,
    'exitAlternative'
  );
  if (!exitAlternativeContext) return undefined;
  return {
    exitType: exitAlternativeContext.exitType,
  };
}

function buildNumberOfExitsResolverOptions(
  context: TableContext | undefined,
  roll?: number
): NumberOfExitsResolverOptions {
  const exitsContext = readExitsContext(context);
  return {
    roll,
    length: exitsContext?.length ?? DEFAULT_NUMBER_OF_EXITS_OPTIONS.length,
    width: exitsContext?.width ?? DEFAULT_NUMBER_OF_EXITS_OPTIONS.width,
    isRoom: exitsContext?.isRoom ?? DEFAULT_NUMBER_OF_EXITS_OPTIONS.isRoom,
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
