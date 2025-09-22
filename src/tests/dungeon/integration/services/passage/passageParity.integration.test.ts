import { passageMessages } from '../../../../../dungeon/services/passage';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../../../../tables/dungeon/periodicCheck';
import type { DungeonMessage, DungeonTablePreview } from '../../../../../types/dungeon';

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
