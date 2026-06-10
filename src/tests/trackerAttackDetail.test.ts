import { buildTrackerAttackDetail } from '../helpers/trackerAttackDetail';
import { FIGHTER } from '../tables/attackerClass';
import type { TrackerCombatant } from '../types/tracker';

const createCombatant = (
  overrides: Partial<TrackerCombatant>
): TrackerCombatant => ({
  key: 1,
  name: 'Combatant',
  class: FIGHTER,
  level: 1,
  armorType: 2,
  armorClass: 10,
  weapon: 2,
  ...overrides,
});

describe('tracker attack detail', () => {
  test('explains weapon adjustments against the target armor type', () => {
    const attacker = createCombatant({
      key: 1,
      name: 'Aldred',
      weapon: 2,
    });
    const target = createCombatant({
      key: 2,
      name: 'Plate Guard',
      armorType: 20,
      armorClass: 3,
      weapon: 1,
    });

    expect(
      buildTrackerAttackDetail(attacker, target, 'Party 1', 'Enemy 1')
    ).toEqual({
      attackerName: 'Aldred',
      targetName: 'Plate Guard',
      weaponName: 'Axe, Battle',
      targetArmorDescription: 'AT 3 - Plate mail',
      targetArmorClass: 3,
      targetArmorType: 3,
      thaco: 20,
      weaponAdjustment: -2,
      adjustedArmorClass: 1,
      unadjustedToHit: 17,
      toHit: 19,
    });
  });
});
