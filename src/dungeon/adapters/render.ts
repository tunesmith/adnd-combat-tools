import type {
  DoorChainLaterality,
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
import { trickTrapMessages } from '../services/trickTrap';
import { passageWidth, PassageWidth } from '../../tables/dungeon/passageWidth';
import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
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
  SpecialPassage,
  specialPassage,
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
  riverBoatBank,
  RiverBoatBank,
  galleryStairOccurrence,
  GalleryStairOccurrence,
  jumpingPlaceWidth,
  JumpingPlaceWidth,
} from '../../tables/dungeon/specialPassage';
import {
  numberOfExits,
  NumberOfExits,
} from '../../tables/dungeon/numberOfExits';
import { unusualShape, UnusualShape } from '../../tables/dungeon/unusualShape';
import { unusualSize, UnusualSize } from '../../tables/dungeon/unusualSize';
import { PeriodicCheckDoorOnly } from '../../tables/dungeon/periodicCheckDoorOnly';
// detail-mode preview helpers remain for other flows; compact composition is local
import {
  resolveChamberDimensions,
  resolveChute,
  resolveDoorLocation,
  resolveEgress,
  resolveGalleryStairLocation,
  resolveGalleryStairOccurrence,
  resolveNumberOfExits,
  resolvePassageTurns,
  resolvePassageWidth,
  resolvePeriodicDoorOnly,
  resolveRoomDimensions,
  resolveSidePassages,
  resolveStreamConstruction,
  resolveRiverConstruction,
  resolveRiverBoatBank,
  resolveChasmDepth,
  resolveChasmConstruction,
  resolveJumpingPlaceWidth,
  resolveSpecialPassage,
  resolveStairs,
  resolveUnusualShape,
  resolveUnusualSize,
  resolveWanderingWhereFrom,
  resolveMonsterLevel,
  resolveMonsterOne,
  resolveMonsterTwo,
  resolveMonsterThree,
  resolveMonsterFour,
  resolveMonsterFive,
  resolveMonsterSix,
  resolveDragonThree,
  resolveDragonFourYounger,
  resolveDragonFourOlder,
  resolveDragonFiveYounger,
  resolveDragonFiveOlder,
  resolveDragonSix,
  resolveHuman,
} from '../domain/resolvers';

function rangeText(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
}

function appendPendingPreviews(
  outcome: DungeonOutcomeNode,
  collector: DungeonRenderNode[]
): void {
  if (outcome.type !== 'event') return;
  const children = outcome.children;
  if (!children || !Array.isArray(children)) return;
  for (const child of children) {
    if (child.type !== 'pending-roll') continue;
    const preview = previewForPending(child);
    if (preview) collector.push(preview);
  }
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
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 3,
      text: 'Passage',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${PeriodicCheck[event.result]}`],
    };
    nodes.push(heading, bullet);
    switch (event.result) {
      case PeriodicCheck.ContinueStraight:
        nodes.push({
          kind: 'paragraph',
          text: "Continue straight -- check again in 60'. ",
        });
        break;
      case PeriodicCheck.Door: {
        nodes.push({ kind: 'paragraph', text: 'A closed door is indicated.' });
        break;
      }
      case PeriodicCheck.SidePassage: {
        nodes.push({ kind: 'paragraph', text: 'A side passage occurs.' });
        break;
      }
      case PeriodicCheck.PassageTurn: {
        nodes.push({ kind: 'paragraph', text: 'The passage turns.' });
        break;
      }
      case PeriodicCheck.Chamber: {
        nodes.push({
          kind: 'paragraph',
          text: 'The passage opens into a chamber. ',
        });
        break;
      }
      case PeriodicCheck.Stairs: {
        nodes.push({ kind: 'paragraph', text: 'Stairs are indicated here.' });
        break;
      }
      case PeriodicCheck.DeadEnd:
        nodes.push({
          kind: 'paragraph',
          text: 'The passage reaches a dead end. (TODO) ',
        });
        break;
      case PeriodicCheck.TrickTrap: {
        nodes.push({
          kind: 'paragraph',
          text: 'There is a trick or trap here.',
        });
        break;
      }
      case PeriodicCheck.WanderingMonster:
        nodes.push({
          kind: 'paragraph',
          text: 'A wandering monster is indicated.',
        });
        break;
    }
    // Render any pending child previews supplied by the resolver
    if (outcome.children && Array.isArray(outcome.children)) {
      for (const child of outcome.children) {
        if (child.type !== 'pending-roll') continue;
        const preview = previewForPending(child);
        if (preview) nodes.push(preview);
      }
    }
    return nodes;
  }
  if (event.kind === 'doorBeyond') {
    const heading: DungeonMessage = { kind: 'heading', level: 3, text: 'Door' };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${DoorBeyond[event.result]}`],
    };
    nodes.push(heading, bullet);
    switch (event.result) {
      case DoorBeyond.ParallelPassageOrCloset: {
        if (event.doorAhead) {
          nodes.push({
            kind: 'paragraph',
            text: "Beyond the door is a 10' x 10' room (check contents, treasure). ",
          });
        } else {
          nodes.push({
            kind: 'paragraph',
            text: "Beyond the door is a parallel passage, extending 30' in both directions. ",
          });
          nodes.push({
            kind: 'table-preview',
            id: 'passageWidth',
            title: 'Passage Width',
            sides: passageWidth.sides,
            entries: passageWidth.entries.map((e) => ({
              range: rangeText(e.range),
              label: PassageWidth[e.command] ?? String(e.command),
            })),
          });
        }
        break;
      }
      case DoorBeyond.PassageStraightAhead: {
        nodes.push({
          kind: 'paragraph',
          text: 'Beyond the door is a passage straight ahead. ',
        });
        nodes.push({
          kind: 'table-preview',
          id: 'passageWidth',
          title: 'Passage Width',
          sides: passageWidth.sides,
          entries: passageWidth.entries.map((e) => ({
            range: rangeText(e.range),
            label: PassageWidth[e.command] ?? String(e.command),
          })),
        });
        break;
      }
      case DoorBeyond.Passage45AheadBehind: {
        nodes.push({
          kind: 'paragraph',
          text: 'Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). ',
        });
        nodes.push({
          kind: 'table-preview',
          id: 'passageWidth',
          title: 'Passage Width',
          sides: passageWidth.sides,
          entries: passageWidth.entries.map((e) => ({
            range: rangeText(e.range),
            label: PassageWidth[e.command] ?? String(e.command),
          })),
        });
        break;
      }
      case DoorBeyond.Passage45BehindAhead: {
        nodes.push({
          kind: 'paragraph',
          text: 'Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). ',
        });
        nodes.push({
          kind: 'table-preview',
          id: 'passageWidth',
          title: 'Passage Width',
          sides: passageWidth.sides,
          entries: passageWidth.entries.map((e) => ({
            range: rangeText(e.range),
            label: PassageWidth[e.command] ?? String(e.command),
          })),
        });
        break;
      }
      case DoorBeyond.Room: {
        nodes.push({ kind: 'paragraph', text: 'Beyond the door is a room. ' });
        nodes.push({
          kind: 'table-preview',
          id: 'roomDimensions',
          title: 'Room Dimensions',
          sides: roomDimensions.sides,
          entries: roomDimensions.entries.map((e) => ({
            range: rangeText(e.range),
            label: RoomDimensions[e.command] ?? String(e.command),
          })),
        });
        break;
      }
      case DoorBeyond.Chamber: {
        nodes.push({
          kind: 'paragraph',
          text: 'Beyond the door is a chamber. ',
        });
        nodes.push({
          kind: 'table-preview',
          id: 'chamberDimensions',
          title: 'Chamber Dimensions',
          sides: chamberDimensions.sides,
          entries: chamberDimensions.entries.map((e) => ({
            range: rangeText(e.range),
            label: ChamberDimensions[e.command] ?? String(e.command),
          })),
        });
        break;
      }
    }
    return nodes;
  }
  if (isPassageWidthEvent(event)) {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Passage Width',
    };
    const r = (event as { result: number }).result;
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${PassageWidth[r as PassageWidth]}`],
    };
    let text = '';
    switch (r as PassageWidth) {
      case PassageWidth.FiveFeet:
        text = "The passage is 5' wide. ";
        break;
      case PassageWidth.TenFeet:
        text = "The passage is 10' wide. ";
        break;
      case PassageWidth.TwentyFeet:
        text = "The passage is 20' wide. ";
        break;
      case PassageWidth.ThirtyFeet:
        text = "The passage is 30' wide. ";
        break;
      case PassageWidth.SpecialPassage:
        text = compactRandomSpecialPassage();
        break;
    }
    return [heading, bullet, { kind: 'paragraph', text }];
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
    let text = '';
    switch (event.result) {
      case SidePassages.Left90:
        text =
          "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right90:
        text =
          "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Left45:
        text =
          "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right45:
        text =
          "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Left135:
        text =
          "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right135:
        text =
          "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
        break;
      case SidePassages.LeftCurve45:
        text =
          "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.RightCurve45:
        text =
          "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageT:
        text =
          "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageY:
        text =
          "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.FourWay:
        text =
          "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageX:
        text =
          "The passage reaches an 'X' intersection. (If the present passage is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. ";
        break;
    }
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    return nodes;
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
        if (preview) nodes.push(preview);
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
        if (preview) nodes.push(preview);
      }
    }
    return nodes;
  }
  if (event.kind === 'passageTurns') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Passage Turns',
    };
    const label = PassageTurns[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let textPrefix = '';
    switch (event.result) {
      case PassageTurns.Left90:
        textPrefix = "The passage turns left 90 degrees - check again in 30'. ";
        break;
      case PassageTurns.Left45:
        textPrefix =
          "The passage turns left 45 degrees ahead - check again in 30'. ";
        break;
      case PassageTurns.Left135:
        textPrefix =
          "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
        break;
      case PassageTurns.Right90:
        textPrefix =
          "The passage turns right 90 degrees - check again in 30'. ";
        break;
      case PassageTurns.Right45:
        textPrefix =
          "The passage turns right 45 degrees ahead - check again in 30'. ";
        break;
      case PassageTurns.Right135:
        textPrefix =
          "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
        break;
    }
    nodes.push(heading, bullet, { kind: 'paragraph', text: textPrefix });
    // Render any pending child previews supplied by the resolver
    if (outcome.children && Array.isArray(outcome.children)) {
      for (const child of outcome.children) {
        if (child.type !== 'pending-roll') continue;
        const preview = previewForPending(child);
        if (preview) nodes.push(preview);
      }
    }
    return nodes;
  }
  if (event.kind === 'stairs') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Stairs',
    };
    const label = Stairs[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let text = '';
    switch (event.result) {
      case Stairs.DownOne:
        text = 'There are stairs here that descend one level. ';
        break;
      case Stairs.DownTwo:
        text = 'There are stairs here that descend two levels. ';
        break;
      case Stairs.DownThree:
        text = 'There are stairs here that descend three levels. ';
        break;
      case Stairs.UpOne:
        text = 'There are stairs here that ascend one level. ';
        break;
      case Stairs.UpDead:
        text = 'There are stairs here that ascend one level to a dead end. ';
        break;
      case Stairs.DownDead:
        text = 'There are stairs here that descend one level to a dead end. ';
        break;
      case Stairs.ChimneyUpOne:
        text =
          "There is a chimney that goes up one level. The current passage continues, check again in 30'. ";
        break;
      case Stairs.ChimneyUpTwo:
        text =
          "There is a chimney that goes up two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.ChimneyDownTwo:
        text =
          "There is a chimney that goes down two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.TrapDoorDownOne:
        text =
          "There is a trap door that goes down one level. The current passage continues, check again in 30'. ";
        break;
      case Stairs.TrapDownDownTwo:
        text =
          "There is a trap door that goes down two levels. The current passage continues, check again in 30'. ";
        break;
      case Stairs.UpOneDownTwo:
        text =
          'There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. ';
        break;
    }
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    // Render pending child previews from resolver
    if (
      outcome.type === 'event' &&
      outcome.children &&
      Array.isArray(outcome.children)
    ) {
      for (const child of outcome.children) {
        if (child.type !== 'pending-roll') continue;
        const preview = previewForPending(child);
        if (preview) nodes.push(preview);
      }
    }
    return nodes;
  }
  if (event.kind === 'specialPassage') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Special Passage',
    };
    const label = SpecialPassage[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let text = '';
    switch (event.result) {
      case SpecialPassage.FortyFeetColumns:
        text = "The passage is 40' wide, with columns down the center. ";
        break;
      case SpecialPassage.FortyFeetDoubleColumns:
        text = "The passage is 40' wide, with a double row of columns. ";
        break;
      case SpecialPassage.FiftyFeetDoubleColumns:
        text = "The passage is 50' wide, with a double row of columns. ";
        break;
      case SpecialPassage.FiftyFeetGalleries:
        text =
          "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. ";
        break;
      case SpecialPassage.TenFootStream:
        text = "A stream, 10' wide, bisects the passage. ";
        break;
      case SpecialPassage.TwentyFootRiver:
        text = "A river, 20' wide, bisects the passage. ";
        break;
      case SpecialPassage.FortyFootRiver:
        text = "A river, 40' wide, bisects the passage. ";
        break;
      case SpecialPassage.SixtyFootRiver:
        text = "A river, 60' wide, bisects the passage. ";
        break;
      case SpecialPassage.TwentyFootChasm:
        text = "A chasm, 20' wide, bisects the passage. ";
        break;
    }
    nodes.push(heading, bullet, { kind: 'paragraph', text });
    if (event.result === SpecialPassage.FiftyFeetGalleries) {
      nodes.push({
        kind: 'table-preview',
        id: 'galleryStairLocation',
        title: 'Gallery Stair Location',
        sides: galleryStairLocation.sides,
        entries: galleryStairLocation.entries.map((e) => ({
          range: rangeText(e.range),
          label: GalleryStairLocation[e.command] ?? String(e.command),
        })),
      });
    } else if (event.result === SpecialPassage.TenFootStream) {
      nodes.push({
        kind: 'table-preview',
        id: 'streamConstruction',
        title: 'Stream Construction',
        sides: streamConstruction.sides,
        entries: streamConstruction.entries.map((e) => ({
          range: rangeText(e.range),
          label: StreamConstruction[e.command] ?? String(e.command),
        })),
      });
    } else if (
      event.result === SpecialPassage.TwentyFootRiver ||
      event.result === SpecialPassage.FortyFootRiver ||
      event.result === SpecialPassage.SixtyFootRiver
    ) {
      nodes.push({
        kind: 'table-preview',
        id: 'riverConstruction',
        title: 'River Construction',
        sides: riverConstruction.sides,
        entries: riverConstruction.entries.map((e) => ({
          range: rangeText(e.range),
          label: RiverConstruction[e.command] ?? String(e.command),
        })),
      });
    } else if (event.result === SpecialPassage.TwentyFootChasm) {
      nodes.push({
        kind: 'table-preview',
        id: 'chasmDepth',
        title: 'Chasm Depth',
        sides: chasmDepth.sides,
        entries: chasmDepth.entries.map((e) => ({
          range: rangeText(e.range),
          label: ChasmDepth[e.command] ?? String(e.command),
        })),
      });
      nodes.push({
        kind: 'table-preview',
        id: 'chasmConstruction',
        title: 'Chasm Construction',
        sides: chasmConstruction.sides,
        entries: chasmConstruction.entries.map((e) => ({
          range: rangeText(e.range),
          label: ChasmConstruction[e.command] ?? String(e.command),
        })),
      });
    }
    return nodes;
  }
  if (isPassageWidthEvent(event)) {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Passage Width',
    };
    const r = (event as { result: number }).result;
    const label = PassageWidth[r as PassageWidth] ?? String(r);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    let text = '';
    switch (r as PassageWidth) {
      case PassageWidth.FiveFeet:
        text = "The passage is 5' wide. ";
        break;
      case PassageWidth.TenFeet:
        text = "The passage is 10' wide. ";
        break;
      case PassageWidth.TwentyFeet:
        text = "The passage is 20' wide. ";
        break;
      case PassageWidth.ThirtyFeet:
        text = "The passage is 30' wide. ";
        break;
      case PassageWidth.SpecialPassage:
        text = ''; // defer to special passage preview below
        break;
    }
    const nodes2: DungeonRenderNode[] = [heading, bullet];
    if (text) nodes2.push({ kind: 'paragraph', text });
    if ((r as PassageWidth) === PassageWidth.SpecialPassage) {
      const prev = previewForPending({
        type: 'pending-roll',
        table: 'specialPassage',
      });
      if (prev) nodes2.push(prev);
    }
    return nodes2;
  }
  if (event.kind === 'egress') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Egress',
    };
    const label = Egress[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const suffix =
      event.result === Egress.Closed
        ? 'After descending, an unnoticed door will close egress for the day. '
        : '';
    return [heading, bullet, { kind: 'paragraph', text: suffix }];
  }
  if (event.kind === 'chute') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Chute',
    };
    const label = Chute[event.result as 0 | 1] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const text =
      event.result === Chute.Exists
        ? 'The stairs will turn into a chute, descending two levels from the top. '
        : '';
    return [heading, bullet, { kind: 'paragraph', text }];
  }
  if ((event as { kind?: unknown }).kind === 'numberOfExits') {
    const ev = event as unknown as {
      result: NumberOfExits;
      context: { length: number; width: number; isRoom: boolean };
    };
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Exits',
    };
    const label = NumberOfExits[ev.result] ?? String(ev.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    const area = ev.context.length * ev.context.width;
    let text = '';
    switch (ev.result) {
      case NumberOfExits.OneTwo600:
        text =
          area <= 600
            ? 'There is one additional exit. (TODO location, direction/width if passage) '
            : 'There are two additional exits. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.TwoThree600:
        text =
          area <= 600
            ? 'There are two additional exits. (TODO location, direction/width if passage) '
            : 'There are three additional exits. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.ThreeFour600:
        text =
          area <= 600
            ? 'There are three additional exits. (TODO location, direction/width if passage) '
            : 'There are four additional exits. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.ZeroOne1200:
        text =
          area <= 1200
            ? 'There are no exits here, other than the entrance. (TODO secret doors) '
            : 'There is one additional exit. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.ZeroOne1600:
        text =
          area <= 1600
            ? 'There are no exits here, other than the entrance. (TODO secret doors) '
            : 'There is one additional exit. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.OneToFour:
        text =
          'There are 1d4 exits here, other than the entrance. (TODO d4, location, direction/width if passage) ';
        break;
      case NumberOfExits.DoorChamberOrPassageRoom:
        text = ev.context.isRoom
          ? 'There is a passage exiting from the room. (TODO location/direction/width) '
          : 'There is a door. (TODO location) ';
        break;
    }
    return [heading, bullet, { kind: 'paragraph', text }];
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
    return [heading, bullet, { kind: 'paragraph', text }];
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
    let size = 3400; // default fallback
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
        size = 3400;
        break;
    }
    const text = `It is about ${size} sq. ft. `;
    return [heading, bullet, { kind: 'paragraph', text }];
  }
  if (event.kind === 'monsterLevel') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Monster Level',
    };
    const label = MonsterLevel[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet);
    if (event.result > MonsterLevel.Six) {
      nodes.push({
        kind: 'paragraph',
        text: `(TODO: Monster Level ${MonsterLevel[event.result]} preview)`,
      });
    }
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  if (event.kind === 'monsterOne') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Monster (Level 1)',
    };
    const label = MonsterOne[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet);
    if (event.text) {
      nodes.push({ kind: 'paragraph', text: event.text });
    }
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  if (event.kind === 'monsterTwo') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Monster (Level 2)',
    };
    const label = MonsterTwo[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet, {
      kind: 'paragraph',
      text: event.text,
    });
    return nodes;
  }
  if (event.kind === 'monsterThree') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Monster (Level 3)',
    };
    const label = MonsterThree[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet);
    if (event.text) {
      nodes.push({ kind: 'paragraph', text: event.text });
    }
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  if (event.kind === 'monsterFour') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Monster (Level 4)',
    };
    const label = MonsterFour[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet);
    if (event.text) {
      nodes.push({ kind: 'paragraph', text: event.text });
    }
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  if (event.kind === 'monsterFive') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Monster (Level 5)',
    };
    const label = MonsterFive[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet);
    if (event.text) {
      nodes.push({ kind: 'paragraph', text: event.text });
    }
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  if (event.kind === 'monsterSix') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Monster (Level 6)',
    };
    const label = MonsterSix[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet);
    if (event.text) {
      nodes.push({ kind: 'paragraph', text: event.text });
    }
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  if (event.kind === 'dragonThree') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Dragon (Level 3)',
    };
    const label = DragonThree[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet, { kind: 'paragraph', text: event.text });
    return nodes;
  }
  if (event.kind === 'dragonFourYounger') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Dragon (Younger)',
    };
    const label = DragonFourYounger[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet, { kind: 'paragraph', text: event.text });
    return nodes;
  }
  if (event.kind === 'dragonFourOlder') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Dragon (Older)',
    };
    const label = DragonFourOlder[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet, { kind: 'paragraph', text: event.text });
    return nodes;
  }
  if (event.kind === 'dragonFiveYounger') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Dragon (Younger)',
    };
    const label = DragonFiveYounger[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet, { kind: 'paragraph', text: event.text });
    return nodes;
  }
  if (event.kind === 'dragonFiveOlder') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Dragon (Older)',
    };
    const label = DragonFiveOlder[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet, { kind: 'paragraph', text: event.text });
    return nodes;
  }
  if (event.kind === 'dragonSix') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Dragon',
    };
    const label = DragonSix[event.result] ?? String(event.result);
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${label}`],
    };
    nodes.push(heading, bullet, { kind: 'paragraph', text: event.text });
    return nodes;
  }
  if (event.kind === 'human') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Human Subtable',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${humanLabel(event.result)}`],
    };
    nodes.push(heading, bullet, { kind: 'paragraph', text: event.text });
    return nodes;
  }
  return nodes;
}

function isTableContext(x: unknown): x is TableContext {
  if (!x || typeof x !== 'object') return false;
  const k = (x as { kind?: unknown }).kind;
  if (k === 'doorChain')
    return Array.isArray((x as { existing?: unknown }).existing);
  if (k === 'wandering')
    return typeof (x as { level?: unknown }).level === 'number';
  if (k === 'exits') {
    const o = x as { length?: unknown; width?: unknown; isRoom?: unknown };
    return (
      typeof o.length === 'number' &&
      typeof o.width === 'number' &&
      typeof o.isRoom === 'boolean'
    );
  }
  return false;
}

function readDungeonLevelFromPending(p: PendingRoll, fallback: number): number {
  const parts = p.table.split(':');
  if (parts.length >= 2) {
    const parsed = Number(parts[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (isTableContext(p.context) && p.context.kind === 'wandering') {
    return p.context.level;
  }
  return fallback;
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
    case 'trickTrap': {
      // Use existing trick/trap messages to build preview
      const preview = trickTrapMessages({ detailMode: true });
      const tp = preview.messages.find((m) => m.kind === 'table-preview') as
        | DungeonTablePreview
        | undefined;
      return tp;
    }
  }
  return undefined;
}

function isPassageWidthEvent(
  ev: unknown
): ev is { kind: 'passageWidth'; result: PassageWidth } {
  if (!ev || typeof ev !== 'object') return false;
  const o = ev as { kind?: unknown; result?: unknown };
  return o.kind === 'passageWidth' && typeof o.result === 'number';
}

// COMPACT MODE: outcome -> render nodes with auto-resolved text (no previews)
export function toCompactRender(
  outcome: DungeonOutcomeNode
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const resolved = resolveNodeForCompact(outcome);
  const node = resolved ?? outcome;
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
    // Text equals the detail path text
    let text = '';
    switch (event.result) {
      case SidePassages.Left90:
        text =
          "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right90:
        text =
          "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Left45:
        text =
          "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right45:
        text =
          "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Left135:
        text =
          "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
        break;
      case SidePassages.Right135:
        text =
          "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
        break;
      case SidePassages.LeftCurve45:
        text =
          "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.RightCurve45:
        text =
          "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageT:
        text =
          "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageY:
        text =
          "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.FourWay:
        text =
          "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
        break;
      case SidePassages.PassageX:
        text =
          "The passage reaches an 'X' intersection. (If the present passage is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. ";
        break;
    }
    nodes.push(heading, bullet, { kind: 'paragraph', text });
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
    const text = renderCompactStairs(node);
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
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Egress',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${Egress[event.result]}`],
    };
    const suffix =
      event.result === Egress.Closed
        ? 'After descending, an unnoticed door will close egress for the day. '
        : '';
    return [heading, bullet, { kind: 'paragraph', text: suffix }];
  }
  if (event.kind === 'chute') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Chute',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${Chute[event.result as 0 | 1]}`],
    };
    const text =
      event.result === Chute.Exists
        ? 'The stairs will turn into a chute, descending two levels from the top. '
        : '';
    return [heading, bullet, { kind: 'paragraph', text }];
  }
  if ((event as { kind?: unknown }).kind === 'numberOfExits') {
    const ev = event as unknown as {
      result: NumberOfExits;
      context: { length: number; width: number; isRoom: boolean };
    };
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Exits',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${roll} — ${NumberOfExits[ev.result]}`],
    };
    const area = ev.context.length * ev.context.width;
    let text = '';
    switch (ev.result) {
      case NumberOfExits.OneTwo600:
        text =
          area <= 600
            ? 'There is one additional exit. (TODO location, direction/width if passage) '
            : 'There are two additional exits. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.TwoThree600:
        text =
          area <= 600
            ? 'There are two additional exits. (TODO location, direction/width if passage) '
            : 'There are three additional exits. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.ThreeFour600:
        text =
          area <= 600
            ? 'There are three additional exits. (TODO location, direction/width if passage) '
            : 'There are four additional exits. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.ZeroOne1200:
        text =
          area <= 1200
            ? 'There are no exits here, other than the entrance. (TODO secret doors) '
            : 'There is one additional exit. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.ZeroOne1600:
        text =
          area <= 1600
            ? 'There are no exits here, other than the entrance. (TODO secret doors) '
            : 'There is one additional exit. (TODO location, direction/width if passage) ';
        break;
      case NumberOfExits.OneToFour:
        text =
          'There are 1d4 exits here, other than the entrance. (TODO d4, location, direction/width if passage) ';
        break;
      case NumberOfExits.DoorChamberOrPassageRoom:
        text = ev.context.isRoom
          ? 'There is a passage exiting from the room. (TODO location/direction/width) '
          : 'There is a door. (TODO location) ';
        break;
    }
    return [heading, bullet, { kind: 'paragraph', text }];
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
function renderCompactDoorChain(
  existing: DoorChainLaterality[] = [],
  resolvedNode?: OutcomeEventNode
): string {
  const root =
    resolvedNode ??
    resolveNodeForCompact({
      type: 'pending-roll',
      table: `doorLocation:${existing.length}`,
      context: { kind: 'doorChain', existing: [...existing] },
    });
  if (!root) return 'A door is indicated. ';
  const events = flattenOutcomeTree(root);
  return formatDoorChain(events);
}

function flattenOutcomeTree(node: OutcomeEventNode): OutcomeEventNode[] {
  const items: OutcomeEventNode[] = [node];
  const childEvents = (node.children || []).filter(
    (child): child is OutcomeEventNode => child.type === 'event'
  );
  for (const child of childEvents) {
    items.push(...flattenOutcomeTree(child));
  }
  return items;
}

function formatDoorChain(events: OutcomeEventNode[]): string {
  let text = '';
  for (const ev of events) {
    if (ev.event.kind === 'doorLocation') {
      text += formatDoorLocationEvent(ev.event);
    } else if (ev.event.kind === 'periodicDoorOnly') {
      text += formatPeriodicDoorOnlyEvent(ev.event);
    }
  }
  return text;
}

function resolveNodeForCompact(
  node: DungeonOutcomeNode,
  depth = 0
): OutcomeEventNode | undefined {
  if (depth > 16) return undefined;
  if (node.type === 'event') {
    const childEvents = resolveChildrenForCompact(node.children, depth + 1);
    return {
      type: 'event',
      event: node.event,
      roll: node.roll,
      children: childEvents.length
        ? (childEvents as unknown as DungeonOutcomeNode[])
        : undefined,
    };
  }
  const resolved = resolvePendingForCompact(node);
  if (!resolved) return undefined;
  return resolveNodeForCompact(resolved, depth + 1);
}

function resolveChildrenForCompact(
  children: DungeonOutcomeNode[] | undefined,
  depth = 0
): OutcomeEventNode[] {
  if (!children) return [];
  const result: OutcomeEventNode[] = [];
  for (const child of children) {
    const resolved = resolveNodeForCompact(child, depth + 1);
    if (resolved) result.push(resolved);
  }
  return result;
}

function resolvePendingForCompact(
  pending: PendingRoll
): DungeonOutcomeNode | undefined {
  const base = pending.table.split(':')[0] ?? '';
  switch (base) {
    case 'doorLocation': {
      const existing = readDoorChainExisting(pending.context);
      const sequence = parseDoorChainSequence(pending.table, existing.length);
      return resolveDoorLocation({ existing, sequence });
    }
    case 'periodicCheckDoorOnly': {
      const existing = readDoorChainExisting(pending.context);
      const sequence = parseDoorChainSequence(pending.table, existing.length);
      return resolvePeriodicDoorOnly({ existing, sequence });
    }
    case 'sidePassages':
      return resolveSidePassages({});
    case 'passageTurns':
      return resolvePassageTurns({});
    case 'passageWidth':
      return resolvePassageWidth({});
    case 'stairs':
      return resolveStairs({});
    case 'egress': {
      const which = parseEgressWhich(pending.table);
      return resolveEgress({ which, roll: undefined });
    }
    case 'chute':
      return resolveChute({});
    case 'specialPassage':
      return resolveSpecialPassage({});
    case 'roomDimensions':
      return resolveRoomDimensions({});
    case 'chamberDimensions':
      return resolveChamberDimensions({});
    case 'unusualShape':
      return resolveUnusualShape({});
    case 'unusualSize':
      return resolveUnusualSize({});
    case 'wanderingWhereFrom':
      return resolveWanderingWhereFrom({});
    case 'galleryStairLocation':
      return resolveGalleryStairLocation({});
    case 'galleryStairOccurrence':
      return resolveGalleryStairOccurrence({});
    case 'streamConstruction':
      return resolveStreamConstruction({});
    case 'riverConstruction':
      return resolveRiverConstruction({});
    case 'riverBoatBank':
      return resolveRiverBoatBank({});
    case 'chasmDepth':
      return resolveChasmDepth({});
    case 'chasmConstruction':
      return resolveChasmConstruction({});
    case 'jumpingPlaceWidth':
      return resolveJumpingPlaceWidth({});
    case 'numberOfExits': {
      const ctx = readExitsContext(pending.context);
      if (!ctx) return undefined;
      return resolveNumberOfExits({
        length: ctx.length,
        width: ctx.width,
        isRoom: ctx.isRoom,
      });
    }
    case 'monsterLevel': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterLevel({ dungeonLevel });
    }
    case 'monsterOne': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterOne({ dungeonLevel });
    }
    case 'monsterTwo': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterTwo({ dungeonLevel });
    }
    case 'monsterThree': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterThree({ dungeonLevel });
    }
    case 'monsterFour': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterFour({ dungeonLevel });
    }
    case 'monsterFive': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterFive({ dungeonLevel });
    }
    case 'monsterSix': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveMonsterSix({ dungeonLevel });
    }
    case 'dragonThree': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 3);
      return resolveDragonThree({ dungeonLevel });
    }
    case 'dragonFourYounger': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 4);
      return resolveDragonFourYounger({ dungeonLevel });
    }
    case 'dragonFourOlder': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 4);
      return resolveDragonFourOlder({ dungeonLevel });
    }
    case 'dragonFiveYounger': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 5);
      return resolveDragonFiveYounger({ dungeonLevel });
    }
    case 'dragonFiveOlder': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 5);
      return resolveDragonFiveOlder({ dungeonLevel });
    }
    case 'dragonSix': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 6);
      return resolveDragonSix({ dungeonLevel });
    }
    case 'human': {
      const dungeonLevel = readDungeonLevelFromPending(pending, 1);
      return resolveHuman({ dungeonLevel });
    }
    default:
      return undefined;
  }
}

function parseDoorChainSequence(table: string, fallback: number): number {
  const parts = table.split(':');
  if (parts.length >= 2) {
    const seq = Number(parts[1]);
    if (Number.isInteger(seq)) return seq;
  }
  return fallback;
}

function parseEgressWhich(table: string): 'one' | 'two' | 'three' {
  const parts = table.split(':');
  if (parts.length >= 2) {
    const key = parts[1] as 'one' | 'two' | 'three';
    if (key === 'one' || key === 'two' || key === 'three') return key;
  }
  return 'one';
}

function readDoorChainExisting(context: unknown): DoorChainLaterality[] {
  if (!isTableContext(context)) return [];
  if (context.kind !== 'doorChain') return [];
  const arr = Array.isArray(context.existing) ? context.existing : [];
  return arr.filter(
    (v): v is DoorChainLaterality => v === 'Left' || v === 'Right'
  );
}

function readExitsContext(
  context: unknown
): { length: number; width: number; isRoom: boolean } | undefined {
  if (!isTableContext(context)) return undefined;
  if (context.kind !== 'exits') return undefined;
  const length =
    typeof context.length === 'number' ? context.length : undefined;
  const width = typeof context.width === 'number' ? context.width : undefined;
  const isRoom =
    typeof context.isRoom === 'boolean' ? context.isRoom : undefined;
  if (length === undefined || width === undefined || isRoom === undefined)
    return undefined;
  return { length, width, isRoom };
}

function formatDoorLocationEvent(
  event: Extract<OutcomeEvent, { kind: 'doorLocation' }>
): string {
  if (event.result === DoorLocation.Ahead) return 'A door is Ahead. ';
  const lateral =
    event.result === DoorLocation.Left
      ? 'Left'
      : event.result === DoorLocation.Right
      ? 'Right'
      : undefined;
  if (!lateral) return '';
  const repeated = event.existingAfter.length === event.existingBefore.length;
  if (repeated) {
    return "There are no more doors. The main passage extends -- check again in 30'. ";
  }
  return `A door is to the ${lateral}. `;
}

function formatPeriodicDoorOnlyEvent(
  event: Extract<OutcomeEvent, { kind: 'periodicDoorOnly' }>
): string {
  if (event.result === PeriodicCheckDoorOnly.Ignore) {
    return "There are no other doors. The main passage extends -- check again in 30'. ";
  }
  return '';
}

function renderWanderingWhereFrom(node: OutcomeEventNode): string {
  if (node.event.kind !== 'wanderingWhereFrom') return '';
  switch (node.event.result) {
    case PeriodicCheck.Door: {
      const door = findChildEvent(node, 'doorLocation');
      return renderCompactDoorChain([], door);
    }
    case PeriodicCheck.SidePassage: {
      const side = findChildEvent(node, 'sidePassages');
      return side && side.event.kind === 'sidePassages'
        ? formatSidePassageResult(side.event.result)
        : 'A side passage occurs. ';
    }
    case PeriodicCheck.PassageTurn: {
      const turn = findChildEvent(node, 'passageTurns');
      return turn ? renderCompactPassageTurn(turn) : 'The passage turns. ';
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? renderCompactChamberDimensions(chamber) : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return stairs
        ? renderCompactStairs(stairs)
        : 'Stairs are indicated here. ';
    }
    case PeriodicCheck.ContinueStraight:
      return "Continue straight -- check again in 60'. ";
    case PeriodicCheck.DeadEnd:
      return 'The passage reaches a dead end. (TODO) ';
    case PeriodicCheck.TrickTrap:
      return "There is a trick or trap. (TODO) -- check again in 30'. ";
    default:
      return `Appears from: ${PeriodicCheck[node.event.result]}. `;
  }
}

function renderCompactDoorBeyond(node: OutcomeEventNode): string {
  if (node.event.kind !== 'doorBeyond') return '';
  switch (node.event.result) {
    case DoorBeyond.ParallelPassageOrCloset:
      if (node.event.doorAhead) {
        return "Beyond the door is a 10' x 10' room (check contents, treasure). ";
      }
      return (
        "Beyond the door is a parallel passage, extending 30' in both directions. " +
        renderChildPassageWidth(node)
      );
    case DoorBeyond.PassageStraightAhead:
      return (
        'Beyond the door is a passage straight ahead. ' +
        renderChildPassageWidth(node)
      );
    case DoorBeyond.Passage45AheadBehind:
      return (
        'Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). ' +
        renderChildPassageWidth(node)
      );
    case DoorBeyond.Passage45BehindAhead:
      return (
        'Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). ' +
        renderChildPassageWidth(node)
      );
    case DoorBeyond.Room: {
      const room = findChildEvent(node, 'roomDimensions');
      const detail = room ? renderCompactRoomDimensions(room) : '';
      return 'Beyond the door is a room. ' + detail;
    }
    case DoorBeyond.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? renderCompactChamberDimensions(chamber) : '';
      return 'Beyond the door is a chamber. ' + detail;
    }
    default:
      return '';
  }
}

function renderChildPassageWidth(node: OutcomeEventNode): string {
  const width = findChildEvent(node, 'passageWidth');
  return width ? renderCompactPassageWidth(width) : '';
}

function getChildEvents(node: OutcomeEventNode): OutcomeEventNode[] {
  const children = node.children || [];
  return children.filter((c): c is OutcomeEventNode => c.type === 'event');
}

function findChildEvent<K extends OutcomeEvent['kind']>(
  node: OutcomeEventNode,
  kind: K
): OutcomeEventNode | undefined {
  return getChildEvents(node).find((child) => child.event.kind === kind);
}

function renderCompactPassageTurn(node: OutcomeEventNode): string {
  if (node.event.kind !== 'passageTurns') return '';
  let prefix = '';
  switch (node.event.result) {
    case PassageTurns.Left90:
      prefix = "The passage turns left 90 degrees - check again in 30'. ";
      break;
    case PassageTurns.Left45:
      prefix = "The passage turns left 45 degrees ahead - check again in 30'. ";
      break;
    case PassageTurns.Left135:
      prefix =
        "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
      break;
    case PassageTurns.Right90:
      prefix = "The passage turns right 90 degrees - check again in 30'. ";
      break;
    case PassageTurns.Right45:
      prefix =
        "The passage turns right 45 degrees ahead - check again in 30'. ";
      break;
    case PassageTurns.Right135:
      prefix =
        "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
      break;
  }
  const widthNode = findChildEvent(node, 'passageWidth');
  const widthText = widthNode ? renderCompactPassageWidth(widthNode) : '';
  return prefix + widthText;
}

function renderCompactPassageWidth(node: OutcomeEventNode): string {
  if (node.event.kind !== 'passageWidth') return '';
  switch (node.event.result) {
    case PassageWidth.FiveFeet:
      return "The passage is 5' wide. ";
    case PassageWidth.TenFeet:
      return "The passage is 10' wide. ";
    case PassageWidth.TwentyFeet:
      return "The passage is 20' wide. ";
    case PassageWidth.ThirtyFeet:
      return "The passage is 30' wide. ";
    case PassageWidth.SpecialPassage: {
      const special = findChildEvent(node, 'specialPassage');
      return special
        ? renderCompactSpecialPassage(special)
        : 'A special passage occurs. ';
    }
    default:
      return '';
  }
}

function renderCompactSpecialPassage(node: OutcomeEventNode): string {
  if (node.event.kind !== 'specialPassage') return '';
  let text = '';
  switch (node.event.result) {
    case SpecialPassage.FortyFeetColumns:
      text = "The passage is 40' wide, with columns down the center. ";
      break;
    case SpecialPassage.FortyFeetDoubleColumns:
      text = "The passage is 40' wide, with a double row of columns. ";
      break;
    case SpecialPassage.FiftyFeetDoubleColumns:
      text = "The passage is 50' wide, with a double row of columns. ";
      break;
    case SpecialPassage.FiftyFeetGalleries: {
      text =
        "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. ";
      const loc = findChildEvent(node, 'galleryStairLocation');
      if (loc) {
        text += formatGalleryStairLocation(
          loc.event.result as GalleryStairLocation
        );
        const occurrence = findChildEvent(node, 'galleryStairOccurrence');
        if (occurrence) {
          text += formatGalleryStairOccurrence(
            occurrence.event.result as GalleryStairOccurrence
          );
        }
      }
      break;
    }
    case SpecialPassage.TenFootStream: {
      text = "A stream, 10' wide, bisects the passage. ";
      const construction = findChildEvent(node, 'streamConstruction');
      if (construction) {
        text += formatStreamConstruction(
          construction.event.result as StreamConstruction
        );
      }
      break;
    }
    case SpecialPassage.TwentyFootRiver:
    case SpecialPassage.FortyFootRiver:
    case SpecialPassage.SixtyFootRiver: {
      text =
        node.event.result === SpecialPassage.TwentyFootRiver
          ? "A river, 20' wide, bisects the passage. "
          : node.event.result === SpecialPassage.FortyFootRiver
          ? "A river, 40' wide, bisects the passage. "
          : "A river, 60' wide, bisects the passage. ";
      const construction = findChildEvent(node, 'riverConstruction');
      if (construction) {
        text += formatRiverConstruction(
          construction.event.result as RiverConstruction,
          node
        );
      }
      break;
    }
    case SpecialPassage.TwentyFootChasm: {
      text = "A chasm, 20' wide, bisects the passage. ";
      const depth = findChildEvent(node, 'chasmDepth');
      if (depth) text += formatChasmDepth(depth.event.result as ChasmDepth);
      const construction = findChildEvent(node, 'chasmConstruction');
      if (construction) {
        text += formatChasmConstruction(
          construction.event.result as ChasmConstruction,
          node
        );
      }
      break;
    }
    default:
      break;
  }
  return text;
}

function formatGalleryStairLocation(result: GalleryStairLocation): string {
  switch (result) {
    case GalleryStairLocation.PassageBeginning:
      return 'Stairs up to the gallery are at the beginning of the passage. ';
    case GalleryStairLocation.PassageEnd:
      return 'Stairs up to the gallery will be at the end of the passage. ';
    default:
      return '';
  }
}

function formatGalleryStairOccurrence(result: GalleryStairOccurrence): string {
  switch (result) {
    case GalleryStairOccurrence.Replace:
      return 'If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. ';
    case GalleryStairOccurrence.Supplement:
      return 'If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ';
    default:
      return '';
  }
}

function formatStreamConstruction(result: StreamConstruction): string {
  return result === StreamConstruction.Bridged
    ? 'A bridge crosses the stream. '
    : '';
}

function formatRiverConstruction(
  result: RiverConstruction,
  node: OutcomeEventNode
): string {
  if (result === RiverConstruction.Bridged)
    return 'A bridge crosses the river. ';
  if (result === RiverConstruction.Obstacle) return '';
  const boat = findChildEvent(node, 'riverBoatBank');
  if (boat) {
    return (
      'There is a boat. ' +
      (boat.event.result === RiverBoatBank.ThisSide
        ? 'The boat is on this bank of the river. '
        : 'The boat is on the opposite bank of the river. ')
    );
  }
  return '';
}

function formatChasmDepth(result: ChasmDepth): string {
  switch (result) {
    case ChasmDepth.Feet150:
      return "The chasm is 150' deep. ";
    case ChasmDepth.Feet160:
      return "The chasm is 160' deep. ";
    case ChasmDepth.Feet170:
      return "The chasm is 170' deep. ";
    case ChasmDepth.Feet180:
      return "The chasm is 180' deep. ";
    case ChasmDepth.Feet190:
      return "The chasm is 190' deep. ";
    case ChasmDepth.Feet200:
      return "The chasm is 200' deep. ";
    default:
      return '';
  }
}

function formatChasmConstruction(
  result: ChasmConstruction,
  node: OutcomeEventNode
): string {
  if (result === ChasmConstruction.Bridged)
    return 'A bridge crosses the chasm. ';
  if (result === ChasmConstruction.Obstacle)
    return 'It has no bridge, and is too wide to jump across. ';
  const jump = findChildEvent(node, 'jumpingPlaceWidth');
  if (jump) {
    return (
      'There is a jumping place. ' +
      (jump.event.result === JumpingPlaceWidth.FiveFeet
        ? "It is 5' wide. "
        : "It is 10' wide. ")
    );
  }
  return '';
}

function renderCompactStairs(node: OutcomeEventNode): string {
  if (node.event.kind !== 'stairs') return '';
  let text = '';
  switch (node.event.result) {
    case Stairs.DownOne:
      text = 'There are stairs here that descend one level. ';
      break;
    case Stairs.DownTwo:
      text = 'There are stairs here that descend two levels. ';
      break;
    case Stairs.DownThree:
      text = 'There are stairs here that descend three levels. ';
      break;
    case Stairs.UpOne:
      text = 'There are stairs here that ascend one level. ';
      break;
    case Stairs.UpDead:
      text = 'There are stairs here that ascend one level to a dead end. ';
      break;
    case Stairs.DownDead:
      text = 'There are stairs here that descend one level to a dead end. ';
      break;
    case Stairs.ChimneyUpOne:
      text =
        "There is a chimney that goes up one level. The current passage continues, check again in 30'. ";
      break;
    case Stairs.ChimneyUpTwo:
      text =
        "There is a chimney that goes up two levels. The current passage continues, check again in 30'. ";
      break;
    case Stairs.ChimneyDownTwo:
      text =
        "There is a chimney that goes down two levels. The current passage continues, check again in 30'. ";
      break;
    case Stairs.TrapDoorDownOne:
      text =
        "There is a trap door that goes down one level. The current passage continues, check again in 30'. ";
      break;
    case Stairs.TrapDownDownTwo:
      text =
        "There is a trap door that goes down two levels. The current passage continues, check again in 30'. ";
      break;
    case Stairs.UpOneDownTwo:
      text =
        'There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber. ';
      break;
  }
  const egress = findChildEvent(node, 'egress');
  if (egress && egress.event.kind === 'egress') {
    if (egress.event.result === Egress.Closed) {
      text +=
        'After descending, an unnoticed door will close egress for the day. ';
    }
  }
  const chuteEvent = findChildEvent(node, 'chute');
  if (chuteEvent && chuteEvent.event.kind === 'chute') {
    if (chuteEvent.event.result === Chute.Exists) {
      text +=
        'The stairs will turn into a chute, descending two levels from the top. ';
    }
  }
  if (node.event.result === Stairs.UpOneDownTwo) {
    const chamber = findChildEvent(node, 'chamberDimensions');
    if (chamber) text += renderCompactChamberDimensions(chamber);
  }
  return text;
}

function renderCompactRoomDimensions(node: OutcomeEventNode): string {
  if (node.event.kind !== 'roomDimensions') return '';
  let text = '';
  let dims: { length: number; width: number } | undefined;
  switch (node.event.result) {
    case RoomDimensions.Square10x10:
      text = "The room is square and 10' x 10'. ";
      dims = { length: 10, width: 10 };
      break;
    case RoomDimensions.Square20x20:
      text = "The room is square and 20' x 20'. ";
      dims = { length: 20, width: 20 };
      break;
    case RoomDimensions.Square30x30:
      text = "The room is square and 30' x 30'. ";
      dims = { length: 30, width: 30 };
      break;
    case RoomDimensions.Square40x40:
      text = "The room is square and 40' x 40'. ";
      dims = { length: 40, width: 40 };
      break;
    case RoomDimensions.Rectangular10x20:
      text = "The room is rectangular and 10' x 20'. ";
      dims = { length: 10, width: 20 };
      break;
    case RoomDimensions.Rectangular20x30:
      text = "The room is rectangular and 20' x 30'. ";
      dims = { length: 20, width: 30 };
      break;
    case RoomDimensions.Rectangular20x40:
      text = "The room is rectangular and 20' x 40'. ";
      dims = { length: 20, width: 40 };
      break;
    case RoomDimensions.Rectangular30x40:
      text = "The room is rectangular and 30' x 40'. ";
      dims = { length: 30, width: 40 };
      break;
    case RoomDimensions.Unusual:
      text = 'The room has an unusual shape and size. ';
      break;
  }
  if (dims) {
    text +=
      'There is one additional exit. (TODO location, direction/width if passage) ';
  } else {
    text += renderCompactUnusualDetails(node);
  }
  return text;
}

function renderCompactChamberDimensions(node: OutcomeEventNode): string {
  if (node.event.kind !== 'chamberDimensions') return '';
  let text = '';
  let dims: { length: number; width: number } | undefined;
  switch (node.event.result) {
    case ChamberDimensions.Square20x20:
      text = "The chamber is square and 20' x 20'. ";
      dims = { length: 20, width: 20 };
      break;
    case ChamberDimensions.Square30x30:
      text = "The chamber is square and 30' x 30'. ";
      dims = { length: 30, width: 30 };
      break;
    case ChamberDimensions.Square40x40:
      text = "The chamber is square and 40' x 40'. ";
      dims = { length: 40, width: 40 };
      break;
    case ChamberDimensions.Rectangular20x30:
      text = "The chamber is rectangular and 20' x 30'. ";
      dims = { length: 20, width: 30 };
      break;
    case ChamberDimensions.Rectangular30x50:
      text = "The chamber is rectangular and 30' x 50'. ";
      dims = { length: 30, width: 50 };
      break;
    case ChamberDimensions.Rectangular40x60:
      text = "The chamber is rectangular and 40' x 60'. ";
      dims = { length: 40, width: 60 };
      break;
    case ChamberDimensions.Unusual:
      text = 'The chamber has an unusual shape and size. ';
      break;
  }
  if (dims) {
    text +=
      'There is one additional exit. (TODO location, direction/width if passage) ';
  } else {
    text += renderCompactUnusualDetails(node);
  }
  return text;
}

function renderCompactUnusualDetails(node: OutcomeEventNode): string {
  let text = '';
  const shape = findChildEvent(node, 'unusualShape');
  if (shape && shape.event.kind === 'unusualShape') {
    text += formatUnusualShape(shape.event.result);
  }
  const size = findChildEvent(node, 'unusualSize');
  if (size && size.event.kind === 'unusualSize') {
    text += formatUnusualSize(size.event.result);
  }
  if (shape || size) {
    text += '(TODO exits, contents, treasure) ';
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

function formatUnusualSize(result: UnusualSize): string {
  switch (result) {
    case UnusualSize.SqFt500:
      return 'It is about 500 sq. ft. ';
    case UnusualSize.SqFt900:
      return 'It is about 900 sq. ft. ';
    case UnusualSize.SqFt1300:
      return 'It is about 1300 sq. ft. ';
    case UnusualSize.SqFt2000:
      return 'It is about 2000 sq. ft. ';
    case UnusualSize.SqFt2700:
      return 'It is about 2700 sq. ft. ';
    case UnusualSize.SqFt3400:
    case UnusualSize.RollAgain:
      return 'It is about 3400 sq. ft. ';
    default:
      return '';
  }
}

function renderCompactPeriodicOutcome(node: OutcomeEventNode): string {
  if (node.event.kind !== 'periodicCheck') return '';
  const event = node.event;
  switch (event.result) {
    case PeriodicCheck.Door:
      return renderCompactDoorChain();
    case PeriodicCheck.SidePassage: {
      const side = findChildEvent(node, 'sidePassages');
      return side && side.event.kind === 'sidePassages'
        ? formatSidePassageResult(side.event.result)
        : compactPeriodicText(
            event.level,
            event.result,
            event.avoidMonster ?? false
          );
    }
    case PeriodicCheck.PassageTurn: {
      const turn = findChildEvent(node, 'passageTurns');
      return turn
        ? renderCompactPassageTurn(turn)
        : compactPeriodicText(
            event.level,
            event.result,
            event.avoidMonster ?? false
          );
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? renderCompactChamberDimensions(chamber) : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return stairs
        ? renderCompactStairs(stairs)
        : 'Stairs are indicated here. ';
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
      return compactPeriodicText(
        event.level,
        event.result,
        event.avoidMonster ?? false
      );
  }
}

function formatSidePassageResult(result: SidePassages): string {
  switch (result) {
    case SidePassages.Left90:
      return "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
    case SidePassages.Right90:
      return "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
    case SidePassages.Left45:
      return "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
    case SidePassages.Right45:
      return "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
    case SidePassages.Left135:
      return "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
    case SidePassages.Right135:
      return "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
    case SidePassages.LeftCurve45:
      return "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
    case SidePassages.RightCurve45:
      return "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
    case SidePassages.PassageT:
      return "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
    case SidePassages.PassageY:
      return "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
    case SidePassages.FourWay:
      return "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
    case SidePassages.PassageX:
      return "The passage reaches an 'X' intersection. (If the present passage is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. ";
    default:
      return "A side passage branches. Passages extend -- check again in 30'. ";
  }
}

function compactSpecialPassageSuffix(kind: SpecialPassage): string {
  switch (kind) {
    case SpecialPassage.FiftyFeetGalleries: {
      const r = rollDice(galleryStairLocation.sides);
      const c = getTableEntry(r, galleryStairLocation);
      if (c === GalleryStairLocation.PassageEnd) {
        const r2 = rollDice(galleryStairOccurrence.sides);
        const c2 = getTableEntry(r2, galleryStairOccurrence);
        const tail =
          c2 === GalleryStairOccurrence.Replace
            ? 'If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. '
            : 'If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ';
        return (
          'Stairs up to the gallery will be at the end of the passage. ' + tail
        );
      }
      return 'Stairs up to the gallery are at the beginning of the passage. ';
    }
    case SpecialPassage.TenFootStream: {
      const r = rollDice(streamConstruction.sides);
      const c = getTableEntry(r, streamConstruction);
      return c === StreamConstruction.Bridged
        ? 'A bridge crosses the stream. '
        : '';
    }
    case SpecialPassage.TwentyFootRiver:
    case SpecialPassage.FortyFootRiver:
    case SpecialPassage.SixtyFootRiver: {
      const r = rollDice(riverConstruction.sides);
      const c = getTableEntry(r, riverConstruction);
      if (c === RiverConstruction.Bridged)
        return 'A bridge crosses the river. ';
      if (c === RiverConstruction.Obstacle) return '';
      const r2 = rollDice(riverBoatBank.sides);
      const c2 = getTableEntry(r2, riverBoatBank);
      const tail =
        c2 === RiverBoatBank.ThisSide
          ? 'The boat is on this bank of the river. '
          : 'The boat is on the opposite bank of the river. ';
      return 'There is a boat. ' + tail;
    }
    case SpecialPassage.TwentyFootChasm: {
      const r = rollDice(chasmDepth.sides);
      const c = getTableEntry(r, chasmDepth);
      const depth =
        c === ChasmDepth.Feet150
          ? "The chasm is 150' deep. "
          : c === ChasmDepth.Feet160
          ? "The chasm is 160' deep. "
          : c === ChasmDepth.Feet170
          ? "The chasm is 170' deep. "
          : c === ChasmDepth.Feet180
          ? "The chasm is 180' deep. "
          : c === ChasmDepth.Feet190
          ? "The chasm is 190' deep. "
          : "The chasm is 200' deep. ";
      const r2 = rollDice(chasmConstruction.sides);
      const c2 = getTableEntry(r2, chasmConstruction);
      if (c2 === ChasmConstruction.Bridged)
        return depth + 'A bridge crosses the chasm. ';
      if (c2 === ChasmConstruction.Obstacle)
        return depth + 'It has no bridge, and is too wide to jump across. ';
      const r3 = rollDice(jumpingPlaceWidth.sides);
      const c3 = getTableEntry(r3, jumpingPlaceWidth);
      const width =
        c3 === JumpingPlaceWidth.FiveFeet
          ? "It is 5' wide. "
          : "It is 10' wide. ";
      return depth + 'There is a jumping place. ' + width;
    }
    default:
      return '';
  }
}

function compactRandomSpecialPassage(): string {
  const r = rollDice(specialPassage.sides);
  const cmd = getTableEntry(r, specialPassage);
  switch (cmd) {
    case SpecialPassage.FortyFeetColumns:
      return "The passage is 40' wide, with columns down the center. ";
    case SpecialPassage.FortyFeetDoubleColumns:
      return "The passage is 40' wide, with a double row of columns. ";
    case SpecialPassage.FiftyFeetDoubleColumns:
      return "The passage is 50' wide, with a double row of columns. ";
    case SpecialPassage.FiftyFeetGalleries:
      return (
        "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. " +
        compactSpecialPassageSuffix(SpecialPassage.FiftyFeetGalleries)
      );
    case SpecialPassage.TenFootStream:
      return (
        "A stream, 10' wide, bisects the passage. " +
        compactSpecialPassageSuffix(SpecialPassage.TenFootStream)
      );
    case SpecialPassage.TwentyFootRiver:
      return (
        "A river, 20' wide, bisects the passage. " +
        compactSpecialPassageSuffix(SpecialPassage.TwentyFootRiver)
      );
    case SpecialPassage.FortyFootRiver:
      return (
        "A river, 40' wide, bisects the passage. " +
        compactSpecialPassageSuffix(SpecialPassage.FortyFootRiver)
      );
    case SpecialPassage.SixtyFootRiver:
      return (
        "A river, 60' wide, bisects the passage. " +
        compactSpecialPassageSuffix(SpecialPassage.SixtyFootRiver)
      );
    case SpecialPassage.TwentyFootChasm:
      return (
        "A chasm, 20' wide, bisects the passage. " +
        compactSpecialPassageSuffix(SpecialPassage.TwentyFootChasm)
      );
  }
}

function compactPeriodicText(
  _level: number,
  result: PeriodicCheck,
  _avoidMonster: boolean
): string {
  switch (result) {
    case PeriodicCheck.ContinueStraight:
      return "Continue straight -- check again in 60'. ";
    case PeriodicCheck.Door:
      return renderCompactDoorChain();
    case PeriodicCheck.SidePassage: {
      const sideNode = resolveSidePassages({});
      if (sideNode.type === 'event' && sideNode.event.kind === 'sidePassages') {
        return formatSidePassageResult(sideNode.event.result);
      }
      return "A side passage branches. Passages extend -- check again in 30'. ";
    }
    case PeriodicCheck.PassageTurn: {
      const turnNode = resolveNodeForCompact(resolvePassageTurns({}));
      return turnNode
        ? renderCompactPassageTurn(turnNode)
        : 'The passage turns. ';
    }
    case PeriodicCheck.Chamber: {
      const chamberNode = resolveNodeForCompact(resolveChamberDimensions({}));
      const detail = chamberNode
        ? renderCompactChamberDimensions(chamberNode)
        : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairsNode = resolveNodeForCompact(resolveStairs({}));
      return stairsNode
        ? renderCompactStairs(stairsNode)
        : 'Stairs are indicated here. ';
    }
    case PeriodicCheck.DeadEnd:
      return 'The passage reaches a dead end. (TODO) ';
    case PeriodicCheck.TrickTrap:
      return "There is a trick or trap. (TODO) -- check again in 30'. ";
    case PeriodicCheck.WanderingMonster:
      return '';
  }
}

// Compose compact text for Wandering Monster without legacy helpers.
function compactWanderingMonsterText(
  level: number,
  whereNode?: OutcomeEventNode,
  levelNode?: OutcomeEventNode
): string {
  let prefix = '';
  if (whereNode && whereNode.event.kind === 'wanderingWhereFrom') {
    prefix = renderWanderingWhereFrom(whereNode);
  } else {
    const resolvedWhere = resolveNodeForCompact(resolveWanderingWhereFrom({}));
    if (resolvedWhere && resolvedWhere.event.kind === 'wanderingWhereFrom') {
      prefix = renderWanderingWhereFrom(resolvedWhere);
    }
  }

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
  dungeonLevel: number,
  levelNode?: OutcomeEventNode
): string {
  const resolvedLevelNode =
    levelNode?.event.kind === 'monsterLevel'
      ? levelNode
      : resolveNodeForCompact(resolveMonsterLevel({ dungeonLevel }));
  if (!resolvedLevelNode || resolvedLevelNode.event.kind !== 'monsterLevel') {
    return fallbackMonsterLevelText(MonsterLevel.One);
  }
  return readMonsterEncounterFromLevelNode(resolvedLevelNode);
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
