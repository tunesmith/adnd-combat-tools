import { passageMessages } from '../../../../../dungeon/services/passage';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../../../../tables/dungeon/periodicCheck';
import type { DungeonMessage } from '../../../../../types/dungeon';
import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';

function isParagraph(
  m: DungeonMessage
): m is Extract<DungeonMessage, { kind: 'paragraph'; text: string }> {
  return (m as any).kind === 'paragraph' && typeof (m as any).text === 'string';
}

function pickRollFor(cmd: PeriodicCheck): number {
  const entry = periodicCheck.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function mockRollSequence(values: number[]): jest.SpyInstance {
  const copy = [...values];
  const fallback = values.length > 0 ? values[values.length - 1] ?? 1 : 1;
  const spy = jest.spyOn(dungeonLookup, 'rollDice');
  spy.mockImplementation((): number => {
    if (copy.length === 0) return fallback;
    const next = copy.shift();
    return next ?? fallback;
  });
  return spy;
}

describe('Compact: PeriodicCheck Door (adapter)', () => {
  test('Ahead (dead end) exact text under controlled RNG', () => {
    const spy = mockRollSequence([20]);
    const { messages } = passageMessages({
      roll: pickRollFor(PeriodicCheck.Door),
      detailMode: false,
      level: 1,
    });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para).toBeTruthy();
    if (!para) throw new Error('Expected paragraph');
    expect(para.text).toBe('A door is Ahead. ');
    spy.mockRestore();
  });

  test('Left then Ignore (no further door) exact text under controlled RNG', () => {
    const spy = mockRollSequence([1, 1]);
    const { messages } = passageMessages({
      roll: pickRollFor(PeriodicCheck.Door),
      detailMode: false,
      level: 1,
    });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para).toBeTruthy();
    if (!para) throw new Error('Expected paragraph');
    expect(para.text).toBe(
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'. "
    );
    spy.mockRestore();
  });

  test("Right then repeat Right yields single 'Right' prefix", () => {
    const spy = mockRollSequence([7, 3, 7]);
    const { messages } = passageMessages({
      roll: pickRollFor(PeriodicCheck.Door),
      detailMode: false,
      level: 1,
    });
    const para = (messages as DungeonMessage[]).find(isParagraph);
    expect(para).toBeTruthy();
    if (!para) throw new Error('Expected paragraph');
    const text = para.text.trim();
    const occurrences = (text.match(/A door is to the Right\./g) || []).length;
    expect(occurrences).toBe(1);
    expect(
      text.includes(
        "There are no other doors. The main passage extends -- check again in 30'."
      )
    ).toBe(true);
    spy.mockRestore();
  });
});
