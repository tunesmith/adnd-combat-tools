import { resolveTreasureMiscWeapons } from '../../../../dungeon/domain/resolvers';
import { TreasureMiscWeapon } from '../../../../tables/dungeon/treasureMiscWeapons';

describe('resolveTreasureMiscWeapons', () => {
  it('rolls quantity for arrows', () => {
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0); // first d12 -> 1
    randomSpy.mockReturnValueOnce(0); // second d12 -> 1 (total 2)
    const node = resolveTreasureMiscWeapons({ roll: 1 });
    randomSpy.mockRestore();
    if (node.type !== 'event' || node.event.kind !== 'treasureMiscWeapons') {
      throw new Error('Expected treasureMiscWeapons event');
    }
    expect(node.event.result.item).toBe(TreasureMiscWeapon.ArrowPlus1);
    expect(node.event.result.quantity).toBe(2);
  });

  it('returns items without quantity when not required', () => {
    const node = resolveTreasureMiscWeapons({ roll: 15 });
    if (node.type !== 'event' || node.event.kind !== 'treasureMiscWeapons') {
      throw new Error('Expected treasureMiscWeapons event');
    }
    expect(node.event.result.item).toBe(TreasureMiscWeapon.ArrowOfSlaying);
    expect(node.event.result.quantity).toBeUndefined();
  });
});
