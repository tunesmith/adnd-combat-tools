import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
} from '../../domain/outcome';
import type { TableContext } from '../../../types/dungeon';
import type { TablePreviewFactory } from '../../adapters/render/shared';
import type {
  CompactRenderer,
  DetailRenderer,
  DungeonTableDefinition,
  DungeonTableFollowup,
  ManualRollResolver,
  PendingResolver,
  RegistryOutcomeBuilder,
} from '../types';
import { buildEventPreviewFromFactory } from '../shared';
import { readTableContextOfKind } from '../../helpers/tableContext';

export function formatOrdinal(level: number): string {
  const remainder = level % 10;
  const teen = Math.floor(level / 10) % 10 === 1;
  const suffix = teen
    ? 'th'
    : remainder === 1
    ? 'st'
    : remainder === 2
    ? 'nd'
    : remainder === 3
    ? 'rd'
    : 'th';
  return `${level}${suffix}`;
}

type TreasureMagicContext = {
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

type TreasureMagicResolverOptions = TreasureMagicContext & {
  roll?: number;
};

type TreasureMagicResolver = (
  options?: TreasureMagicResolverOptions
) => DungeonOutcomeNode;

export type TreasureEvent<
  K extends OutcomeEventWithResultKind = OutcomeEventWithResultKind
> = Extract<OutcomeEventWithResult, { kind: K }> & {
  level: number;
  treasureRoll: number;
  rollIndex?: number;
};

type OutcomeEventWithResult = Extract<OutcomeEvent, { result: unknown }>;
type OutcomeEventWithResultKind = OutcomeEventWithResult['kind'];

export type TreasureEventKind = OutcomeEventWithResultKind;

type TreasureSubtableOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function buildTreasureEvent<K extends OutcomeEventWithResultKind>(
  kind: K,
  result: Extract<OutcomeEventWithResult, { kind: K }>['result'],
  roll: number,
  options?: TreasureSubtableOptions
): TreasureEvent<K> {
  return {
    kind,
    result,
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? roll,
    rollIndex: options?.rollIndex,
  } as TreasureEvent<K>;
}

export function createTreasureMagicContextHandlers(
  resolver: TreasureMagicResolver
): {
  manualResolution: 'contextual';
  resolvePending: PendingResolver;
  registry: RegistryOutcomeBuilder;
} {
  return {
    manualResolution: 'contextual',
    resolvePending: (pending, ancestors) => {
      const options = readTreasureMagicContext(pending.context, ancestors);
      return resolver(options);
    },
    registry: ({ roll, context }) => {
      const options = readTreasureMagicRegistryContext(context);
      return resolver({ roll, ...options });
    },
  };
}

export function createTreasureMagicEventPreviewBuilder(
  kind: TreasureEventKind,
  buildPreview: TablePreviewFactory
) {
  return (node: OutcomeEventNode, ancestors: OutcomeEventNode[] = []) =>
    node.event.kind === kind
      ? buildEventPreviewFromFactory(node, buildPreview, {
          context:
            buildTreasureMagicEventContext(node) ??
            buildTreasureMagicPreviewContextFromAncestors(ancestors),
        })
      : undefined;
}

export function createTreasureEventPreviewBuilder(
  buildPreview: TablePreviewFactory
) {
  return (node: OutcomeEventNode) =>
    node.event.kind === 'treasure'
      ? buildEventPreviewFromFactory(node, buildPreview, {
          context: {
            kind: 'treasure',
            level: node.event.level,
            withMonster: node.event.withMonster,
            rollIndex: node.event.rollIndex,
            totalRolls: node.event.totalRolls,
          },
        })
      : undefined;
}

type TreasureProtectionEventKind =
  | 'treasureProtectionType'
  | 'treasureProtectionGuardedBy'
  | 'treasureProtectionHiddenBy';

export function createTreasureProtectionEventPreviewBuilder(
  kind: TreasureProtectionEventKind,
  buildPreview: TablePreviewFactory
) {
  return (node: OutcomeEventNode) =>
    node.event.kind === kind
      ? buildEventPreviewFromFactory(node, buildPreview, {
          context: {
            kind: 'treasureProtection',
            treasureRoll: node.roll,
          },
        })
      : undefined;
}

type TreasureRenderConfig = {
  detail: DetailRenderer;
  compact: CompactRenderer;
};

export function defineTreasureMagicTable<TResult = unknown>(options: {
  id: string;
  heading: string;
  event: TreasureEventKind;
  resolve: TreasureMagicResolver;
  render: TreasureRenderConfig;
  preview: TablePreviewFactory;
  followups?: ReadonlyArray<DungeonTableFollowup<TResult>>;
}): DungeonTableDefinition<TreasureMagicResolverOptions> {
  return {
    id: options.id,
    heading: options.heading,
    resolver: options.resolve,
    ...createTreasureMagicContextHandlers(options.resolve),
    renderers: {
      renderDetail: options.render.detail,
      renderCompact: options.render.compact,
    },
    buildPreview: options.preview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      options.event,
      options.preview
    ),
    followups: options.followups,
  };
}

export function defineTreasureFollowupTable<TResult = unknown>(options: {
  id: string;
  heading: string;
  event: TreasureEventKind;
  resolve: ManualRollResolver;
  render: TreasureRenderConfig;
  preview: TablePreviewFactory;
  followups?: ReadonlyArray<DungeonTableFollowup<TResult>>;
}): DungeonTableDefinition {
  return {
    id: options.id,
    heading: options.heading,
    resolver: options.resolve,
    renderers: {
      renderDetail: options.render.detail,
      renderCompact: options.render.compact,
    },
    buildPreview: options.preview,
    buildEventPreview: (node) =>
      node.event.kind === options.event
        ? buildEventPreviewFromFactory(node, options.preview)
        : undefined,
    resolvePending: () => options.resolve({}),
    followups: options.followups,
  };
}

function readTreasureMagicRegistryContext(
  context?: TableContext
): TreasureMagicContext {
  return readTreasureMagicContextFromContext(context) ?? {};
}

function readTreasureMagicContext(
  context: TableContext | undefined,
  ancestors: OutcomeEventNode[]
): TreasureMagicContext {
  const direct = readTreasureMagicContextFromContext(context);
  if (direct) return direct;
  return readTreasureMagicContextFromAncestors(ancestors);
}

function readTreasureMagicContextFromAncestors(
  ancestors: OutcomeEventNode[]
): TreasureMagicContext {
  let level: number | undefined;
  let treasureRoll: number | undefined;
  let rollIndex: number | undefined;

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor || ancestor.event.kind === undefined) continue;
    const event = ancestor.event as {
      kind: string;
      level?: unknown;
      treasureRoll?: unknown;
      rollIndex?: unknown;
    };

    switch (event.kind) {
      case 'treasure':
      case 'treasureMagicCategory':
      case 'treasurePotion':
      case 'treasureScroll':
      case 'treasureRing':
      case 'treasureRodStaffWand':
      case 'treasureMiscMagicE1':
      case 'treasureMiscMagicE2':
      case 'treasureMiscMagicE3':
      case 'treasureMiscMagicE4':
      case 'treasureMiscMagicE5':
      case 'treasureArmorShields':
      case 'treasureSwords':
      case 'treasureMiscWeapons': {
        if (level === undefined && typeof event.level === 'number') {
          level = event.level;
        }
        if (
          treasureRoll === undefined &&
          typeof event.treasureRoll === 'number'
        ) {
          treasureRoll = event.treasureRoll;
        }
        if (rollIndex === undefined && typeof event.rollIndex === 'number') {
          rollIndex = event.rollIndex;
        }
        break;
      }
      default:
        break;
    }
  }

  return { level, treasureRoll, rollIndex };
}

function readTreasureMagicContextFromContext(
  context: TableContext | undefined
): TreasureMagicContext | undefined {
  const parsed = readTableContextOfKind(context, 'treasureMagic');
  if (!parsed) return undefined;
  return {
    level: parsed.level,
    treasureRoll: parsed.treasureRoll,
    rollIndex: parsed.rollIndex,
  };
}

function buildTreasureMagicEventContext(
  node: OutcomeEventNode
): Extract<TableContext, { kind: 'treasureMagic' }> | undefined {
  const event = node.event as {
    level?: unknown;
    treasureRoll?: unknown;
    rollIndex?: unknown;
  };
  if (
    typeof event.level !== 'number' ||
    typeof event.treasureRoll !== 'number'
  ) {
    return undefined;
  }
  return {
    kind: 'treasureMagic',
    level: event.level,
    treasureRoll: event.treasureRoll,
    rollIndex:
      typeof event.rollIndex === 'number' ? event.rollIndex : undefined,
  };
}

function buildTreasureMagicPreviewContextFromAncestors(
  ancestors: OutcomeEventNode[]
): Extract<TableContext, { kind: 'treasureMagic' }> | undefined {
  const context = readTreasureMagicContextFromAncestors(ancestors);
  if (
    typeof context.level !== 'number' ||
    typeof context.treasureRoll !== 'number'
  ) {
    return undefined;
  }
  return {
    kind: 'treasureMagic',
    level: context.level,
    treasureRoll: context.treasureRoll,
    rollIndex: context.rollIndex,
  };
}
