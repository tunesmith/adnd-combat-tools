import { getTrackerCombatantHeaderDisplay } from '../helpers/trackerCombatantDisplay';
import { FIGHTER, MONSTER } from '../tables/attackerClass';
import type { TrackerCombatant } from '../types/tracker';

const createCombatant = (
  overrides: Partial<TrackerCombatant>
): TrackerCombatant => ({
  key: 1,
  name: 'Lodi',
  class: FIGHTER,
  level: 1,
  armorType: 2,
  armorClass: 10,
  weapon: 57,
  ...overrides,
});

describe('tracker combatant display', () => {
  test('shows off-hand weapons on a separate header line', () => {
    expect(
      getTrackerCombatantHeaderDisplay(
        createCombatant({ offHandWeapon: 17 }),
        'party'
      ).detailLines
    ).toEqual([
      'Fighter L1',
      'No armor',
      'AC 10 · MV 12"',
      'Sword, short',
      'Dagger (Held)',
    ]);
  });

  test('shows non-default movement and missile initiative timing', () => {
    expect(
      getTrackerCombatantHeaderDisplay(
        createCombatant({
          movementRate: 9,
          missileInitiativeAdjustment: 2,
        }),
        'party'
      ).detailLines
    ).toEqual([
      'Fighter L1',
      'No armor',
      'AC 10 · MV 9"',
      'Dex +2',
      'Sword, short',
    ]);
  });

  test('keeps monster headers compact', () => {
    expect(
      getTrackerCombatantHeaderDisplay(
        createCombatant({
          class: MONSTER,
          level: 5,
          armorType: 1,
          armorClass: 6,
          movementRate: 6,
          weapon: 1,
        }),
        'enemy'
      ).detailLines
    ).toEqual(['Monster HD 2-3+', 'AC 6 · MV 6"', 'Natural Weapon (Monster)']);
  });
});
