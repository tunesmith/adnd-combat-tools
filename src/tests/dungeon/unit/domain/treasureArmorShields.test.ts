import { resolveTreasureArmorShields } from '../../../../dungeon/domain/resolvers';
import { TreasureArmorShield } from '../../../../tables/dungeon/treasureArmorShields';

describe('resolveTreasureArmorShields', () => {
  it('returns the expected armor result for a given roll', () => {
    const node = resolveTreasureArmorShields({ roll: 1 });
    if (node.type !== 'event' || node.event.kind !== 'treasureArmorShields') {
      throw new Error('Expected treasureArmorShields event');
    }
    expect(node.event.result).toBe(TreasureArmorShield.ChainMailPlus1);
  });

  it('handles upper range results', () => {
    const node = resolveTreasureArmorShields({ roll: 99 });
    if (node.type !== 'event' || node.event.kind !== 'treasureArmorShields') {
      throw new Error('Expected treasureArmorShields event');
    }
    expect(node.event.result).toBe(
      TreasureArmorShield.ShieldMinus1MissileAttractor
    );
  });
});
