import { passageMessages } from '../../dungeon/services/passage';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../tables/dungeon/periodicCheck';
import type { DungeonMessage } from '../../types/dungeon';
import * as dungeonLookup from '../../dungeon/helpers/dungeonLookup';

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

describe('Compact: PeriodicCheck Passage Turn (adapter)', () => {
  test('resolves passage turn and width without legacy helpers', () => {
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    // Roll for passage turn -> Left90, then passage width -> TenFeet
    spy.mockReturnValueOnce(1).mockReturnValueOnce(2);
    const { messages } = passageMessages({
      roll: pickRollFor(PeriodicCheck.PassageTurn),
      detailMode: false,
      level: 1,
    });
    const paragraph = (messages as DungeonMessage[]).find(isParagraph);
    expect(paragraph?.text).toBe(
      "The passage turns left 90 degrees - check again in 30'. The passage is 10' wide. "
    );
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
