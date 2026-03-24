import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import { PASSAGE_CONTINUES_SUFFIX } from './render/periodicOutcome';
import {
  renderMonsterDetailNodes,
  renderMonsterCompactNodes,
} from '../features/monsters/render';
import { isTableContext } from '../helpers/outcomeTree';
import type { AppendPreviewFn } from './render/shared';
import {
  ALL_EVENT_PREVIEW_BUILDERS,
  ALL_PREVIEW_FACTORIES,
  ALL_RENDER_ADAPTERS,
} from '../features/bundle';

type OutcomeEventKind = OutcomeEventNode['event']['kind'];

type RenderDetailFn = (
  node: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
) => DungeonRenderNode[];

type RenderCompactFn = (
  node: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
) => DungeonRenderNode[];

type RenderAdapter = {
  renderDetail: RenderDetailFn;
  renderCompact: RenderCompactFn;
};

const monsterAdapter: RenderAdapter = {
  renderDetail: renderMonsterDetailNodes,
  renderCompact: renderMonsterCompactNodes,
};

const RENDER_ADAPTERS: Partial<Record<OutcomeEventKind, RenderAdapter>> = {
  monsterFour: monsterAdapter,
  monsterFive: monsterAdapter,
  monsterSix: monsterAdapter,
  monsterSeven: monsterAdapter,
  monsterEight: monsterAdapter,
  monsterNine: monsterAdapter,
  monsterTen: monsterAdapter,
  dragonFourYounger: monsterAdapter,
  dragonFourOlder: monsterAdapter,
  dragonFiveYounger: monsterAdapter,
  dragonFiveOlder: monsterAdapter,
  dragonSix: monsterAdapter,
  dragonSeven: monsterAdapter,
  dragonEight: monsterAdapter,
  dragonNine: monsterAdapter,
  dragonTen: monsterAdapter,
  human: monsterAdapter,
} as const;

Object.assign(RENDER_ADAPTERS, ALL_RENDER_ADAPTERS);

type PendingPreviewBuilder = (
  tableId: string,
  context?: TableContext
) => DungeonTablePreview | undefined;

const PENDING_PREVIEW_FACTORIES: Record<string, PendingPreviewBuilder> = {};

Object.assign(PENDING_PREVIEW_FACTORIES, ALL_PREVIEW_FACTORIES);

const EVENT_PREVIEW_BUILDERS: Partial<
  Record<
    OutcomeEventKind,
    (
      node: OutcomeEventNode,
      ancestors?: OutcomeEventNode[]
    ) => DungeonTablePreview | undefined
  >
> = {};

Object.assign(EVENT_PREVIEW_BUILDERS, ALL_EVENT_PREVIEW_BUILDERS);

function withTargetId(
  preview: DungeonTablePreview,
  fallback: string
): DungeonTablePreview {
  if (preview.targetId && preview.targetId.length > 0) return preview;
  return { ...preview, targetId: fallback };
}

function previewKey(preview: DungeonTablePreview): string {
  return preview.targetId && preview.targetId.length > 0
    ? preview.targetId
    : preview.id;
}

function extractTableVariant(result: unknown): 'standard' | 'restricted' {
  if (result && typeof result === 'object') {
    const tableVariant = (result as { tableVariant?: unknown }).tableVariant;
    if (tableVariant === 'restricted') {
      return 'restricted';
    }
  }
  return 'standard';
}

function shouldSuppressPreview(
  parentEvent: OutcomeEvent,
  childEvent: OutcomeEvent
): boolean {
  if (childEvent.kind !== parentEvent.kind) return false;
  if (
    childEvent.kind === 'treasureSwordPrimaryAbility' &&
    parentEvent.kind === 'treasureSwordPrimaryAbility'
  ) {
    const parentVariant = extractTableVariant(parentEvent.result);
    const childVariant = extractTableVariant(childEvent.result);
    if (parentVariant === 'standard' && childVariant === 'restricted') {
      return false;
    }
  }
  if (
    childEvent.kind === 'treasureSwordExtraordinaryPower' &&
    parentEvent.kind === 'treasureSwordExtraordinaryPower'
  ) {
    const parentVariant = extractTableVariant(parentEvent.result);
    const childVariant = extractTableVariant(childEvent.result);
    if (parentVariant === 'standard' && childVariant === 'restricted') {
      return false;
    }
  }
  return true;
}

function appendPendingPreviews(
  outcome: DungeonOutcomeNode,
  collector: DungeonRenderNode[],
  seenPreviews?: Set<string>
): void {
  if (outcome.type !== 'event') return;
  const children = outcome.children;
  if (!children || !Array.isArray(children)) return;
  for (const child of children) {
    if (child.type !== 'pending-roll') continue;
    const preview = previewForPending(child);
    if (!preview) continue;
    const normalized = withTargetId(preview, child.id ?? child.table);
    const key = previewKey(normalized);
    if (seenPreviews && seenPreviews.has(key)) continue;
    const alreadyPresent = collector.some((node) => {
      if (node.kind !== 'table-preview') return false;
      const existingKey = previewKey(node);
      return existingKey === key;
    });
    if (!alreadyPresent) {
      collector.push(normalized);
      if (seenPreviews) seenPreviews.add(key);
    }
  }
}

function previewForEventNode(
  node: OutcomeEventNode,
  ancestors: OutcomeEventNode[] = []
): DungeonTablePreview | undefined {
  const featurePreview = EVENT_PREVIEW_BUILDERS[node.event.kind]?.(
    node,
    ancestors
  );
  if (featurePreview) {
    return featurePreview;
  }
  const event = node.event;
  let tableId: string | undefined;
  let context: TableContext | undefined;
  switch (event.kind) {
    case 'periodicCheck':
      tableId = 'periodicCheck';
      break;
    case 'doorBeyond':
      tableId = 'doorBeyond';
      break;
    case 'trickTrap':
      tableId = 'trickTrap';
      break;
    case 'illusionaryWallNature':
      tableId = 'illusionaryWallNature';
      break;
    case 'gasTrapEffect':
      tableId = 'gasTrapEffect';
      break;
    case 'monsterLevel':
      tableId = `monsterLevel:${event.dungeonLevel}`;
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterOne':
      tableId = 'monsterOne';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterTwo':
      tableId = 'monsterTwo';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterThree':
      tableId = 'monsterThree';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterFour':
      tableId = 'monsterFour';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterFive':
      tableId = 'monsterFive';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterSix':
      tableId = 'monsterSix';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterSeven':
      tableId = 'monsterSeven';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterEight':
      tableId = 'monsterEight';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterNine':
      tableId = 'monsterNine';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterTen':
      tableId = 'monsterTen';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonThree':
      tableId = 'dragonThree';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonFourYounger':
      tableId = 'dragonFourYounger';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonFourOlder':
      tableId = 'dragonFourOlder';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonFiveYounger':
      tableId = 'dragonFiveYounger';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonFiveOlder':
      tableId = 'dragonFiveOlder';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonSix':
      tableId = 'dragonSix';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonSeven':
      tableId = 'dragonSeven';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonEight':
      tableId = 'dragonEight';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonNine':
      tableId = 'dragonNine';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonTen':
      tableId = 'dragonTen';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'human':
      tableId = 'human';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    default:
      tableId = undefined;
  }
  if (!tableId) return undefined;
  const preview = previewForPending({
    type: 'pending-roll',
    table: tableId,
    id: node.id,
    context,
  });
  if (!preview) return undefined;
  return withTargetId(preview, node.id ?? tableId);
}

// DETAIL MODE: outcome -> render nodes with previews for staged tables
export function toDetailRender(
  outcome: DungeonOutcomeNode
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const adapter = RENDER_ADAPTERS[outcome.event.kind];
  if (adapter) {
    return adapter.renderDetail(outcome, appendPendingPreviews);
  }
  const monsterNodes = renderMonsterDetailNodes(outcome, appendPendingPreviews);
  if (monsterNodes.length > 0) {
    return monsterNodes;
  }
  return [];
}

export function renderDetailTree(
  outcome: DungeonOutcomeNode,
  includeHeading = true,
  seenPreviews: Set<string> = new Set(),
  ancestors: OutcomeEventNode[] = []
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const preview = previewForEventNode(outcome, ancestors);
  const nodes: DungeonRenderNode[] = [];
  const pendingPreviewIds = new Set<string>();
  if (Array.isArray(outcome.children)) {
    for (const child of outcome.children) {
      if (child.type !== 'pending-roll') continue;
      const pendingPreview = previewForPending(child);
      if (pendingPreview) {
        const normalizedPending = withTargetId(
          pendingPreview,
          child.id ?? child.table
        );
        pendingPreviewIds.add(previewKey(normalizedPending));
      }
    }
  }
  const hasChildEventSameKind = Array.isArray(outcome.children)
    ? outcome.children.some(
        (child): child is OutcomeEventNode =>
          child.type === 'event' &&
          shouldSuppressPreview(outcome.event, child.event)
      )
    : false;
  if (preview && !hasChildEventSameKind) {
    const normalizedPreview = withTargetId(preview, outcome.id ?? preview.id);
    const key = previewKey(normalizedPreview);
    if (!pendingPreviewIds.has(key) && !seenPreviews.has(key)) {
      nodes.push(normalizedPreview);
      seenPreviews.add(key);
    }
  }
  const detailNodes = includeHeading
    ? toDetailRender(outcome)
    : toDetailRender(outcome).filter((n) => n.kind !== 'heading');
  for (const detailNode of detailNodes) {
    if (detailNode.kind === 'table-preview') {
      const normalized = withTargetId(detailNode, outcome.id ?? detailNode.id);
      const key = previewKey(normalized);
      if (seenPreviews.has(key)) continue;
      nodes.push(normalized);
      seenPreviews.add(key);
    } else {
      nodes.push(detailNode);
    }
  }
  if (!outcome.children) return nodes;
  for (const child of outcome.children) {
    if (child.type !== 'event') continue;
    const childRendered = renderDetailTree(child, false, seenPreviews, [
      ...ancestors,
      outcome,
    ]);
    nodes.push(...childRendered);
    // After resolving a Trick/Trap that originates from a periodic check,
    // add the standard continuation note.
    if (
      outcome.event.kind === 'periodicCheck' &&
      child.event.kind === 'trickTrap'
    ) {
      nodes.push({
        kind: 'paragraph',
        text: PASSAGE_CONTINUES_SUFFIX.trimStart(),
      });
    }
  }
  return nodes;
}

function previewForPending(p: PendingRoll): DungeonTablePreview | undefined {
  const base = String(p.table.split(':')[0]);
  const factory = PENDING_PREVIEW_FACTORIES[base];
  if (!factory) return undefined;
  const context = isTableContext(p.context) ? p.context : undefined;
  return factory(p.table, context);
}

// COMPACT MODE: outcome -> render nodes with auto-resolved text (no previews)
export function toCompactRender(
  outcome: DungeonOutcomeNode
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const adapter = RENDER_ADAPTERS[outcome.event.kind];
  if (adapter) {
    return adapter.renderCompact(outcome, appendPendingPreviews);
  }
  const monsterCompactNodes = renderMonsterCompactNodes(
    outcome,
    appendPendingPreviews
  );
  if (monsterCompactNodes.length > 0) {
    return monsterCompactNodes;
  }
  return [];
}
