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

describe('Compact: PeriodicCheck Side Passage (adapter)', () => {
  test('resolves side passage text via outcome resolver', () => {
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    spy.mockReturnValue(1); // first child roll: side passage Left90
    const { messages } = passageMessages({
      roll: pickRollFor(PeriodicCheck.SidePassage),
      detailMode: false,
      level: 1,
    });
    const paragraph = (messages as DungeonMessage[]).find(isParagraph);
    expect(paragraph?.text).toBe(
      "A side passage branches left 90 degrees. Passages extend -- check again in 30'. "
    );
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
