import { passageMessages } from '../../dungeon/services/passage';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../tables/dungeon/periodicCheck';
import type { DungeonMessage, DungeonTablePreview } from '../../types/dungeon';
import { doorBeyondMessages } from '../../dungeon/services/doorBeyondResult';
import { doorBeyond, DoorBeyond } from '../../tables/dungeon/doorBeyond';
import { Stairs, stairs } from '../../tables/dungeon/stairs';
import {
  RoomDimensions,
  roomDimensions,
  ChamberDimensions,
  chamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import {
  SpecialPassage,
  specialPassage,
} from '../../tables/dungeon/specialPassage';
import {
  resolveStairs,
  resolveRoomDimensions,
  resolveChamberDimensions,
  resolveSpecialPassage,
  resolvePassageWidth,
} from '../../dungeon/domain/resolvers';
import { normalizeOutcomeTree } from '../../dungeon/helpers/outcomeTree';
import { renderDetailTree } from '../../dungeon/adapters/render';
import type { DungeonRenderNode } from '../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../dungeon/domain/outcome';

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

function assertEvent(node: DungeonOutcomeNode): OutcomeEventNode {
  if (node.type !== 'event') {
    throw new Error('Expected event outcome');
  }
  return node;
}

function detailNodesFor(node: DungeonOutcomeNode): DungeonRenderNode[] {
  const normalized = normalizeOutcomeTree(node);
  return renderDetailTree(assertEvent(normalized));
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
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:one')).toBe(true);
  });
  test('DownTwo -> Egress (2 levels) preview', () => {
    const roll = pickRollForStairs(Stairs.DownTwo);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:two')).toBe(true);
  });
  test('DownThree -> Egress (3 levels) preview', () => {
    const roll = pickRollForStairs(Stairs.DownThree);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:three')).toBe(true);
  });
  test('UpDead -> Chute preview', () => {
    const roll = pickRollForStairs(Stairs.UpDead);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chute')).toBe(true);
  });
  test('DownDead -> Chute preview', () => {
    const roll = pickRollForStairs(Stairs.DownDead);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chute')).toBe(true);
  });
  test('UpOneDownTwo -> Chamber Dimensions preview', () => {
    const roll = pickRollForStairs(Stairs.UpOneDownTwo);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chamberDimensions')).toBe(true);
  });
});

describe('Phase 0 parity: Room/Chamber detail previews', () => {
  test('Room rectangular 20x30 -> Exits preview (room)', () => {
    const roll = pickRollForRoom(RoomDimensions.Rectangular20x30);
    const detailNodes = detailNodesFor(resolveRoomDimensions({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'numberOfExits')).toBe(true);
  });
  test('Chamber rectangular 30x50 -> Exits preview (chamber)', () => {
    const roll = pickRollForChamber(ChamberDimensions.Rectangular30x50);
    const detailNodes = detailNodesFor(resolveChamberDimensions({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'numberOfExits')).toBe(true);
  });
  test('Chamber Unusual -> Unusual shape/size previews', () => {
    const roll = pickRollForChamber(ChamberDimensions.Unusual);
    const detailNodes = detailNodesFor(resolveChamberDimensions({ roll }));
    const previews = detailNodes.filter(
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
    const detailNodes = detailNodesFor(resolveSpecialPassage({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'galleryStairLocation')).toBe(true);
  });
  test('TenFootStream -> Stream Construction preview', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TenFootStream);
    const detailNodes = detailNodesFor(resolveSpecialPassage({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'streamConstruction')).toBe(true);
  });
  test('Twenty/Forty/Sixty Foot River -> River Construction preview', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TwentyFootRiver);
    const detailNodes = detailNodesFor(resolveSpecialPassage({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'riverConstruction')).toBe(true);
  });
  test('TwentyFootChasm -> Depth and Construction previews', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TwentyFootChasm);
    const detailNodes = detailNodesFor(resolveSpecialPassage({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const ids = previews.map((p) => p.id);
    expect(ids.includes('chasmDepth')).toBe(true);
    expect(ids.includes('chasmConstruction')).toBe(true);
  });
});

describe('Phase 0 parity: Passage Width behavior', () => {
  test('Passage Width detail mode returns paragraph node', () => {
    const detailNodes = detailNodesFor(resolvePassageWidth({ roll: 1 }));
    const paras = detailNodes.filter(
      (
        m
      ): m is Extract<DungeonRenderNode, { kind: 'paragraph'; text: string }> =>
        m.kind === 'paragraph'
    );
    expect(paras.length).toBe(1);
    const first = paras[0];
    if (!first) throw new Error('Expected one paragraph');
    expect(typeof first.text).toBe('string');
  });
});
