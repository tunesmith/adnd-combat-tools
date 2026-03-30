import { resolveTreasure } from '../../../../dungeon/features/treasure/treasure/treasureResolvers';
import * as dungeonLookup from '../../../../dungeon/helpers/dungeonLookup';
import { TreasureWithoutMonster } from '../../../../dungeon/features/treasure/treasure/treasureTable';

describe('treasure gem generation', () => {
  it('creates gem lots with value adjustments', () => {
    const rollSequence: Array<{
      sides: number;
      rolls?: number;
      result: number;
    }> = [
      { sides: 4, rolls: 4, result: 16 }, // quantity
      { sides: 100, result: 20 }, // lot 1 base
      { sides: 100, result: 60 }, // lot 1 diff (no change)
      { sides: 12, result: 1 }, // lot 1 ornamental kind
      { sides: 10, result: 4 }, // lot 1 variation (unchanged)
      { sides: 100, result: 95 }, // lot 2 base
      { sides: 100, result: 5 }, // lot 2 diff (-2)
      { sides: 8, result: 2 }, // lot 2 gem kind (emerald)
      { sides: 10, result: 2 }, // lot 2 variation (double)
      { sides: 100, result: 100 }, // lot 3 base
      { sides: 100, result: 100 }, // lot 3 diff (+3)
      { sides: 7, result: 6 }, // lot 3 gem kind (star ruby)
      { sides: 10, result: 9 }, // lot 3 variation (percent decrease)
      { sides: 4, result: 3 }, // lot 3 percent (30% decrease)
    ];

    const rollSpy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementation((sides: number, rolls: number = 1) => {
        const next = rollSequence.shift();
        if (!next) {
          throw new Error('No mock roll remaining');
        }
        expect(sides).toBe(next.sides);
        if (next.rolls !== undefined) {
          expect(rolls).toBe(next.rolls);
        }
        return next.result;
      });

    try {
      const node = resolveTreasure({
        roll: 91,
        level: 4,
      });

      if (node.type !== 'event' || node.event.kind !== 'treasure') {
        throw new Error('Expected treasure event');
      }

      const entry = node.event.entries[0];
      if (!entry) {
        throw new Error('Expected treasure entry');
      }
      expect(entry.command).toBe(TreasureWithoutMonster.GemsPerLevel);
      expect(entry.quantity).toBe(16);
      expect(entry.gems).toBeDefined();
      expect(entry.gems).toHaveLength(3);
      expect(entry.gems?.map((lot) => lot.count)).toEqual([10, 5, 1]);

      const [lotOne, lotTwo, lotThree] = entry.gems ?? [];
      if (!lotOne || !lotTwo || !lotThree) {
        throw new Error('Expected three gem lots');
      }
      expect(lotOne.baseValue).toBe(10);
      expect(lotOne.value).toBe(10);
      expect(lotOne.adjustment.type).toBe('unchanged');
      expect(lotOne.kind?.name).toBe('Azurite');
      expect(lotOne.kind?.property).toBe('opaque');

      expect(lotTwo.baseValue).toBe(100);
      expect(lotTwo.value).toBe(200);
      expect(lotTwo.adjustment.type).toBe('double');
      expect(lotTwo.kind?.name).toBe('Emerald');
      expect(lotTwo.kind?.property).toBe('transparent');

      expect(lotThree.baseValue).toBe(50000);
      expect(lotThree.value).toBe(35000);
      expect(lotThree.kind?.name).toBe('Star Ruby');
      expect(lotThree.kind?.property).toBe('translucent');
      expect(lotThree.adjustment).toEqual({
        type: 'decreasePercent',
        percent: 30,
      });

      expect(rollSequence).toHaveLength(0);
    } finally {
      rollSpy.mockRestore();
    }
  });
});
