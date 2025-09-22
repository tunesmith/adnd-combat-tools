import { doorBeyondMessages } from '../../../../../dungeon/services/doorBeyondResult';
import { doorBeyond, DoorBeyond } from '../../../../../tables/dungeon/doorBeyond';
import type { DungeonMessage } from '../../../../../types/dungeon';

function isParagraph(
  m: DungeonMessage
): m is Extract<DungeonMessage, { kind: 'paragraph'; text: string }> {
  return (m as any).kind === 'paragraph' && typeof (m as any).text === 'string';
}

function pickRollForDoorBeyond(cmd: DoorBeyond): number {
  const entry = doorBeyond.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

describe('Door compact prefixes', () => {
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
