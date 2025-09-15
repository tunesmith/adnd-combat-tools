import { passageMessages } from '../../dungeon/services/passage';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../tables/dungeon/periodicCheck';
import type { DungeonMessage, DungeonTablePreview } from '../../types/dungeon';
import { doorBeyondMessages } from '../../dungeon/services/doorBeyondResult';
import { doorBeyond, DoorBeyond } from '../../tables/dungeon/doorBeyond';
import { stairsMessages } from '../../dungeon/services/stairsResult';
import { Stairs, stairs } from '../../tables/dungeon/stairs';
import { roomMessages } from '../../dungeon/services/roomResult';
import { chamberMessages } from '../../dungeon/services/chamberResult';
import {
  RoomDimensions,
  roomDimensions,
  ChamberDimensions,
  chamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import { passageWidthMessages } from '../../dungeon/services/passageWidth';
import {
  SpecialPassage,
  specialPassage,
} from '../../tables/dungeon/specialPassage';
import { specialPassageMessages } from '../../dungeon/services/specialPassage';

function isParagraph(
  m: DungeonMessage
): m is Extract<DungeonMessage, { kind: 'paragraph'; text: string }> {
  return (m as any).kind === 'paragraph' && typeof (m as any).text === 'string';
}

function pickRollForPeriodicCheck(cmd: PeriodicCheck): number {
  const entry = periodicCheck.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function pickRollForDoorBeyond(cmd: DoorBeyond): number {
  const entry = doorBeyond.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function pickRollForStairs(cmd: Stairs): number {
  const entry = stairs.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function pickRollForRoom(cmd: RoomDimensions): number {
  const entry = roomDimensions.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function pickRollForChamber(cmd: ChamberDimensions): number {
  const entry = chamberDimensions.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function pickRollForSpecialPassage(cmd: SpecialPassage): number {
  const entry = specialPassage.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

describe('Passage compact text (adapter)', () => {
  test('ContinueStraight exact text', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.ContinueStraight);
    const { messages } = passageMessages({ roll, detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para && para.text).toBe("Continue straight -- check again in 60'. ");
  });

  test('DeadEnd exact text', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.DeadEnd);
    const { messages } = passageMessages({ roll, detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para && para.text).toBe('The passage reaches a dead end. (TODO) ');
  });

  test('TrickTrap exact text', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.TrickTrap);
    const { messages } = passageMessages({ roll, detailMode: false, level: 1 });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para && para.text).toBe(
      "There is a trick or trap. (TODO) -- check again in 30'. "
    );
  });
});

describe('Phase 0 parity: Passage detail previews', () => {
  test('No roll => Periodic Check preview only', () => {
    const { messages } = passageMessages({ detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.length).toBeGreaterThanOrEqual(1);
    const first = previews[0];
    if (!first) throw new Error('Expected a preview');
    expect(first.id).toBe('periodicCheck');
  });

  test('Chamber roll => includes Chamber Dimensions preview', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.Chamber);
    const { messages } = passageMessages({ roll, detailMode: true, level: 1 });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const hasChamber = previews.some((p) => p.id === 'chamberDimensions');
    expect(hasChamber).toBe(true);
  });

  test('Door roll => includes Door Location preview', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.Door);
    const { messages } = passageMessages({ roll, detailMode: true, level: 1 });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const hasDoorLoc = previews.some((p) => p.id.startsWith('doorLocation'));
    expect(hasDoorLoc).toBe(true);
  });

  test('Side Passage roll => includes Side Passages preview', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.SidePassage);
    const { messages } = passageMessages({ roll, detailMode: true, level: 1 });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const hasSide = previews.some((p) => p.id === 'sidePassages');
    expect(hasSide).toBe(true);
  });

  test('Passage Turn roll => includes Passage Turns preview', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.PassageTurn);
    const { messages } = passageMessages({ roll, detailMode: true, level: 1 });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const hasTurns = previews.some((p) => p.id === 'passageTurns');
    expect(hasTurns).toBe(true);
  });

  test('Stairs roll => includes Stairs preview', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.Stairs);
    const { messages } = passageMessages({ roll, detailMode: true, level: 1 });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const hasStairs = previews.some((p) => p.id === 'stairs');
    expect(hasStairs).toBe(true);
  });

  test('Trick/Trap roll => includes Trick/Trap preview', () => {
    const roll = pickRollForPeriodicCheck(PeriodicCheck.TrickTrap);
    const { messages } = passageMessages({ roll, detailMode: true, level: 1 });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const hasTrick = previews.some((p) => p.id === 'trickTrap');
    expect(hasTrick).toBe(true);
  });
});

describe('Phase 0 parity: Door detail previews', () => {
  test('No roll => Door Beyond preview only', () => {
    const { messages } = doorBeyondMessages({ detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.length).toBeGreaterThanOrEqual(1);
    const first = previews[0];
    if (!first) throw new Error('Expected a preview');
    expect(first.id).toBe('doorBeyond');
  });

  test('Room roll => includes Room Dimensions preview', () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.Room);
    const { messages } = doorBeyondMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const hasRoom = previews.some((p) => p.id === 'roomDimensions');
    expect(hasRoom).toBe(true);
  });
});

describe('Phase 0 parity: Door compact prefixes', () => {
  test('Parallel/Closet (doorAhead=false) starts with expected text', () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.ParallelPassageOrCloset);
    const { messages } = doorBeyondMessages({
      roll,
      detailMode: false,
      doorAhead: false,
    });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para).toBeTruthy();
    if (!para) throw new Error('Expected paragraph');
    expect(para.text.startsWith('Beyond the door is a parallel passage')).toBe(
      true
    );
  });

  test('Parallel/Closet (doorAhead=true) starts with expected text', () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.ParallelPassageOrCloset);
    const { messages } = doorBeyondMessages({
      roll,
      detailMode: false,
      doorAhead: true,
    });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para).toBeTruthy();
    if (!para) throw new Error('Expected paragraph');
    expect(para.text.startsWith("Beyond the door is a 10' x 10' room")).toBe(
      true
    );
  });

  test('Straight Ahead starts with expected text', () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.PassageStraightAhead);
    const { messages } = doorBeyondMessages({ roll, detailMode: false });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para).toBeTruthy();
    if (!para) throw new Error('Expected paragraph');
    expect(
      para.text.startsWith('Beyond the door is a passage straight ahead.')
    ).toBe(true);
  });
});

describe('Phase 0 parity: Stairs detail previews', () => {
  test('DownOne -> Egress (1 level) preview', () => {
    const roll = pickRollForStairs(Stairs.DownOne);
    const { messages } = stairsMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:one')).toBe(true);
  });
  test('DownTwo -> Egress (2 levels) preview', () => {
    const roll = pickRollForStairs(Stairs.DownTwo);
    const { messages } = stairsMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:two')).toBe(true);
  });
  test('DownThree -> Egress (3 levels) preview', () => {
    const roll = pickRollForStairs(Stairs.DownThree);
    const { messages } = stairsMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:three')).toBe(true);
  });
  test('UpDead -> Chute preview', () => {
    const roll = pickRollForStairs(Stairs.UpDead);
    const { messages } = stairsMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chute')).toBe(true);
  });
  test('DownDead -> Chute preview', () => {
    const roll = pickRollForStairs(Stairs.DownDead);
    const { messages } = stairsMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chute')).toBe(true);
  });
  test('UpOneDownTwo -> Chamber Dimensions preview', () => {
    const roll = pickRollForStairs(Stairs.UpOneDownTwo);
    const { messages } = stairsMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chamberDimensions')).toBe(true);
  });
});

describe('Phase 0 parity: Room/Chamber detail previews', () => {
  test('Room rectangular 20x30 -> Exits preview (room)', () => {
    const roll = pickRollForRoom(RoomDimensions.Rectangular20x30);
    const { messages } = roomMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'numberOfExits')).toBe(true);
  });
  test('Chamber rectangular 30x50 -> Exits preview (chamber)', () => {
    const roll = pickRollForChamber(ChamberDimensions.Rectangular30x50);
    const { messages } = chamberMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'numberOfExits')).toBe(true);
  });
  test('Chamber Unusual -> Unusual shape/size previews', () => {
    const roll = pickRollForChamber(ChamberDimensions.Unusual);
    const { messages } = chamberMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const ids = previews.map((p) => p.id);
    expect(ids.includes('unusualShape')).toBe(true);
    expect(
      ids.some((id) => id === 'unusualSize' || id.startsWith('unusualSize'))
    ).toBe(true);
  });
});

describe('Phase 0 parity: Special Passage detail previews', () => {
  test('FiftyFeetGalleries -> Gallery Stair Location preview', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.FiftyFeetGalleries);
    const { messages } = specialPassageMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'galleryStairLocation')).toBe(true);
  });
  test('TenFootStream -> Stream Construction preview', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TenFootStream);
    const { messages } = specialPassageMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'streamConstruction')).toBe(true);
  });
  test('Twenty/Forty/Sixty Foot River -> River Construction preview', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TwentyFootRiver);
    const { messages } = specialPassageMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'riverConstruction')).toBe(true);
  });
  test('TwentyFootChasm -> Depth and Construction previews', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TwentyFootChasm);
    const { messages } = specialPassageMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const ids = previews.map((p) => p.id);
    expect(ids.includes('chasmDepth')).toBe(true);
    expect(ids.includes('chasmConstruction')).toBe(true);
  });
});

describe('Phase 0 parity: Passage Width behavior', () => {
  test('Passage Width detail mode returns paragraph node', () => {
    const { messages } = passageWidthMessages({ roll: 1, detailMode: true });
    const paras = (messages as DungeonMessage[]).filter(
      (m) => (m as any).kind === 'paragraph'
    ) as Extract<DungeonMessage, { kind: 'paragraph' }>[];
    expect(paras.length).toBe(1);
    const first = paras[0];
    if (!first) throw new Error('Expected one paragraph');
    expect(typeof first.text).toBe('string');
  });
});
