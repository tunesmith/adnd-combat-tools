import { buildTrackerAttackDetail } from '../helpers/trackerAttackDetail';
import { FIGHTER } from '../tables/attackerClass';
import { getOffHandWeaponOptions } from '../tables/weapon';
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

  test('can explain an off-hand weapon instead of the main weapon', () => {
    const attacker = createCombatant({
      key: 1,
      name: 'Lodi',
      weapon: 57,
      offHandWeapon: 17,
    });
    const target = createCombatant({
      key: 2,
      name: 'Plate Guard',
      armorType: 20,
      armorClass: 3,
      weapon: 1,
    });

    expect(
      buildTrackerAttackDetail(attacker, target, 'Party 1', 'Enemy 1', 17)
    ).toMatchObject({
      attackerName: 'Lodi',
      targetName: 'Plate Guard',
      weaponName: 'Dagger (Held)',
      targetArmorDescription: 'AT 3 - Plate mail',
      weaponAdjustment: -3,
      adjustedArmorClass: 0,
      unadjustedToHit: 17,
      toHit: 20,
    });
  });

  test('limits off-hand weapon options to dagger and hammer choices allowed by class', () => {
    expect(getOffHandWeaponOptions(FIGHTER)).toEqual([
      { value: 17, label: 'Dagger (Held)' },
      { value: 32, label: 'Hammer (Held)' },
    ]);
  });
});
