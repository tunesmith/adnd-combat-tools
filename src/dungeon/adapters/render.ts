import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import { PeriodicCheck } from '../../tables/dungeon/periodicCheck';
import { DoorBeyond } from '../../tables/dungeon/doorBeyond';
import {
  RoomDimensions,
  ChamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import { SidePassages } from '../../tables/dungeon/sidePassages';
import { PassageTurns } from '../../tables/dungeon/passageTurns';
import { Stairs } from '../../tables/dungeon/stairs';
import { PassageWidth } from '../../tables/dungeon/passageWidth';
import { periodicCheck } from '../../tables/dungeon/periodicCheck';
import { getMonsterTable } from '../services/wanderingMonsterResult';
import { MonsterLevel } from '../../tables/dungeon/monster/monsterLevel';
import {
  monsterOne,
  MonsterOne,
  human,
  Human,
} from '../../tables/dungeon/monster/monsterOne';
import {
  monsterTwo,
  MonsterTwo,
} from '../../tables/dungeon/monster/monsterTwo';
import {
  monsterThree,
  MonsterThree,
  dragonThree,
  DragonThree,
} from '../../tables/dungeon/monster/monsterThree';
import {
  monsterFour,
  MonsterFour,
  dragonFourYounger,
  DragonFourYounger,
  dragonFourOlder,
  DragonFourOlder,
} from '../../tables/dungeon/monster/monsterFour';
import {
  monsterFive,
  MonsterFive,
  dragonFiveYounger,
  DragonFiveYounger,
  dragonFiveOlder,
  DragonFiveOlder,
} from '../../tables/dungeon/monster/monsterFive';
import {
  monsterSix,
  MonsterSix,
  dragonSix,
  DragonSix,
} from '../../tables/dungeon/monster/monsterSix';
import { SpecialPassage } from '../../tables/dungeon/specialPassage';
import {
  renderPeriodicCheckDetail,
  periodicBaseTexts,
  TRICK_TRAP_FALLBACK_TEXT,
} from './render/periodicOutcome';
import {
  renderDoorLocationDetail,
  renderPeriodicDoorOnlyDetail,
  renderDoorChainCompact,
  buildDoorLocationPreview,
  buildPeriodicDoorOnlyPreview,
} from './render/doorLocation';
import {
  renderSidePassagesDetail,
  describeSidePassage,
  formatSidePassageResult,
  buildSidePassagePreview,
} from './render/sidePassage';
import {
  renderPassageTurnsDetail,
  renderPassageTurnCompact,
  buildPassageTurnPreview,
} from './render/passageTurns';
import {
  renderPassageWidthDetail,
  renderPassageWidthCompact,
  buildPassageWidthPreview,
} from './render/passageWidth';
import {
  renderRoomDimensionsDetail,
  renderRoomDimensionsCompact,
  buildRoomDimensionsPreview,
} from './render/roomDimensions';
import {
  renderChamberDimensionsDetail,
  renderChamberDimensionsCompact,
  buildChamberDimensionsPreview,
} from './render/chamberDimensions';
import {
  renderCircularContentsDetail,
  renderCircularContentsCompact,
  renderCircularPoolDetail,
  renderCircularPoolCompact,
  renderCircularMagicPoolDetail,
  renderCircularMagicPoolCompact,
  renderTransmuteTypeDetail,
  renderTransmuteTypeCompact,
  renderPoolAlignmentDetail,
  renderPoolAlignmentCompact,
  renderTransporterLocationDetail,
  renderTransporterLocationCompact,
  buildCircularContentsPreview,
  buildCircularPoolPreview,
  buildCircularMagicPoolPreview,
  buildTransmuteTypePreview,
  buildPoolAlignmentPreview,
  buildTransporterLocationPreview,
} from './render/magicPool';
import {
  renderSpecialPassageDetail,
  renderSpecialPassageCompact,
  buildSpecialPassagePreview,
  buildGalleryStairLocationPreview,
  buildStreamConstructionPreview,
  buildRiverConstructionPreview,
} from './render/specialPassage';
import {
  renderChasmDepthDetail,
  renderChasmConstructionDetail,
  renderJumpingPlaceDetail,
  buildChasmDepthPreview,
  buildChasmConstructionPreview,
} from './render/chasm';
import {
  renderStairsDetail,
  renderStairsCompact,
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
import { findChildEvent } from './render/shared';
// detail-mode preview helpers remain for other flows; compact composition is local
import { isTableContext } from '../helpers/outcomeTree';

function rangeText(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
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
    case 'periodicDoorOnly':
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
      tableId = 'circularShapePool';
      break;
    case 'circularMagicPool':
      tableId = 'circularShapeMagicPool';
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
      tableId = undefined; // handled directly in detail render
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

function humanLabel(command: Human): string {
  switch (command) {
    case Human.Bandit_5to15:
      return 'Bandit';
    case Human.Berserker_3to9:
      return 'Berserker';
    case Human.Brigand_5to15:
      return 'Brigand';
    case Human.Character:
      return 'Character';
    default:
      return Human[command] ?? 'Human';
  }
}

// DETAIL MODE: outcome -> render nodes with previews for staged tables
export function toDetailRender(
  outcome: DungeonOutcomeNode
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const nodes: DungeonRenderNode[] = [];
  const { event, roll } = outcome;
  if (event.kind === 'periodicCheck') {
    return renderPeriodicCheckDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'doorBeyond') {
    const heading: DungeonMessage = { kind: 'heading', level: 3, text: 'Door' };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${DoorBeyond[event.result]}`],
    };
    const summary = describeDoorBeyond(outcome);
    nodes.push(heading, bullet);
    nodes.push(...summary.detailParagraphs);
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  if (event.kind === 'doorLocation') {
    return renderDoorLocationDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'periodicDoorOnly') {
    return renderPeriodicDoorOnlyDetail(outcome, appendPendingPreviews);
  }
  if (outcome.event.kind === 'passageWidth') {
    return renderPassageWidthDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'sidePassages') {
    return renderSidePassagesDetail(outcome);
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
  if (event.kind === 'chasmDepth') {
    return renderChasmDepthDetail(outcome);
  }
  if (event.kind === 'chasmConstruction') {
    return renderChasmConstructionDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'jumpingPlaceWidth') {
    return renderJumpingPlaceDetail(outcome);
  }
  if (event.kind === 'egress') {
    return renderEgressDetail(outcome);
  }
  if (event.kind === 'chute') {
    return renderChuteDetail(outcome);
  }
  if (event.kind === 'numberOfExits') {
    return renderNumberOfExitsDetail(outcome);
  }
  if (event.kind === 'unusualShape') {
    const nodes2 = renderUnusualShapeDetail(outcome);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'circularContents') {
    const nodes2 = renderCircularContentsDetail(outcome);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'circularPool') {
    const nodes2 = renderCircularPoolDetail(outcome);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'circularMagicPool') {
    const nodes2 = renderCircularMagicPoolDetail(outcome);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'transmuteType') {
    return renderTransmuteTypeDetail(outcome);
  }
  if (event.kind === 'poolAlignment') {
    return renderPoolAlignmentDetail(outcome);
  }
  if (event.kind === 'transporterLocation') {
    return renderTransporterLocationDetail(outcome);
  }
  if (event.kind === 'unusualSize') {
    return renderUnusualSizeDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'trickTrap') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Trick / Trap',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — TBD`],
    };
    const summary = describeTrickTrap(outcome);
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    nodes2.push(...summary.detailParagraphs);
    return nodes2;
  }
  const monsterDescription = describeMonsterOutcome(outcome);
  if (monsterDescription) {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: monsterDescription.heading,
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${monsterDescription.label}`],
    };
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (monsterDescription.detailParagraphs.length > 0) {
      nodes2.push(...monsterDescription.detailParagraphs);
    }
    if (monsterDescription.appendPending) {
      appendPendingPreviews(outcome, nodes2);
    }
    return nodes2;
  }
  return nodes;
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
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Where From',
        sides: periodicCheck.sides,
        entries: periodicCheck.entries
          .filter((e) => e.command !== PeriodicCheck.WanderingMonster)
          .map((e) => ({
            range: rangeText(e.range),
            label: PeriodicCheck[e.command] ?? String(e.command),
          })),
      };
    case 'monsterLevel': {
      const parts = p.table.split(':');
      const lvl = Number(parts[1] ?? 1) || 1;
      const table = getMonsterTable(lvl);
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Monster Level',
        sides: table.sides,
        entries: table.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterLevel[e.command] ?? String(e.command),
        })),
        context: { kind: 'wandering', level: lvl } as TableContext,
      };
    }
    case 'monsterOne':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Monster (Level 1)',
        sides: monsterOne.sides,
        entries: monsterOne.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterOne[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'monsterTwo':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Monster (Level 2)',
        sides: monsterTwo.sides,
        entries: monsterTwo.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterTwo[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'monsterThree':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Monster (Level 3)',
        sides: monsterThree.sides,
        entries: monsterThree.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterThree[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'monsterFour':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Monster (Level 4)',
        sides: monsterFour.sides,
        entries: monsterFour.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterFour[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'monsterFive':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Monster (Level 5)',
        sides: monsterFive.sides,
        entries: monsterFive.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterFive[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'monsterSix':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Monster (Level 6)',
        sides: monsterSix.sides,
        entries: monsterSix.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterSix[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'dragonThree':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Dragon (Level 3)',
        sides: dragonThree.sides,
        entries: dragonThree.entries.map((e) => ({
          range: rangeText(e.range),
          label: DragonThree[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'dragonFourYounger':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Dragon (Younger)',
        sides: dragonFourYounger.sides,
        entries: dragonFourYounger.entries.map((e) => ({
          range: rangeText(e.range),
          label: DragonFourYounger[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'dragonFourOlder':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Dragon (Older)',
        sides: dragonFourOlder.sides,
        entries: dragonFourOlder.entries.map((e) => ({
          range: rangeText(e.range),
          label: DragonFourOlder[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'dragonFiveYounger':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Dragon (Younger)',
        sides: dragonFiveYounger.sides,
        entries: dragonFiveYounger.entries.map((e) => ({
          range: rangeText(e.range),
          label: DragonFiveYounger[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'dragonFiveOlder':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Dragon (Older)',
        sides: dragonFiveOlder.sides,
        entries: dragonFiveOlder.entries.map((e) => ({
          range: rangeText(e.range),
          label: DragonFiveOlder[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'dragonSix':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Dragon',
        sides: dragonSix.sides,
        entries: dragonSix.entries.map((e) => ({
          range: rangeText(e.range),
          label: DragonSix[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'human':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Human Subtable',
        sides: human.sides,
        entries: human.entries.map((e) => ({
          range: rangeText(e.range),
          label: humanLabel(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'galleryStairLocation':
      return buildGalleryStairLocationPreview(p.table);
    case 'circularContents':
      return buildCircularContentsPreview(p.table);
    case 'circularShapePool':
      return buildCircularPoolPreview(p.table);
    case 'circularShapeMagicPool':
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
    case 'chasmDepth':
      return buildChasmDepthPreview(p.table);
    case 'chasmConstruction':
      return buildChasmConstructionPreview(p.table);
    case 'trickTrap':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Trick / Trap',
        sides: 20,
        entries: [
          { range: '1–20', label: 'Not yet implemented — use GM judgment' },
        ],
      };
  }
  return undefined;
}

// COMPACT MODE: outcome -> render nodes with auto-resolved text (no previews)
export function toCompactRender(
  outcome: DungeonOutcomeNode
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const node = outcome;
  const nodes: DungeonRenderNode[] = [];
  const { event, roll } = node;
  if (event.kind === 'periodicCheck') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 3,
      text: 'Passage',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${PeriodicCheck[event.result]}`],
    };
    const text = renderCompactPeriodicOutcome(node);
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    return nodes;
  }
  if (event.kind === 'doorBeyond') {
    const heading: DungeonMessage = { kind: 'heading', level: 3, text: 'Door' };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${DoorBeyond[event.result]}`],
    };
    const text = renderCompactDoorBeyond(node);
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    return nodes;
  }
  if (event.kind === 'roomDimensions') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Room Dimensions',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${RoomDimensions[event.result]}`],
    };
    const text = renderRoomDimensionsCompact(node);
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    return nodes;
  }
  if (event.kind === 'chamberDimensions') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Chamber Dimensions',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${ChamberDimensions[event.result]}`],
    };
    const text = renderChamberDimensionsCompact(node);
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    return nodes;
  }
  if (event.kind === 'sidePassages') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Side Passages',
    };
    const label = SidePassages[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const summary = describeSidePassage(node);
    nodes.push(heading, bullet);
    nodes.push(...summary.detailParagraphs);
    return nodes;
  }
  if (event.kind === 'passageTurns') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Passage Turns',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${PassageTurns[event.result] ?? event.result}`],
    };
    const text = renderPassageTurnCompact(node);
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    return nodes;
  }
  if (node.event.kind === 'passageWidth') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Passage Width',
    };
    const label = PassageWidth[node.event.result] ?? String(node.event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    const text = renderPassageWidthCompact(node);
    if (text.length > 0) {
      nodes2.push({ kind: 'paragraph', text });
    }
    return nodes2;
  }
  if (event.kind === 'stairs') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Stairs',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${Stairs[event.result] ?? event.result}`],
    };
    const text = renderStairsCompact(node, {
      renderChamberSummary: renderChamberDimensionsCompact,
    });
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    return nodes;
  }
  if (event.kind === 'specialPassage') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Special Passage',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [
        `roll: ${roll} — ${SpecialPassage[event.result] ?? event.result}`,
      ],
    };
    const text = renderSpecialPassageCompact(node);
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    return nodes;
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
  if (event.kind === 'transmuteType') {
    return renderTransmuteTypeCompact(node);
  }
  if (event.kind === 'poolAlignment') {
    return renderPoolAlignmentCompact(node);
  }
  if (event.kind === 'transporterLocation') {
    return renderTransporterLocationCompact(node);
  }
  const monsterDescription = describeMonsterOutcome(outcome);
  if (monsterDescription) {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: monsterDescription.heading,
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${monsterDescription.label}`],
    };
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (monsterDescription.compactText.length > 0) {
      const paragraphText = monsterDescription.compactText.endsWith(' ')
        ? monsterDescription.compactText
        : `${monsterDescription.compactText} `;
      nodes2.push({ kind: 'paragraph', text: paragraphText });
    }
    if (monsterDescription.appendPending) {
      appendPendingPreviews(outcome, nodes2);
    }
    return nodes2;
  }
  if (event.kind === 'unusualShape') {
    return renderUnusualShapeCompact(node);
  }
  if (event.kind === 'unusualSize') {
    return renderUnusualSizeCompact(node);
  }
  return nodes;
}

function describeDoorBeyond(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'doorBeyond') {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailParagraphs: DungeonMessage[] = [];
  const segments: string[] = [];
  const appendParagraph = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const normalized = trimmed.endsWith(' ')
      ? trimmed
      : trimmed.endsWith('.')
      ? `${trimmed} `
      : `${trimmed}. `;
    detailParagraphs.push({ kind: 'paragraph', text: normalized });
    segments.push(normalized.trim());
  };

  switch (node.event.result) {
    case DoorBeyond.ParallelPassageOrCloset:
      if (node.event.doorAhead) {
        appendParagraph(
          "Beyond the door is a 10' x 10' room (check contents, treasure). "
        );
      } else {
        appendParagraph(
          "Beyond the door is a parallel passage, extending 30' in both directions. "
        );
      }
      break;
    case DoorBeyond.PassageStraightAhead:
      appendParagraph('Beyond the door is a passage straight ahead. ');
      break;
    case DoorBeyond.Passage45AheadBehind:
      appendParagraph(
        'Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). '
      );
      break;
    case DoorBeyond.Passage45BehindAhead:
      appendParagraph(
        'Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). '
      );
      break;
    case DoorBeyond.Room:
      appendParagraph('Beyond the door is a room. ');
      break;
    case DoorBeyond.Chamber:
      appendParagraph('Beyond the door is a chamber. ');
      break;
  }

  const compactText = segments.join(' ');
  return { detailParagraphs, compactText };
}

function describeTrickTrap(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'trickTrap') {
    return { detailParagraphs: [], compactText: '' };
  }
  const text = formatTrickTrap(node.event.result);
  const detailParagraphs: DungeonMessage[] = text.length
    ? [{ kind: 'paragraph', text }]
    : [];
  return { detailParagraphs, compactText: text };
}

interface MonsterDescription {
  heading: string;
  label: string;
  detailParagraphs: DungeonMessage[];
  compactText: string;
  appendPending: boolean;
}

function monsterTextDescription(text?: string): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (!text || text.length === 0) {
    return { detailParagraphs: [], compactText: '' };
  }
  return {
    detailParagraphs: [{ kind: 'paragraph', text }],
    compactText: text.trimEnd(),
  };
}

function hasPendingChildren(node: OutcomeEventNode): boolean {
  return Array.isArray(node.children)
    ? node.children.some((child) => child.type === 'pending-roll')
    : false;
}

function describeMonsterOutcome(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  switch (node.event.kind) {
    case 'monsterLevel': {
      const detailParagraphs: DungeonMessage[] = [];
      let compactText = '';
      if (node.event.result > MonsterLevel.Six) {
        const placeholder = `(TODO: Monster Level ${
          MonsterLevel[node.event.result]
        } preview)`;
        detailParagraphs.push({ kind: 'paragraph', text: placeholder });
        compactText = placeholder;
      }
      return {
        heading: 'Monster Level',
        label: MonsterLevel[node.event.result] ?? String(node.event.result),
        detailParagraphs,
        compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'monsterOne': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Monster (Level 1)',
        label: MonsterOne[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'monsterTwo': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Monster (Level 2)',
        label: MonsterTwo[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'monsterThree': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Monster (Level 3)',
        label: MonsterThree[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'monsterFour': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Monster (Level 4)',
        label: MonsterFour[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'monsterFive': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Monster (Level 5)',
        label: MonsterFive[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'monsterSix': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Monster (Level 6)',
        label: MonsterSix[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'dragonThree': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Dragon (Level 3)',
        label: DragonThree[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'dragonFourYounger': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Dragon (Younger)',
        label:
          DragonFourYounger[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'dragonFourOlder': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Dragon (Older)',
        label: DragonFourOlder[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'dragonFiveYounger': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Dragon (Younger)',
        label:
          DragonFiveYounger[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'dragonFiveOlder': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Dragon (Older)',
        label: DragonFiveOlder[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'dragonSix': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Dragon',
        label: DragonSix[node.event.result] ?? String(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    case 'human': {
      const textInfo = monsterTextDescription(node.event.text);
      return {
        heading: 'Human Subtable',
        label: humanLabel(node.event.result),
        detailParagraphs: textInfo.detailParagraphs,
        compactText: textInfo.compactText,
        appendPending: hasPendingChildren(node),
      };
    }
    default:
      return undefined;
  }
}

function renderWanderingWhereFrom(node: OutcomeEventNode): string {
  if (node.event.kind !== 'wanderingWhereFrom') return '';
  switch (node.event.result) {
    case PeriodicCheck.Door: {
      const door = findChildEvent(node, 'doorLocation');
      return renderDoorChainCompact(door);
    }
    case PeriodicCheck.SidePassage: {
      const side = findChildEvent(node, 'sidePassages');
      return side && side.event.kind === 'sidePassages'
        ? formatSidePassageResult(side.event.result)
        : 'A side passage occurs. ';
    }
    case PeriodicCheck.PassageTurn: {
      const turn = findChildEvent(node, 'passageTurns');
      return turn
        ? renderPassageTurnCompact(turn)
        : periodicBaseTexts(PeriodicCheck.PassageTurn).detail;
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? renderChamberDimensionsCompact(chamber) : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return stairs
        ? renderStairsCompact(stairs, {
            renderChamberSummary: renderChamberDimensionsCompact,
          })
        : periodicBaseTexts(PeriodicCheck.Stairs).detail;
    }
    case PeriodicCheck.TrickTrap: {
      const trap = findChildEvent(node, 'trickTrap');
      if (trap && trap.event.kind === 'trickTrap') {
        const summary = describeTrickTrap(trap);
        if (summary.compactText.length > 0) {
          return summary.compactText;
        }
      }
      return TRICK_TRAP_FALLBACK_TEXT;
    }
    case PeriodicCheck.ContinueStraight:
      return periodicBaseTexts(PeriodicCheck.ContinueStraight).detail;
    case PeriodicCheck.DeadEnd:
      return periodicBaseTexts(PeriodicCheck.DeadEnd).detail;
    default:
      return periodicBaseTexts(node.event.result).detail;
  }
}

function renderCompactDoorBeyond(node: OutcomeEventNode): string {
  if (node.event.kind !== 'doorBeyond') return '';
  const summary = describeDoorBeyond(node);
  let text = summary.compactText;
  if (
    node.event.result === DoorBeyond.ParallelPassageOrCloset &&
    !node.event.doorAhead
  ) {
    text += renderChildPassageWidth(node);
  }
  if (
    node.event.result === DoorBeyond.PassageStraightAhead ||
    node.event.result === DoorBeyond.Passage45AheadBehind ||
    node.event.result === DoorBeyond.Passage45BehindAhead
  ) {
    text += renderChildPassageWidth(node);
  }
  if (node.event.result === DoorBeyond.Room) {
    const room = findChildEvent(node, 'roomDimensions');
    const detail = room ? renderRoomDimensionsCompact(room) : '';
    text += detail;
  }
  if (node.event.result === DoorBeyond.Chamber) {
    const chamber = findChildEvent(node, 'chamberDimensions');
    const detail = chamber ? renderChamberDimensionsCompact(chamber) : '';
    text += detail;
  }
  return text;
}

function renderChildPassageWidth(node: OutcomeEventNode): string {
  const width = findChildEvent(node, 'passageWidth');
  return width ? renderPassageWidthCompact(width) : '';
}

function formatTrickTrap(result: number): string {
  return `There is a trick or trap. (roll ${result}) -- check again in 30'. `;
}

function renderCompactPeriodicOutcome(node: OutcomeEventNode): string {
  if (node.event.kind !== 'periodicCheck') return '';
  const event = node.event;
  switch (event.result) {
    case PeriodicCheck.Door:
      return renderDoorChainCompact(findChildEvent(node, 'doorLocation'));
    case PeriodicCheck.SidePassage: {
      const side = findChildEvent(node, 'sidePassages');
      if (side && side.event.kind === 'sidePassages') {
        const summary = describeSidePassage(side);
        if (summary.compactText.length > 0) {
          return summary.compactText;
        }
      }
      return periodicBaseTexts(event.result, {
        avoidMonster: event.avoidMonster ?? false,
      }).compact;
    }
    case PeriodicCheck.PassageTurn: {
      const turn = findChildEvent(node, 'passageTurns');
      return turn
        ? renderPassageTurnCompact(turn)
        : periodicBaseTexts(event.result, {
            avoidMonster: event.avoidMonster ?? false,
          }).compact;
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber
        ? renderChamberDimensionsCompact(chamber)
        : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return stairs
        ? renderStairsCompact(stairs, {
            renderChamberSummary: renderChamberDimensionsCompact,
          })
        : periodicBaseTexts(event.result, {
            avoidMonster: event.avoidMonster ?? false,
          }).compact;
    }
    case PeriodicCheck.WanderingMonster: {
      const whereFrom = findChildEvent(node, 'wanderingWhereFrom');
      const monsterLevelNode = findChildEvent(node, 'monsterLevel');
      return compactWanderingMonsterText(
        event.level,
        whereFrom && whereFrom.event.kind === 'wanderingWhereFrom'
          ? whereFrom
          : undefined,
        monsterLevelNode && monsterLevelNode.event.kind === 'monsterLevel'
          ? monsterLevelNode
          : undefined
      );
    }
    default:
      return periodicBaseTexts(event.result, {
        avoidMonster: event.avoidMonster ?? false,
      }).compact;
  }
}

// Compose compact text for Wandering Monster without legacy helpers.
function compactWanderingMonsterText(
  level: number,
  whereNode?: OutcomeEventNode,
  levelNode?: OutcomeEventNode
): string {
  const prefix =
    whereNode && whereNode.event.kind === 'wanderingWhereFrom'
      ? renderWanderingWhereFrom(whereNode)
      : '';
  const monsterText = readMonsterEncounter(level, levelNode);
  return `${prefix}Wandering Monster: ${monsterText}`;
}

const MONSTER_LEVEL_KIND: Partial<Record<MonsterLevel, OutcomeEvent['kind']>> =
  {
    [MonsterLevel.One]: 'monsterOne',
    [MonsterLevel.Two]: 'monsterTwo',
    [MonsterLevel.Three]: 'monsterThree',
    [MonsterLevel.Four]: 'monsterFour',
    [MonsterLevel.Five]: 'monsterFive',
    [MonsterLevel.Six]: 'monsterSix',
  };

function readMonsterEncounter(
  _dungeonLevel: number,
  levelNode?: OutcomeEventNode
): string {
  if (!levelNode || levelNode.event.kind !== 'monsterLevel') {
    return fallbackMonsterLevelText(MonsterLevel.One);
  }
  return readMonsterEncounterFromLevelNode(levelNode);
}

function readMonsterEncounterFromLevelNode(node: OutcomeEventNode): string {
  if (node.event.kind !== 'monsterLevel') {
    return fallbackMonsterLevelText(MonsterLevel.One);
  }
  const mapping = MONSTER_LEVEL_KIND[node.event.result];
  if (!mapping) {
    return fallbackMonsterLevelText(node.event.result);
  }
  const monsterNode = findChildEvent(node, mapping);
  if (!monsterNode) {
    return fallbackMonsterLevelText(node.event.result);
  }
  const text = readMonsterEventText(monsterNode);
  return text ?? fallbackMonsterLevelText(node.event.result);
}

function readMonsterEventText(node: OutcomeEventNode): string | undefined {
  switch (node.event.kind) {
    case 'monsterOne': {
      if (node.event.text) return node.event.text;
      const humanNode = findChildEvent(node, 'human');
      return humanNode ? readMonsterEventText(humanNode) : undefined;
    }
    case 'monsterTwo':
    case 'monsterThree':
    case 'monsterFour':
    case 'monsterFive':
    case 'monsterSix': {
      if (node.event.text) return node.event.text;
      if (node.event.kind === 'monsterThree') {
        const dragon = findChildEvent(node, 'dragonThree');
        return dragon ? readMonsterEventText(dragon) : undefined;
      }
      if (node.event.kind === 'monsterFour') {
        const younger = findChildEvent(node, 'dragonFourYounger');
        if (younger) return readMonsterEventText(younger);
        const older = findChildEvent(node, 'dragonFourOlder');
        return older ? readMonsterEventText(older) : undefined;
      }
      if (node.event.kind === 'monsterFive') {
        const younger = findChildEvent(node, 'dragonFiveYounger');
        if (younger) return readMonsterEventText(younger);
        const older = findChildEvent(node, 'dragonFiveOlder');
        return older ? readMonsterEventText(older) : undefined;
      }
      if (node.event.kind === 'monsterSix') {
        const dragon = findChildEvent(node, 'dragonSix');
        return dragon ? readMonsterEventText(dragon) : undefined;
      }
      return undefined;
    }
    case 'dragonThree':
    case 'dragonFourYounger':
    case 'dragonFourOlder':
    case 'dragonFiveYounger':
    case 'dragonFiveOlder':
    case 'dragonSix':
    case 'human':
      return node.event.text;
    default:
      return undefined;
  }
}

function fallbackMonsterLevelText(level: MonsterLevel): string {
  switch (level) {
    case MonsterLevel.Seven:
      return '(TODO: Roll Monster for Level Seven)';
    case MonsterLevel.Eight:
      return '(TODO: Roll Monster for Level Eight)';
    case MonsterLevel.Nine:
      return '(TODO: Roll Monster for Level Nine)';
    case MonsterLevel.Ten:
      return '(TODO: Roll Monster for Level Ten)';
    default:
      return '(Unknown Monster Result)';
  }
}
