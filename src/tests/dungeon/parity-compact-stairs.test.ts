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

describe('Compact: PeriodicCheck Stairs (adapter)', () => {
  test('includes egress detail from outcome resolver', () => {
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    // Sequence: stairs table -> DownOne, then egress table -> Closed
    spy.mockReturnValueOnce(1).mockReturnValueOnce(1);
    const { messages } = passageMessages({
      roll: pickRollFor(PeriodicCheck.Stairs),
      detailMode: false,
      level: 1,
    });
    const paragraph = (messages as DungeonMessage[]).find(isParagraph);
    expect(paragraph?.text).toBe(
      'There are stairs here that descend one level. After descending, an unnoticed door will close egress for the day. '
    );
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
