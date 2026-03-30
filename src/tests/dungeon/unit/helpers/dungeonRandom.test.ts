import { rollDice } from '../../../../dungeon/helpers/dungeonLookup';
import {
  createDungeonRandomId,
  createDungeonRandomSession,
  withDungeonRandomSession,
} from '../../../../dungeon/helpers/dungeonRandom';

describe('dungeonRandom', () => {
  test('replays the same automatic rolls and ids for the same seed', () => {
    const runSequence = (seed: string) =>
      withDungeonRandomSession(createDungeonRandomSession(seed), () => ({
        firstRoll: rollDice(20),
        secondRoll: rollDice(12),
        firstId: createDungeonRandomId('auto'),
        secondId: createDungeonRandomId('purpose'),
      }));

    expect(runSequence('deadbeef')).toEqual(runSequence('deadbeef'));
  });

  test('changes the generated sequence when the seed changes', () => {
    const first = withDungeonRandomSession(
      createDungeonRandomSession('deadbeef'),
      () => createDungeonRandomId('auto')
    );
    const second = withDungeonRandomSession(
      createDungeonRandomSession('feedcafe'),
      () => createDungeonRandomId('auto')
    );

    expect(first).not.toBe(second);
  });
});
