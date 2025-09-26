import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import {
  renderPeriodicCheckDetail,
  renderPeriodicCheckCompact,
  renderWanderingWhereFromDetail,
  renderWanderingWhereFromCompactNodes,
  buildWanderingWhereFromPreview,
} from './render/periodicOutcome';
import {
  renderDoorLocationDetail,
  renderPeriodicDoorOnlyDetail,
  buildDoorLocationPreview,
  buildPeriodicDoorOnlyPreview,
} from './render/doorLocation';
import {
  renderDoorBeyondDetail,
  renderDoorBeyondCompact,
} from './render/doorBeyond';
import {
  renderSidePassagesDetail,
  renderSidePassagesCompactNodes,
  buildSidePassagePreview,
} from './render/sidePassage';
import {
  renderPassageTurnsDetail,
  renderPassageTurnsCompactNodes,
  buildPassageTurnPreview,
} from './render/passageTurns';
import {
  renderPassageWidthDetail,
  renderPassageWidthCompactNodes,
  buildPassageWidthPreview,
} from './render/passageWidth';
import {
  renderRoomDimensionsDetail,
  renderRoomDimensionsCompactNodes,
  buildRoomDimensionsPreview,
} from './render/roomDimensions';
import {
  renderChamberDimensionsDetail,
  describeChamberDimensions,
  renderChamberDimensionsCompact,
  buildChamberDimensionsPreview,
} from './render/chamberDimensions';
import {
  renderCircularPoolDetail,
  renderCircularPoolCompact,
  buildCircularPoolPreview,
} from './render/circularPools';
import {
  renderCircularMagicPoolDetail,
  renderCircularMagicPoolCompact,
  buildCircularMagicPoolPreview,
} from './render/magicPool';
import {
  renderTransmuteTypeDetail,
  renderTransmuteTypeCompact,
  buildTransmuteTypePreview,
} from './render/transmuteType';
import {
  renderPoolAlignmentDetail,
  renderPoolAlignmentCompact,
  buildPoolAlignmentPreview,
} from './render/poolAlignment';
import {
  renderTransporterLocationDetail,
  renderTransporterLocationCompact,
  buildTransporterLocationPreview,
} from './render/transporterLocation';
import {
  renderSpecialPassageDetail,
  renderSpecialPassageCompactNodes,
  renderGalleryStairLocationDetail,
  renderGalleryStairLocationCompact,
  renderGalleryStairOccurrenceDetail,
  renderGalleryStairOccurrenceCompact,
  renderRiverConstructionDetail,
  renderRiverConstructionCompact,
  buildSpecialPassagePreview,
  buildGalleryStairLocationPreview,
  buildGalleryStairOccurrencePreview,
  buildStreamConstructionPreview,
  buildRiverConstructionPreview,
  buildRiverBoatBankPreview,
} from './render/specialPassage';
import {
  renderChasmDepthDetail,
  renderChasmConstructionDetail,
  renderJumpingPlaceWidthDetail,
  buildChasmDepthPreview,
  buildChasmConstructionPreview,
  buildJumpingPlaceWidthPreview,
} from './render/chasm';
import {
  renderStairsDetail,
  renderStairsCompactNodes,
  buildStairsPreview,
} from './render/stairs';
import {
  renderEgressDetail,
  renderEgressCompact,
  buildEgressPreview,
} from './render/egress';
import {
  renderChuteDetail,
  renderChuteCompact,
  buildChutePreview,
} from './render/chute';
import {
  renderNumberOfExitsDetail,
  renderNumberOfExitsCompact,
  buildNumberOfExitsPreview,
} from './render/numberOfExits';
import {
  renderUnusualSizeDetail,
  renderUnusualSizeCompact,
  buildUnusualSizePreview,
} from './render/unusualSize';
import {
  renderUnusualShapeDetail,
  renderUnusualShapeCompact,
  buildUnusualShapePreview,
} from './render/unusualShape';
import {
  renderTrickTrapDetail,
  buildTrickTrapPreview,
} from './render/trickTrap';
import {
  buildMonsterPreview,
  renderMonsterDetailNodes,
  renderMonsterCompactNodes,
} from './render/monsters';
import { isTableContext } from '../helpers/outcomeTree';
import {
  buildCircularContentsPreview,
  renderCircularContentsCompact,
  renderCircularContentsDetail,
} from './render/circularContents';
import type { AppendPreviewFn } from './render/shared';
import {
  renderIllusoryWallNatureDetail,
  renderIllusoryWallNatureCompact,
  buildIllusoryWallNaturePreview,
} from './render/illusoryWallNature';
import {
  renderGasTrapEffectDetail,
  renderGasTrapEffectCompact,
  buildGasTrapEffectPreview,
} from './render/gasTrapEffect';

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

const NO_COMPACT_RENDER: RenderCompactFn = (_node, _append) => [];

const withoutAppend =
  (
    renderer: (node: OutcomeEventNode) => DungeonRenderNode[]
  ): RenderCompactFn =>
  (node, _append) =>
    renderer(node);

const renderStairsDetailWithChamberSummary: RenderDetailFn = (node, append) =>
  renderStairsDetail(node, append, {
    renderChamberSummary: describeChamberDimensions,
  });

const renderStairsCompactWithChamberSummary: RenderCompactFn = withoutAppend(
  (node) =>
    renderStairsCompactNodes(node, {
      renderChamberSummary: describeChamberDimensions,
    })
);

const monsterAdapter: RenderAdapter = {
  renderDetail: renderMonsterDetailNodes,
  renderCompact: renderMonsterCompactNodes,
};

const RENDER_ADAPTERS: Partial<Record<OutcomeEventKind, RenderAdapter>> = {
  periodicCheck: {
    renderDetail: renderPeriodicCheckDetail,
    renderCompact: withoutAppend(renderPeriodicCheckCompact),
  },
  doorBeyond: {
    renderDetail: renderDoorBeyondDetail,
    renderCompact: withoutAppend(renderDoorBeyondCompact),
  },
  doorLocation: {
    renderDetail: renderDoorLocationDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  periodicCheckDoorOnly: {
    renderDetail: renderPeriodicDoorOnlyDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  sidePassages: {
    renderDetail: renderSidePassagesDetail,
    renderCompact: withoutAppend(renderSidePassagesCompactNodes),
  },
  passageTurns: {
    renderDetail: renderPassageTurnsDetail,
    renderCompact: withoutAppend(renderPassageTurnsCompactNodes),
  },
  passageWidth: {
    renderDetail: renderPassageWidthDetail,
    renderCompact: withoutAppend(renderPassageWidthCompactNodes),
  },
  roomDimensions: {
    renderDetail: renderRoomDimensionsDetail,
    renderCompact: withoutAppend(renderRoomDimensionsCompactNodes),
  },
  chamberDimensions: {
    renderDetail: renderChamberDimensionsDetail,
    renderCompact: withoutAppend(renderChamberDimensionsCompact),
  },
  circularContents: {
    renderDetail: renderCircularContentsDetail,
    renderCompact: renderCircularContentsCompact,
  },
  circularPool: {
    renderDetail: renderCircularPoolDetail,
    renderCompact: renderCircularPoolCompact,
  },
  circularMagicPool: {
    renderDetail: renderCircularMagicPoolDetail,
    renderCompact: renderCircularMagicPoolCompact,
  },
  transmuteType: {
    renderDetail: renderTransmuteTypeDetail,
    renderCompact: withoutAppend(renderTransmuteTypeCompact),
  },
  poolAlignment: {
    renderDetail: renderPoolAlignmentDetail,
    renderCompact: withoutAppend(renderPoolAlignmentCompact),
  },
  transporterLocation: {
    renderDetail: renderTransporterLocationDetail,
    renderCompact: withoutAppend(renderTransporterLocationCompact),
  },
  specialPassage: {
    renderDetail: renderSpecialPassageDetail,
    renderCompact: withoutAppend(renderSpecialPassageCompactNodes),
  },
  galleryStairLocation: {
    renderDetail: renderGalleryStairLocationDetail,
    renderCompact: renderGalleryStairLocationCompact,
  },
  galleryStairOccurrence: {
    renderDetail: renderGalleryStairOccurrenceDetail,
    renderCompact: withoutAppend(renderGalleryStairOccurrenceCompact),
  },
  riverConstruction: {
    renderDetail: renderRiverConstructionDetail,
    renderCompact: renderRiverConstructionCompact,
  },
  chasmDepth: {
    renderDetail: renderChasmDepthDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  chasmConstruction: {
    renderDetail: renderChasmConstructionDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  jumpingPlaceWidth: {
    renderDetail: renderJumpingPlaceWidthDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  stairs: {
    renderDetail: renderStairsDetailWithChamberSummary,
    renderCompact: renderStairsCompactWithChamberSummary,
  },
  egress: {
    renderDetail: renderEgressDetail,
    renderCompact: withoutAppend(renderEgressCompact),
  },
  chute: {
    renderDetail: renderChuteDetail,
    renderCompact: withoutAppend(renderChuteCompact),
  },
  numberOfExits: {
    renderDetail: renderNumberOfExitsDetail,
    renderCompact: withoutAppend(renderNumberOfExitsCompact),
  },
  unusualShape: {
    renderDetail: renderUnusualShapeDetail,
    renderCompact: withoutAppend(renderUnusualShapeCompact),
  },
  unusualSize: {
    renderDetail: renderUnusualSizeDetail,
    renderCompact: withoutAppend(renderUnusualSizeCompact),
  },
  trickTrap: {
    renderDetail: renderTrickTrapDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  wanderingWhereFrom: {
    renderDetail: renderWanderingWhereFromDetail,
    renderCompact: withoutAppend(renderWanderingWhereFromCompactNodes),
  },
  illusoryWallNature: {
    renderDetail: renderIllusoryWallNatureDetail,
    renderCompact: renderIllusoryWallNatureCompact,
  },
  gasTrapEffect: {
    renderDetail: renderGasTrapEffectDetail,
    renderCompact: renderGasTrapEffectCompact,
  },
  monsterLevel: monsterAdapter,
  monsterOne: monsterAdapter,
  monsterTwo: monsterAdapter,
  monsterThree: monsterAdapter,
  monsterFour: monsterAdapter,
  monsterFive: monsterAdapter,
  monsterSix: monsterAdapter,
  dragonThree: monsterAdapter,
  dragonFourYounger: monsterAdapter,
  dragonFourOlder: monsterAdapter,
  dragonFiveYounger: monsterAdapter,
  dragonFiveOlder: monsterAdapter,
  dragonSix: monsterAdapter,
  human: monsterAdapter,
} as const;

type PendingPreviewBuilder = (
  tableId: string,
  context?: TableContext
) => DungeonTablePreview | undefined;

const PENDING_PREVIEW_FACTORIES: Record<string, PendingPreviewBuilder> = {
  doorLocation: buildDoorLocationPreview,
  periodicCheckDoorOnly: buildPeriodicDoorOnlyPreview,
  sidePassages: buildSidePassagePreview,
  passageTurns: buildPassageTurnPreview,
  passageWidth: buildPassageWidthPreview,
  roomDimensions: buildRoomDimensionsPreview,
  chamberDimensions: buildChamberDimensionsPreview,
  numberOfExits: (tableId, context) =>
    buildNumberOfExitsPreview(tableId, context),
  unusualShape: buildUnusualShapePreview,
  unusualSize: (tableId, context) => buildUnusualSizePreview(tableId, context),
  stairs: buildStairsPreview,
  specialPassage: buildSpecialPassagePreview,
  egress: buildEgressPreview,
  chute: buildChutePreview,
  wanderingWhereFrom: buildWanderingWhereFromPreview,
  galleryStairLocation: buildGalleryStairLocationPreview,
  galleryStairOccurrence: buildGalleryStairOccurrencePreview,
  circularContents: buildCircularContentsPreview,
  circularPool: buildCircularPoolPreview,
  circularMagicPool: buildCircularMagicPoolPreview,
  transmuteType: buildTransmuteTypePreview,
  poolAlignment: buildPoolAlignmentPreview,
  transporterLocation: buildTransporterLocationPreview,
  streamConstruction: buildStreamConstructionPreview,
  riverConstruction: buildRiverConstructionPreview,
  riverBoatBank: buildRiverBoatBankPreview,
  chasmDepth: buildChasmDepthPreview,
  chasmConstruction: buildChasmConstructionPreview,
  jumpingPlaceWidth: buildJumpingPlaceWidthPreview,
  trickTrap: buildTrickTrapPreview,
  illusoryWallNature: buildIllusoryWallNaturePreview,
  gasTrapEffect: buildGasTrapEffectPreview,
};

const MONSTER_PREVIEW_BASES = [
  'monsterLevel',
  'monsterOne',
  'monsterTwo',
  'monsterThree',
  'monsterFour',
  'monsterFive',
  'monsterSix',
  'dragonThree',
  'dragonFourYounger',
  'dragonFourOlder',
  'dragonFiveYounger',
  'dragonFiveOlder',
  'dragonSix',
  'human',
];

for (const base of MONSTER_PREVIEW_BASES) {
  PENDING_PREVIEW_FACTORIES[base] = (tableId, context) =>
    buildMonsterPreview(tableId, context);
}

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
  node: OutcomeEventNode
): DungeonTablePreview | undefined {
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
    case 'doorLocation':
      tableId = `doorLocation:${event.sequence}`;
      break;
    case 'periodicCheckDoorOnly':
      tableId = `periodicCheckDoorOnly:${event.sequence}`;
      break;
    case 'sidePassages':
      tableId = 'sidePassages';
      break;
    case 'passageTurns':
      tableId = 'passageTurns';
      break;
    case 'passageWidth':
      tableId = 'passageWidth';
      break;
    case 'roomDimensions':
      tableId = 'roomDimensions';
      break;
    case 'chamberDimensions':
      tableId = 'chamberDimensions';
      break;
    case 'circularContents':
      tableId = 'circularContents';
      break;
    case 'circularPool':
      tableId = 'circularPool';
      break;
    case 'circularMagicPool':
      tableId = 'circularMagicPool';
      break;
    case 'transmuteType':
      tableId = 'transmuteType';
      break;
    case 'poolAlignment':
      tableId = 'poolAlignment';
      break;
    case 'transporterLocation':
      tableId = 'transporterLocation';
      break;
    case 'specialPassage':
      tableId = 'specialPassage';
      break;
    case 'stairs':
      tableId = 'stairs';
      break;
    case 'trickTrap':
      tableId = 'trickTrap';
      break;
    case 'illusoryWallNature':
      tableId = 'illusoryWallNature';
      break;
    case 'gasTrapEffect':
      tableId = 'gasTrapEffect';
      break;
    case 'egress':
      tableId = `egress:${event.which}`;
      break;
    case 'chute':
      tableId = 'chute';
      break;
    case 'numberOfExits':
      tableId = 'numberOfExits';
      context = {
        kind: 'exits',
        length: event.context.length,
        width: event.context.width,
        isRoom: event.context.isRoom,
      };
      break;
    case 'unusualShape':
      tableId = 'unusualShape';
      break;
    case 'unusualSize':
      tableId = 'unusualSize';
      break;
    case 'wanderingWhereFrom':
      tableId = 'wanderingWhereFrom';
      break;
    case 'galleryStairLocation':
      tableId = 'galleryStairLocation';
      break;
    case 'galleryStairOccurrence':
      tableId = 'galleryStairOccurrence';
      break;
    case 'streamConstruction':
      tableId = 'streamConstruction';
      break;
    case 'riverConstruction':
      tableId = 'riverConstruction';
      break;
    case 'riverBoatBank':
      tableId = 'riverBoatBank';
      break;
    case 'chasmDepth':
      tableId = 'chasmDepth';
      break;
    case 'chasmConstruction':
      tableId = 'chasmConstruction';
      break;
    case 'jumpingPlaceWidth':
      tableId = 'jumpingPlaceWidth';
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
  seenPreviews: Set<string> = new Set()
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const preview = previewForEventNode(outcome);
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
          child.type === 'event' && child.event.kind === outcome.event.kind
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
    nodes.push(...renderDetailTree(child, false, seenPreviews));
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
