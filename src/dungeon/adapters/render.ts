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
  chamberDimensions,
  ChamberDimensions,
  roomDimensions,
  RoomDimensions,
} from '../../tables/dungeon/chambersRooms';
import { doorLocation, DoorLocation } from '../../tables/dungeon/doorLocation';
import { sidePassages, SidePassages } from '../../tables/dungeon/sidePassages';
import { passageTurns, PassageTurns } from '../../tables/dungeon/passageTurns';
import {
  stairs,
  Stairs,
  egressOne,
  egressTwo,
  egressThree,
  Egress,
  chute,
  Chute,
} from '../../tables/dungeon/stairs';
import { passageWidth, PassageWidth } from '../../tables/dungeon/passageWidth';
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
import {
  specialPassage,
  SpecialPassage,
  galleryStairLocation,
  GalleryStairLocation,
  streamConstruction,
  StreamConstruction,
  riverConstruction,
  RiverConstruction,
  chasmDepth,
  ChasmDepth,
  chasmConstruction,
  ChasmConstruction,
} from '../../tables/dungeon/specialPassage';
import {
  renderPeriodicCheckDetail,
  periodicBaseTexts,
  TRICK_TRAP_FALLBACK_TEXT,
} from './render/periodicOutcome';
import {
  renderDoorLocationDetail,
  renderPeriodicDoorOnlyDetail,
  renderCompactDoorChain,
} from './render/doorLocation';
import {
  renderSidePassagesDetail,
  describeSidePassage,
  formatSidePassageResult,
} from './render/sidePassage';
import {
  renderPassageTurnsDetail,
  renderCompactPassageTurn,
} from './render/passageTurns';
import {
  renderPassageWidthDetail,
  renderCompactPassageWidth,
} from './render/passageWidth';
import {
  renderSpecialPassageDetail,
  renderCompactSpecialPassage,
} from './render/specialPassage';
import {
  renderChasmDepthDetail,
  renderChasmConstructionDetail,
  renderJumpingPlaceDetail,
} from './render/chasm';
import {
  renderStairsDetail,
  renderCompactStairs,
} from './render/stairs';
import {
  renderEgressDetail,
  renderEgressCompact,
} from './render/egress';
import {
  renderChuteDetail,
  renderChuteCompact,
} from './render/chute';
import { findChildEvent } from './render/shared';
import { pool, Pool } from '../../tables/dungeon/pool';
import {
  magicPool,
  MagicPool,
  transmuteType,
  TransmuteType,
  poolAlignment,
  PoolAlignment,
  transporterLocation,
  TransporterLocation,
} from '../../tables/dungeon/magicPool';
import {
  numberOfExits,
  NumberOfExits,
} from '../../tables/dungeon/numberOfExits';
import {
  unusualShape,
  UnusualShape,
  circularContents,
  CircularContents,
} from '../../tables/dungeon/unusualShape';
import { unusualSize, UnusualSize } from '../../tables/dungeon/unusualSize';
import {
  periodicCheckDoorOnly,
  PeriodicCheckDoorOnly,
} from '../../tables/dungeon/periodicCheckDoorOnly';
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
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Room Dimensions',
    };
    const label = RoomDimensions[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let baseDesc = '';
    switch (event.result) {
      case RoomDimensions.Square10x10:
        baseDesc = "The room is square and 10' x 10'. ";
        break;
      case RoomDimensions.Square20x20:
        baseDesc = "The room is square and 20' x 20'. ";
        break;
      case RoomDimensions.Square30x30:
        baseDesc = "The room is square and 30' x 30'. ";
        break;
      case RoomDimensions.Square40x40:
        baseDesc = "The room is square and 40' x 40'. ";
        break;
      case RoomDimensions.Rectangular10x20:
        baseDesc = "The room is rectangular and 10' x 20'. ";
        break;
      case RoomDimensions.Rectangular20x30:
        baseDesc = "The room is rectangular and 20' x 30'. ";
        break;
      case RoomDimensions.Rectangular20x40:
        baseDesc = "The room is rectangular and 20' x 40'. ";
        break;
      case RoomDimensions.Rectangular30x40:
        baseDesc = "The room is rectangular and 30' x 40'. ";
        break;
      case RoomDimensions.Unusual:
        baseDesc = 'The room has an unusual shape and size. ';
        break;
    }
    nodes.push(heading, bullet, { kind: 'paragraph', text: baseDesc });
    if (outcome.children && Array.isArray(outcome.children)) {
      for (const child of outcome.children) {
        if (child.type !== 'pending-roll') continue;
        const preview = previewForPending(child);
        if (preview) nodes.push(withTargetId(preview, child.id ?? child.table));
      }
    }
    return nodes;
  }
  if (event.kind === 'chamberDimensions') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Chamber Dimensions',
    };
    const label = ChamberDimensions[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let baseDesc = '';
    switch (event.result) {
      case ChamberDimensions.Square20x20:
        baseDesc = "The chamber is square and 20' x 20'. ";
        break;
      case ChamberDimensions.Square30x30:
        baseDesc = "The chamber is square and 30' x 30'. ";
        break;
      case ChamberDimensions.Square40x40:
        baseDesc = "The chamber is square and 40' x 40'. ";
        break;
      case ChamberDimensions.Rectangular20x30:
        baseDesc = "The chamber is rectangular and 20' x 30'. ";
        break;
      case ChamberDimensions.Rectangular30x50:
        baseDesc = "The chamber is rectangular and 30' x 50'. ";
        break;
      case ChamberDimensions.Rectangular40x60:
        baseDesc = "The chamber is rectangular and 40' x 60'. ";
        break;
      case ChamberDimensions.Unusual:
        baseDesc = 'The chamber has an unusual shape and size. ';
        break;
    }
    nodes.push(heading, bullet, { kind: 'paragraph', text: baseDesc });
    if (outcome.children && Array.isArray(outcome.children)) {
      for (const child of outcome.children) {
        if (child.type !== 'pending-roll') continue;
        const preview = previewForPending(child);
        if (preview) nodes.push(withTargetId(preview, child.id ?? child.table));
      }
    }
    return nodes;
  }
  if (event.kind === 'passageTurns') {
    return renderPassageTurnsDetail(outcome, appendPendingPreviews);
  }
  if (event.kind === 'stairs') {
    return renderStairsDetail(outcome, appendPendingPreviews, {
      renderChamberSummary: renderCompactChamberDimensions,
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
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Exits',
    };
    const label = NumberOfExits[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const summary = describeNumberOfExits(outcome);
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (summary.detailParagraphs.length > 0) {
      nodes2.push(...summary.detailParagraphs);
    }
    return nodes2;
  }
  if (event.kind === 'unusualShape') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Unusual Shape',
    };
    const label = UnusualShape[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let text = '';
    switch (event.result) {
      case UnusualShape.Circular:
        text = 'It is circular. ';
        break;
      case UnusualShape.Triangular:
        text = 'It is triangular. ';
        break;
      case UnusualShape.Trapezoidal:
        text = 'It is trapezoidal. ';
        break;
      case UnusualShape.OddShaped:
        text =
          'It is odd-shaped. (Draw what shape you desire or what will fit the map -- it is a special shape if desired.) ';
        break;
      case UnusualShape.Oval:
        text = 'It is oval-shaped. ';
        break;
      case UnusualShape.Hexagonal:
        text = 'It is hexagonal. ';
        break;
      case UnusualShape.Octagonal:
        text = 'It is octagonal. ';
        break;
      case UnusualShape.Cave:
        text = 'It is actually a cave. ';
        break;
    }
    const nodes2: DungeonRenderNode[] = [
      heading,
      bullet,
      {
        kind: 'paragraph',
        text,
      },
    ];
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'circularContents') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Circular Contents',
    };
    const label = CircularContents[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let text = '';
    switch (event.result) {
      case CircularContents.Pool:
        text = 'There is a pool. ';
        break;
      case CircularContents.Well:
        text = 'There is a well. ';
        break;
      case CircularContents.Shaft:
        text = 'There is a shaft. ';
        break;
      case CircularContents.Normal:
        text = '';
        break;
    }
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (text) nodes2.push({ kind: 'paragraph', text });
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'circularPool') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Pool',
    };
    const label = Pool[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let text = '';
    switch (event.result) {
      case Pool.PoolNoMonster:
        text = 'There is a pool. ';
        break;
      case Pool.PoolMonster:
        text =
          'There is a pool. There is a monster in the pool. (TODO Monster) ';
        break;
      case Pool.PoolMonsterTreasure:
        text =
          'There is a pool. There is a monster and treasure in the pool. (TODO Monster Treasure) ';
        break;
      case Pool.MagicPool:
        text =
          'There is a pool. It is a magical pool. (In order to find out what it is, characters must enter the magic pool.) ';
        break;
      default:
        text = '';
        break;
    }
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (text) nodes2.push({ kind: 'paragraph', text });
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'circularMagicPool') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Magic Pool Effect',
    };
    const label = MagicPool[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (event.result === MagicPool.Transporter) {
      const summary = describeMagicPoolTransporter(outcome);
      if (summary.detailParagraphs.length > 0) {
        nodes2.push(...summary.detailParagraphs);
      }
    } else {
      let text = '';
      switch (event.result) {
        case MagicPool.TransmuteGold:
          text = 'It transmutes gold. ';
          break;
        case MagicPool.AlterCharacteristic:
          text =
            'It will, on a one-time only basis, add (1–3) or subtract (4–6) 1–3 points from one characteristic of all who stand within it: (d6) 1-STR, 2-INT, 3-WIS, 4-DEX, 5-CON, 6-CHA. Roll chances, amount, and characteristic separately for each character. ';
          break;
        case MagicPool.WishOrDamage:
          text =
            'It is a talking pool, and will grant one wish to characters of its alignment, and damage others for 1–20 points. Wish can be withheld for up to 1 day. ';
          break;
        default:
          text = '';
          break;
      }
      if (text) nodes2.push({ kind: 'paragraph', text });
    }
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'transmuteType') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Transmutation Type',
    };
    const label = TransmuteType[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const text =
      event.result === TransmuteType.GoldToPlatinum
        ? 'It will turn gold to platinum, one time only. '
        : 'It will turn gold to lead, one time only. ';
    return [heading, bullet, { kind: 'paragraph', text }];
  }
  if (event.kind === 'poolAlignment') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Pool Alignment',
    };
    const label = PoolAlignment[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const text =
      event.result === PoolAlignment.LawfulGood
        ? 'It is Lawful Good. '
        : event.result === PoolAlignment.LawfulEvil
        ? 'It is Lawful Evil. '
        : event.result === PoolAlignment.ChaoticGood
        ? 'It is Chaotic Good. '
        : event.result === PoolAlignment.ChaoticEvil
        ? 'It is Chaotic Evil. '
        : 'It is Neutral. ';
    return [heading, bullet, { kind: 'paragraph', text }];
  }
  if (event.kind === 'transporterLocation') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Transporter Location',
    };
    const label = TransporterLocation[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const summary = describeTransporterLocation(outcome);
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (summary.detailParagraphs.length > 0) {
      nodes2.push(...summary.detailParagraphs);
    }
    return nodes2;
  }
  if (event.kind === 'unusualSize') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Unusual Size',
    };
    const label = UnusualSize[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    const summary = describeUnusualSizeChain(outcome);
    nodes2.push(...summary.detailParagraphs);
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
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
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Door Location',
        sides: doorLocation.sides,
        entries: doorLocation.entries.map((e) => ({
          range: rangeText(e.range),
          label: DoorLocation[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'periodicCheckDoorOnly':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Door Continuation',
        sides: periodicCheckDoorOnly.sides,
        entries: periodicCheckDoorOnly.entries.map((e) => ({
          range: rangeText(e.range),
          label: PeriodicCheckDoorOnly[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'sidePassages':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Side Passages',
        sides: sidePassages.sides,
        entries: sidePassages.entries.map((e) => ({
          range: rangeText(e.range),
          label: SidePassages[e.command] ?? String(e.command),
        })),
      };
    case 'passageTurns':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Passage Turns',
        sides: passageTurns.sides,
        entries: passageTurns.entries.map((e) => ({
          range: rangeText(e.range),
          label: PassageTurns[e.command] ?? String(e.command),
        })),
      };
    case 'passageWidth':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Passage Width',
        sides: passageWidth.sides,
        entries: passageWidth.entries.map((e) => ({
          range: rangeText(e.range),
          label: PassageWidth[e.command] ?? String(e.command),
        })),
      };
    case 'roomDimensions':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Room Dimensions',
        sides: roomDimensions.sides,
        entries: roomDimensions.entries.map((e) => ({
          range: rangeText(e.range),
          label: RoomDimensions[e.command] ?? String(e.command),
        })),
      };
    case 'chamberDimensions':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Chamber Dimensions',
        sides: chamberDimensions.sides,
        entries: chamberDimensions.entries.map((e) => ({
          range: rangeText(e.range),
          label: ChamberDimensions[e.command] ?? String(e.command),
        })),
      };
    case 'numberOfExits':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Exits',
        sides: numberOfExits.sides,
        entries: numberOfExits.entries.map((e) => ({
          range: rangeText(e.range),
          label: NumberOfExits[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'unusualShape':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Unusual Shape',
        sides: unusualShape.sides,
        entries: unusualShape.entries.map((e) => ({
          range: rangeText(e.range),
          label: UnusualShape[e.command] ?? String(e.command),
        })),
      };
    case 'unusualSize':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Unusual Size',
        sides: unusualSize.sides,
        entries: unusualSize.entries.map((e) => ({
          range: rangeText(e.range),
          label: UnusualSize[e.command] ?? String(e.command),
        })),
        context: isTableContext(p.context) ? p.context : undefined,
      };
    case 'stairs':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Stairs',
        sides: stairs.sides,
        entries: stairs.entries.map((e) => ({
          range: rangeText(e.range),
          label: Stairs[e.command] ?? String(e.command),
        })),
      };
    case 'specialPassage':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Special Passage',
        sides: specialPassage.sides,
        entries: specialPassage.entries.map(
          (e: typeof specialPassage.entries[number]) => ({
            range: rangeText(e.range),
            label: SpecialPassage[e.command] ?? String(e.command),
          })
        ),
      };
    case 'egress': {
      const which = p.table.split(':')[1] as
        | 'one'
        | 'two'
        | 'three'
        | undefined;
      const table =
        which === 'one' ? egressOne : which === 'two' ? egressTwo : egressThree;
      const title =
        which === 'one'
          ? 'Egress (1 level)'
          : which === 'two'
          ? 'Egress (2 levels)'
          : 'Egress (3 levels)';
      return {
        kind: 'table-preview',
        id: p.table,
        title,
        sides: table.sides,
        entries: table.entries.map((e) => ({
          range: rangeText(e.range),
          label: Egress[e.command] ?? String(e.command),
        })),
      };
    }
    case 'chute':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Chute',
        sides: chute.sides,
        entries: chute.entries.map((e) => ({
          range: rangeText(e.range),
          label: Chute[e.command] ?? String(e.command),
        })),
      };
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
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Gallery Stair Location',
        sides: galleryStairLocation.sides,
        entries: galleryStairLocation.entries.map((e) => ({
          range: rangeText(e.range),
          label: GalleryStairLocation[e.command] ?? String(e.command),
        })),
      };
    case 'circularContents':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Circular Contents',
        sides: circularContents.sides,
        entries: circularContents.entries.map(
          (e: typeof circularContents.entries[number]) => ({
            range: rangeText(e.range),
            label: CircularContents[e.command] ?? String(e.command),
          })
        ),
      };
    case 'circularShapePool':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Pool',
        sides: pool.sides,
        entries: pool.entries.map((e) => ({
          range: rangeText(e.range),
          label: Pool[e.command] ?? String(e.command),
        })),
      };
    case 'circularShapeMagicPool':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Magic Pool Effect',
        sides: magicPool.sides,
        entries: magicPool.entries.map((e) => ({
          range: rangeText(e.range),
          label: MagicPool[e.command] ?? String(e.command),
        })),
      };
    case 'transmuteType':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Transmutation Type',
        sides: transmuteType.sides,
        entries: transmuteType.entries.map((e) => ({
          range: rangeText(e.range),
          label: TransmuteType[e.command] ?? String(e.command),
        })),
      };
    case 'poolAlignment':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Pool Alignment',
        sides: poolAlignment.sides,
        entries: poolAlignment.entries.map((e) => ({
          range: rangeText(e.range),
          label: PoolAlignment[e.command] ?? String(e.command),
        })),
      };
    case 'transporterLocation':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Transporter Location',
        sides: transporterLocation.sides,
        entries: transporterLocation.entries.map((e) => ({
          range: rangeText(e.range),
          label: TransporterLocation[e.command] ?? String(e.command),
        })),
      };
    case 'streamConstruction':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Stream Construction',
        sides: streamConstruction.sides,
        entries: streamConstruction.entries.map((e) => ({
          range: rangeText(e.range),
          label: StreamConstruction[e.command] ?? String(e.command),
        })),
      };
    case 'riverConstruction':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'River Construction',
        sides: riverConstruction.sides,
        entries: riverConstruction.entries.map((e) => ({
          range: rangeText(e.range),
          label: RiverConstruction[e.command] ?? String(e.command),
        })),
      };
    case 'chasmDepth':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Chasm Depth',
        sides: chasmDepth.sides,
        entries: chasmDepth.entries.map((e) => ({
          range: rangeText(e.range),
          label: ChasmDepth[e.command] ?? String(e.command),
        })),
      };
    case 'chasmConstruction':
      return {
        kind: 'table-preview',
        id: p.table,
        title: 'Chasm Construction',
        sides: chasmConstruction.sides,
        entries: chasmConstruction.entries.map((e) => ({
          range: rangeText(e.range),
          label: ChasmConstruction[e.command] ?? String(e.command),
        })),
      };
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
    const text = renderCompactRoomDimensions(node);
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
    const text = renderCompactChamberDimensions(node);
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
    const text = renderCompactPassageTurn(node);
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
    const text = renderCompactPassageWidth(node);
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
    const text = renderCompactStairs(node, {
      renderChamberSummary: renderCompactChamberDimensions,
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
    const text = renderCompactSpecialPassage(node);
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
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Exits',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${NumberOfExits[event.result]}`],
    };
    const summary = describeNumberOfExits(outcome);
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (summary.detailParagraphs.length > 0) {
      nodes2.push(...summary.detailParagraphs);
    }
    return nodes2;
  }
  if (event.kind === 'circularMagicPool') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Magic Pool Effect',
    };
    const label = MagicPool[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (event.result === MagicPool.Transporter) {
      const summary = describeMagicPoolTransporter(outcome);
      if (summary.detailParagraphs.length > 0) {
        nodes2.push(...summary.detailParagraphs);
      }
    } else {
      const text = formatCircularMagicPoolResult(event.result);
      if (text.length > 0) {
        const paragraph = text.endsWith(' ') ? text : `${text.trim()} `;
        nodes2.push({ kind: 'paragraph', text: paragraph });
      }
    }
    appendPendingPreviews(outcome, nodes2);
    return nodes2;
  }
  if (event.kind === 'transporterLocation') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Transporter Location',
    };
    const label = TransporterLocation[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const summary = describeTransporterLocation(outcome);
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (summary.detailParagraphs.length > 0) {
      nodes2.push(...summary.detailParagraphs);
    }
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
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Unusual Shape',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${UnusualShape[event.result]}`],
    };
    let text = '';
    switch (event.result) {
      case UnusualShape.Circular:
        text = 'It is circular. ';
        break;
      case UnusualShape.Triangular:
        text = 'It is triangular. ';
        break;
      case UnusualShape.Trapezoidal:
        text = 'It is trapezoidal. ';
        break;
      case UnusualShape.OddShaped:
        text =
          'It is odd-shaped. (Draw what shape you desire or what will fit the map -- it is a special shape if desired.) ';
        break;
      case UnusualShape.Oval:
        text = 'It is oval-shaped. ';
        break;
      case UnusualShape.Hexagonal:
        text = 'It is hexagonal. ';
        break;
      case UnusualShape.Octagonal:
        text = 'It is octagonal. ';
        break;
      case UnusualShape.Cave:
        text = 'It is actually a cave. ';
        break;
    }
    return [heading, bullet, { kind: 'paragraph', text }];
  }
  if (event.kind === 'unusualSize') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Unusual Size',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${UnusualSize[event.result]}`],
    };
    let size = 3400;
    switch (event.result) {
      case UnusualSize.SqFt500:
        size = 500;
        break;
      case UnusualSize.SqFt900:
        size = 900;
        break;
      case UnusualSize.SqFt1300:
        size = 1300;
        break;
      case UnusualSize.SqFt2000:
        size = 2000;
        break;
      case UnusualSize.SqFt2700:
        size = 2700;
        break;
      case UnusualSize.SqFt3400:
        size = 3400;
        break;
      case UnusualSize.RollAgain:
        size = 3400; // match compact fallback
        break;
    }
    const text = `It is about ${size} sq. ft. `;
    return [heading, bullet, { kind: 'paragraph', text }];
  }
  return nodes;
}

// Compact helpers live locally in the adapter to avoid service-level string APIs.
function formatNumberOfExitsEvent(
  event: Extract<OutcomeEvent, { kind: 'numberOfExits' }>
): string {
  if (event.result === NumberOfExits.DoorChamberOrPassageRoom) {
    return event.context.isRoom
      ? 'There is a passage leaving this room. Determine its location and direction using the exit tables.'
      : 'There is a door exiting this chamber. Determine its placement using the exit tables.';
  }

  const nounBase = event.context.isRoom ? 'door' : 'passage';
  if (event.count <= 0) {
    const plural = `${nounBase}s`;
    return `There are no other ${plural}.`;
  }
  const plural = event.count === 1 ? nounBase : `${nounBase}s`;
  const verb = event.count === 1 ? 'is' : 'are';
  const rollInfo =
    event.result === NumberOfExits.OneToFour
      ? ` (1d4 result: ${event.count})`
      : '';
  const pronoun = event.count === 1 ? 'its' : 'their';
  return `There ${verb} ${event.count} additional ${plural}${rollInfo}. Determine ${pronoun} location and direction using the exit tables.`;
}

function describeNumberOfExits(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'numberOfExits') {
    return { detailParagraphs: [], compactText: '' };
  }
  const text = formatNumberOfExitsEvent(node.event).trim();
  if (text.length === 0) {
    return { detailParagraphs: [], compactText: '' };
  }
  return {
    detailParagraphs: [{ kind: 'paragraph', text: `${text} ` }],
    compactText: text,
  };
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
      return renderCompactDoorChain(door);
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
        ? renderCompactPassageTurn(turn)
        : periodicBaseTexts(PeriodicCheck.PassageTurn).detail;
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? renderCompactChamberDimensions(chamber) : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return stairs
        ? renderCompactStairs(stairs, {
            renderChamberSummary: renderCompactChamberDimensions,
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
    const detail = room ? renderCompactRoomDimensions(room) : '';
    text += detail;
  }
  if (node.event.result === DoorBeyond.Chamber) {
    const chamber = findChildEvent(node, 'chamberDimensions');
    const detail = chamber ? renderCompactChamberDimensions(chamber) : '';
    text += detail;
  }
  return text;
}

function renderChildPassageWidth(node: OutcomeEventNode): string {
  const width = findChildEvent(node, 'passageWidth');
  return width ? renderCompactPassageWidth(width) : '';
}

function getChildEvents(node: OutcomeEventNode): OutcomeEventNode[] {
  const children = node.children || [];
  return children.filter((c): c is OutcomeEventNode => c.type === 'event');
}

function joinCompactSegments(segments: string[]): string {
  const normalized = segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => (/[.!?]$/.test(segment) ? segment : `${segment}.`));
  if (normalized.length === 0) return '';
  return `${normalized.join(' ')} `;
}

function renderCompactRoomDimensions(node: OutcomeEventNode): string {
  if (node.event.kind !== 'roomDimensions') return '';
  const segments: string[] = [];
  switch (node.event.result) {
    case RoomDimensions.Square10x10:
      segments.push("The room is square and 10' x 10'.");
      break;
    case RoomDimensions.Square20x20:
      segments.push("The room is square and 20' x 20'.");
      break;
    case RoomDimensions.Square30x30:
      segments.push("The room is square and 30' x 30'.");
      break;
    case RoomDimensions.Square40x40:
      segments.push("The room is square and 40' x 40'.");
      break;
    case RoomDimensions.Rectangular10x20:
      segments.push("The room is rectangular and 10' x 20'.");
      break;
    case RoomDimensions.Rectangular20x30:
      segments.push("The room is rectangular and 20' x 30'.");
      break;
    case RoomDimensions.Rectangular20x40:
      segments.push("The room is rectangular and 20' x 40'.");
      break;
    case RoomDimensions.Rectangular30x40:
      segments.push("The room is rectangular and 30' x 40'.");
      break;
    case RoomDimensions.Unusual:
      segments.push('The room has an unusual shape and size.');
      break;
  }
  if (node.event.result === RoomDimensions.Unusual) {
    const unusual = renderCompactUnusualDetails(node).trim();
    if (unusual.length > 0) {
      segments.push(unusual);
    }
  }
  const exits = findChildEvent(node, 'numberOfExits');
  if (exits && exits.event.kind === 'numberOfExits') {
    const summary = describeNumberOfExits(exits);
    if (summary.compactText.length > 0) {
      segments.push(summary.compactText);
    }
  }
  return joinCompactSegments(segments);
}

function renderCompactChamberDimensions(node: OutcomeEventNode): string {
  if (node.event.kind !== 'chamberDimensions') return '';
  const segments: string[] = [];
  switch (node.event.result) {
    case ChamberDimensions.Square20x20:
      segments.push("The chamber is square and 20' x 20'.");
      break;
    case ChamberDimensions.Square30x30:
      segments.push("The chamber is square and 30' x 30'.");
      break;
    case ChamberDimensions.Square40x40:
      segments.push("The chamber is square and 40' x 40'.");
      break;
    case ChamberDimensions.Rectangular20x30:
      segments.push("The chamber is rectangular and 20' x 30'.");
      break;
    case ChamberDimensions.Rectangular30x50:
      segments.push("The chamber is rectangular and 30' x 50'.");
      break;
    case ChamberDimensions.Rectangular40x60:
      segments.push("The chamber is rectangular and 40' x 60'.");
      break;
    case ChamberDimensions.Unusual:
      segments.push('The chamber has an unusual shape and size.');
      break;
  }
  if (node.event.result === ChamberDimensions.Unusual) {
    const unusual = renderCompactUnusualDetails(node).trim();
    if (unusual.length > 0) {
      segments.push(unusual);
    }
  }
  const exits = findChildEvent(node, 'numberOfExits');
  if (exits && exits.event.kind === 'numberOfExits') {
    const summary = describeNumberOfExits(exits);
    if (summary.compactText.length > 0) {
      segments.push(summary.compactText);
    }
  }
  return joinCompactSegments(segments);
}

function renderCompactUnusualDetails(node: OutcomeEventNode): string {
  let text = '';
  const shape = findChildEvent(node, 'unusualShape');
  if (shape && shape.event.kind === 'unusualShape') {
    text += formatUnusualShape(shape.event.result);
    const circularSentences = collectCircularChainSentences(shape);
    if (circularSentences.length > 0) {
      text += circularSentences
        .map((sentence) =>
          sentence.endsWith('.') ||
          sentence.endsWith('!') ||
          sentence.endsWith('?')
            ? `${sentence} `
            : `${sentence}. `
        )
        .join('');
    }
  }
  const size = findChildEvent(node, 'unusualSize');
  if (size && size.event.kind === 'unusualSize') {
    const summary = describeUnusualSizeChain(size);
    if (summary.compactText.length > 0) {
      text += summary.compactText + ' ';
    }
  }
  if (shape || size) {
    text += 'Determine exits, contents, and treasure separately. ';
  }
  return text;
}

function formatUnusualShape(result: UnusualShape): string {
  switch (result) {
    case UnusualShape.Circular:
      return 'It is circular. ';
    case UnusualShape.Triangular:
      return 'It is triangular. ';
    case UnusualShape.Trapezoidal:
      return 'It is trapezoidal. ';
    case UnusualShape.OddShaped:
      return 'It is odd-shaped. (Draw what shape you desire or what will fit the map -- it is a special shape if desired.) ';
    case UnusualShape.Oval:
      return 'It is oval-shaped. ';
    case UnusualShape.Hexagonal:
      return 'It is hexagonal. ';
    case UnusualShape.Octagonal:
      return 'It is octagonal. ';
    case UnusualShape.Cave:
      return 'It is actually a cave. ';
    default:
      return '';
  }
}

function describeUnusualSizeChain(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'unusualSize') {
    return { detailParagraphs: [], compactText: '' };
  }
  const chain = gatherUnusualSizeChain(node);
  const detailParagraphs: DungeonMessage[] = [];
  const compactSegments: string[] = [];
  let accumulatedExtra = (node.event as { extra?: number }).extra ?? 0;
  for (const entry of chain) {
    if (entry.event.kind !== 'unusualSize') continue;
    const eventExtra =
      (entry.event as { extra?: number }).extra ?? accumulatedExtra;
    accumulatedExtra = Math.max(accumulatedExtra, eventExtra);
    if (entry.event.result === UnusualSize.RollAgain) {
      accumulatedExtra += 2000;
      const sentence = `Add 2000 sq. ft. (current total ${accumulatedExtra.toLocaleString()} sq. ft.) and roll again.`;
      detailParagraphs.push({ kind: 'paragraph', text: sentence });
      compactSegments.push(sentence);
      continue;
    }
    const baseArea = unusualSizeBase(entry.event.result);
    if (baseArea !== undefined) {
      const total = baseArea + accumulatedExtra;
      const sentence = `It is about ${total.toLocaleString()} sq. ft.`;
      detailParagraphs.push({ kind: 'paragraph', text: sentence });
      compactSegments.push(sentence);
    }
  }
  return {
    detailParagraphs,
    compactText: compactSegments.join(' '),
  };
}

function gatherUnusualSizeChain(node: OutcomeEventNode): OutcomeEventNode[] {
  const result: OutcomeEventNode[] = [node];
  let current: OutcomeEventNode | undefined = node;
  const visited = new Set<string>();
  while (current) {
    const next: OutcomeEventNode | undefined = getChildEvents(current).find(
      (child): child is OutcomeEventNode => child.event.kind === 'unusualSize'
    );
    if (!next) break;
    const key = next.id ?? `${current.id}.unusualSize`;
    if (visited.has(key)) break;
    visited.add(key);
    result.push(next);
    current = next;
  }
  return result;
}

function unusualSizeBase(result: UnusualSize): number | undefined {
  switch (result) {
    case UnusualSize.SqFt500:
      return 500;
    case UnusualSize.SqFt900:
      return 900;
    case UnusualSize.SqFt1300:
      return 1300;
    case UnusualSize.SqFt2000:
      return 2000;
    case UnusualSize.SqFt2700:
      return 2700;
    case UnusualSize.SqFt3400:
      return 3400;
    default:
      return undefined;
  }
}

function formatCircularContents(result: CircularContents): string {
  switch (result) {
    case CircularContents.Well:
      return 'There is a well. ';
    case CircularContents.Shaft:
      return 'There is a shaft. ';
    default:
      return '';
  }
}

function formatCircularPool(result: Pool): string {
  switch (result) {
    case Pool.PoolNoMonster:
      return 'There is a pool.';
    case Pool.PoolMonster:
      return 'There is a pool. There is a monster in the pool. (TODO Monster) ';
    case Pool.PoolMonsterTreasure:
      return 'There is a pool. There is a monster and treasure in the pool. (TODO Monster Treasure) ';
    case Pool.MagicPool:
      return 'There is a pool. It is a magical pool. (In order to find out what it is, characters must enter the magic pool.) ';
    default:
      return '';
  }
}

function formatCircularMagicPoolResult(result: MagicPool): string {
  switch (result) {
    case MagicPool.TransmuteGold:
      return 'It transmutes gold.';
    case MagicPool.AlterCharacteristic:
      return 'It will, on a one-time only basis, add (1–3) or subtract (4–6) 1–3 points from one characteristic of all who stand within it: (d6) 1-STR, 2-INT, 3-WIS, 4-DEX, 5-CON, 6-CHA. Roll chances, amount, and characteristic separately for each character. ';
    case MagicPool.WishOrDamage:
      return 'It is a talking pool, and will grant one wish to characters of its alignment, and damage others for 1–20 points. Wish can be withheld for up to 1 day. ';
    case MagicPool.Transporter:
      return TRANSPORTER_BASE_SENTENCE;
    default:
      return '';
  }
}

function formatTransmuteType(result: TransmuteType): string {
  return result === TransmuteType.GoldToPlatinum
    ? 'It will turn gold to platinum, one time only. '
    : 'It will turn gold to lead, one time only. ';
}

function formatPoolAlignment(result: PoolAlignment): string {
  switch (result) {
    case PoolAlignment.LawfulGood:
      return 'It is Lawful Good. ';
    case PoolAlignment.LawfulEvil:
      return 'It is Lawful Evil. ';
    case PoolAlignment.ChaoticGood:
      return 'It is Chaotic Good. ';
    case PoolAlignment.ChaoticEvil:
      return 'It is Chaotic Evil. ';
    case PoolAlignment.Neutral:
      return 'It is Neutral. ';
    default:
      return '';
  }
}

function formatTransporterLocation(result: TransporterLocation): string {
  switch (result) {
    case TransporterLocation.Surface:
      return 'It transports characters back to the surface.';
    case TransporterLocation.SameLevelElsewhere:
      return 'It transports characters elsewhere on the same level.';
    case TransporterLocation.OneLevelDown:
      return 'It transports characters one level down.';
    case TransporterLocation.Away100Miles:
      return 'It transports characters 100 miles away for outdoor adventure.';
    default:
      return '';
  }
}

const TRANSPORTER_BASE_SENTENCE = 'It is a transporter.';
function describeTransporterLocation(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'transporterLocation') {
    return { detailParagraphs: [], compactText: '' };
  }
  const sentence = formatTransporterLocation(node.event.result).trim();
  if (!sentence) {
    return { detailParagraphs: [], compactText: '' };
  }
  return {
    detailParagraphs: [{ kind: 'paragraph', text: `${sentence} ` }],
    compactText: sentence,
  };
}

function describeMagicPoolTransporter(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'circularMagicPool') {
    return { detailParagraphs: [], compactText: '' };
  }
  if (node.event.result !== MagicPool.Transporter) {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailParagraphs: DungeonMessage[] = [
    { kind: 'paragraph', text: `${TRANSPORTER_BASE_SENTENCE} ` },
  ];
  const segments: string[] = [TRANSPORTER_BASE_SENTENCE];
  const location = findChildEvent(node, 'transporterLocation');
  if (location && location.event.kind === 'transporterLocation') {
    const locationSummary = describeTransporterLocation(location);
    if (locationSummary.detailParagraphs.length > 0) {
      detailParagraphs.push(...locationSummary.detailParagraphs);
    }
    if (locationSummary.compactText.length > 0) {
      segments.push(locationSummary.compactText);
    }
  }
  return { detailParagraphs, compactText: segments.join(' ') };
}

const CIRCULAR_CHAIN_KINDS = new Set<OutcomeEvent['kind']>([
  'circularContents',
  'circularPool',
  'circularMagicPool',
  'transmuteType',
  'poolAlignment',
  'transporterLocation',
]);

function circularSentenceForEvent(
  eventNode: OutcomeEventNode
): string | undefined {
  switch (eventNode.event.kind) {
    case 'circularContents':
      return formatCircularContents(eventNode.event.result).trim();
    case 'circularPool':
      return formatCircularPool(eventNode.event.result).trim();
    case 'circularMagicPool':
      return formatCircularMagicPoolResult(eventNode.event.result).trim();
    case 'transmuteType':
      return formatTransmuteType(eventNode.event.result).trim();
    case 'poolAlignment':
      return formatPoolAlignment(eventNode.event.result).trim();
    case 'transporterLocation': {
      const summary = describeTransporterLocation(eventNode);
      return summary.compactText.trim();
    }
    default:
      return undefined;
  }
}

function collectCircularChainSentences(node: OutcomeEventNode): string[] {
  const sentences: string[] = [];
  const visited = new Set<string>();
  const queue: OutcomeEventNode[] = getChildEvents(node).filter((child) =>
    CIRCULAR_CHAIN_KINDS.has(child.event.kind)
  );
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const key = current.id ?? `${current.event.kind}-${sentences.length}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const sentence = circularSentenceForEvent(current);
    if (sentence && sentence.length > 0) {
      sentences.push(sentence);
    }
    for (const child of getChildEvents(current)) {
      if (CIRCULAR_CHAIN_KINDS.has(child.event.kind)) {
        queue.push(child);
      }
    }
  }
  return sentences;
}

function formatTrickTrap(result: number): string {
  return `There is a trick or trap. (roll ${result}) -- check again in 30'. `;
}

function renderCompactPeriodicOutcome(node: OutcomeEventNode): string {
  if (node.event.kind !== 'periodicCheck') return '';
  const event = node.event;
  switch (event.result) {
    case PeriodicCheck.Door:
      return renderCompactDoorChain(findChildEvent(node, 'doorLocation'));
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
        ? renderCompactPassageTurn(turn)
        : periodicBaseTexts(event.result, {
            avoidMonster: event.avoidMonster ?? false,
          }).compact;
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? renderCompactChamberDimensions(chamber) : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return stairs
        ? renderCompactStairs(stairs, {
            renderChamberSummary: renderCompactChamberDimensions,
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
