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
  renderDoorBeyondCompactNodes,
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
  renderChamberDimensionsCompact,
  renderChamberDimensionsCompactNodes,
  buildChamberDimensionsPreview,
} from './render/chamberDimensions';
import {
  renderCircularContentsDetail,
  renderCircularContentsCompact,
  renderCircularPoolDetail,
  renderCircularPoolCompact,
  buildCircularContentsPreview,
  buildCircularPoolPreview,
} from './render/circularPools';
import {
  renderCircularMagicPoolDetail,
  renderCircularMagicPoolCompact,
  renderTransmuteTypeDetail,
  renderTransmuteTypeCompact,
  renderPoolAlignmentDetail,
  renderPoolAlignmentCompact,
  renderTransporterLocationDetail,
  renderTransporterLocationCompact,
  buildCircularMagicPoolPreview,
  buildTransmuteTypePreview,
  buildPoolAlignmentPreview,
  buildTransporterLocationPreview,
} from './render/magicPool';
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
// detail-mode preview helpers remain for other flows; compact composition is local
import { isTableContext } from '../helpers/outcomeTree';

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
  const { event } = outcome;
  if (event.kind === 'periodicCheck') {
    return renderPeriodicCheckDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'doorBeyond') {
    return renderDoorBeyondDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'doorLocation') {
    return renderDoorLocationDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'periodicCheckDoorOnly') {
    return renderPeriodicDoorOnlyDetail(outcome, appendPendingPreviews);
  }
  if (outcome.event.kind === 'passageWidth') {
    return renderPassageWidthDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'sidePassages') {
    return renderSidePassagesDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'roomDimensions') {
    return renderRoomDimensionsDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'chamberDimensions') {
    return renderChamberDimensionsDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'passageTurns') {
    return renderPassageTurnsDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'stairs') {
    return renderStairsDetail(outcome, appendPendingPreviews, {
      renderChamberSummary: renderChamberDimensionsCompact,
    });
  }
  if (event.kind === 'specialPassage') {
    return renderSpecialPassageDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'galleryStairLocation') {
    return renderGalleryStairLocationDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'galleryStairOccurrence') {
    return renderGalleryStairOccurrenceDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'riverConstruction') {
    return renderRiverConstructionDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'chasmDepth') {
    return renderChasmDepthDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'chasmConstruction') {
    return renderChasmConstructionDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'jumpingPlaceWidth') {
    return renderJumpingPlaceWidthDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'egress') {
    return renderEgressDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'chute') {
    return renderChuteDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'numberOfExits') {
    return renderNumberOfExitsDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'unusualShape') {
    return renderUnusualShapeDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'circularContents') {
    return renderCircularContentsDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'circularPool') {
    return renderCircularPoolDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'circularMagicPool') {
    return renderCircularMagicPoolDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'transmuteType') {
    return renderTransmuteTypeDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'poolAlignment') {
    return renderPoolAlignmentDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'transporterLocation') {
    return renderTransporterLocationDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'unusualSize') {
    return renderUnusualSizeDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'trickTrap') {
    return renderTrickTrapDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'wanderingWhereFrom') {
    return renderWanderingWhereFromDetail(outcome, appendPendingPreviews);
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
  switch (base) {
    case 'doorLocation':
      return buildDoorLocationPreview(p.table);
    case 'periodicCheckDoorOnly':
      return buildPeriodicDoorOnlyPreview(p.table);
    case 'sidePassages':
      return buildSidePassagePreview(p.table);
    case 'passageTurns':
      return buildPassageTurnPreview(p.table);
    case 'passageWidth':
      return buildPassageWidthPreview(p.table);
    case 'roomDimensions':
      return buildRoomDimensionsPreview(p.table);
    case 'chamberDimensions':
      return buildChamberDimensionsPreview(p.table);
    case 'numberOfExits':
      return buildNumberOfExitsPreview(
        p.table,
        isTableContext(p.context) ? p.context : undefined
      );
    case 'unusualShape':
      return buildUnusualShapePreview(p.table);
    case 'unusualSize':
      return buildUnusualSizePreview(
        p.table,
        isTableContext(p.context) ? p.context : undefined
      );
    case 'stairs':
      return buildStairsPreview(p.table);
    case 'specialPassage':
      return buildSpecialPassagePreview(p.table);
    case 'egress':
      return buildEgressPreview(p.table);
    case 'chute':
      return buildChutePreview(p.table);
    case 'wanderingWhereFrom':
      return buildWanderingWhereFromPreview(p.table);
    case 'monsterLevel':
    case 'monsterOne':
    case 'monsterTwo':
    case 'monsterThree':
    case 'monsterFour':
    case 'monsterFive':
    case 'monsterSix':
    case 'dragonThree':
    case 'dragonFourYounger':
    case 'dragonFourOlder':
    case 'dragonFiveYounger':
    case 'dragonFiveOlder':
    case 'dragonSix':
    case 'human':
      return buildMonsterPreview(
        p.table,
        isTableContext(p.context) ? p.context : undefined
      );
    case 'galleryStairLocation':
      return buildGalleryStairLocationPreview(p.table);
    case 'galleryStairOccurrence':
      return buildGalleryStairOccurrencePreview(p.table);
    case 'circularContents':
      return buildCircularContentsPreview(p.table);
    case 'circularPool':
      return buildCircularPoolPreview(p.table);
    case 'circularMagicPool':
      return buildCircularMagicPoolPreview(p.table);
    case 'transmuteType':
      return buildTransmuteTypePreview(p.table);
    case 'poolAlignment':
      return buildPoolAlignmentPreview(p.table);
    case 'transporterLocation':
      return buildTransporterLocationPreview(p.table);
    case 'streamConstruction':
      return buildStreamConstructionPreview(p.table);
    case 'riverConstruction':
      return buildRiverConstructionPreview(p.table);
    case 'riverBoatBank':
      return buildRiverBoatBankPreview(p.table);
    case 'chasmDepth':
      return buildChasmDepthPreview(p.table);
    case 'chasmConstruction':
      return buildChasmConstructionPreview(p.table);
    case 'jumpingPlaceWidth':
      return buildJumpingPlaceWidthPreview(p.table);
    case 'trickTrap':
      return buildTrickTrapPreview(p.table);
  }
  return undefined;
}

// COMPACT MODE: outcome -> render nodes with auto-resolved text (no previews)
export function toCompactRender(
  outcome: DungeonOutcomeNode
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const node = outcome;
  const { event } = node;
  if (event.kind === 'periodicCheck') {
    return renderPeriodicCheckCompact(node);
  }
  if (event.kind === 'doorBeyond') {
    return renderDoorBeyondCompactNodes(node);
  }
  if (event.kind === 'roomDimensions') {
    return renderRoomDimensionsCompactNodes(node);
  }
  if (event.kind === 'chamberDimensions') {
    return renderChamberDimensionsCompactNodes(node);
  }
  if (event.kind === 'sidePassages') {
    return renderSidePassagesCompactNodes(node);
  }
  if (event.kind === 'passageTurns') {
    return renderPassageTurnsCompactNodes(node);
  }
  if (node.event.kind === 'passageWidth') {
    return renderPassageWidthCompactNodes(node);
  }
  if (event.kind === 'stairs') {
    return renderStairsCompactNodes(node, {
      renderChamberSummary: renderChamberDimensionsCompact,
    });
  }
  if (event.kind === 'specialPassage') {
    return renderSpecialPassageCompactNodes(node);
  }
  if (event.kind === 'egress') {
    return renderEgressCompact(node);
  }
  if (event.kind === 'chute') {
    return renderChuteCompact(node);
  }
  if (event.kind === 'numberOfExits') {
    return renderNumberOfExitsCompact(node);
  }
  if (event.kind === 'circularContents') {
    const nodes2 = renderCircularContentsCompact(node);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'circularPool') {
    const nodes2 = renderCircularPoolCompact(node);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'circularMagicPool') {
    const nodes2 = renderCircularMagicPoolCompact(node);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'riverConstruction') {
    const nodes2 = renderRiverConstructionCompact(node);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'galleryStairLocation') {
    const nodes2 = renderGalleryStairLocationCompact(node);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'galleryStairOccurrence') {
    return renderGalleryStairOccurrenceCompact(node);
  }
  if (event.kind === 'transmuteType') {
    return renderTransmuteTypeCompact(node);
  }
  if (event.kind === 'poolAlignment') {
    return renderPoolAlignmentCompact(node);
  }
  if (event.kind === 'transporterLocation') {
    return renderTransporterLocationCompact(node);
  }
  if (event.kind === 'wanderingWhereFrom') {
    return renderWanderingWhereFromCompactNodes(node);
  }
  const monsterCompactNodes = renderMonsterCompactNodes(
    node,
    appendPendingPreviews
  );
  if (monsterCompactNodes.length > 0) {
    return monsterCompactNodes;
  }
  if (event.kind === 'unusualShape') {
    return renderUnusualShapeCompact(node);
  }
  if (event.kind === 'unusualSize') {
    return renderUnusualSizeCompact(node);
  }
  return [];
}
