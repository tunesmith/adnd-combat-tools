import { getTrackerCombatantHeaderDisplay } from '../helpers/trackerCombatantDisplay';
import { FIGHTER } from '../tables/attackerClass';
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
      'Fighter: L1',
      'No Armor',
      'AC 10',
      'Sword, short',
      'Dagger (Held)',
    ]);
  });
});
