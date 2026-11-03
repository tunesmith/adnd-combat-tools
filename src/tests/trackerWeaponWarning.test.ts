import { getTrackerWeaponWarning } from '../helpers/trackerWeaponWarning';

describe('tracker weapon/action warnings', () => {
  test.each(['open-melee', 'charge'] as const)(
    '%s warns for a thrown dagger',
    (action) => {
      expect(getTrackerWeaponWarning(action, 18)).toContain('Dagger (Hurled)');
      expect(getTrackerWeaponWarning(action, 17)).toBeUndefined();
      expect(getTrackerWeaponWarning(action, 1)).toBeUndefined();
    }
  );
  test('missile warns for a short sword or natural weapon but accepts a bow', () => {
    expect(getTrackerWeaponWarning('missile', 57)).toContain(
      'not a missile weapon'
    );
    expect(getTrackerWeaponWarning('missile', 1)).toContain(
      'not a missile weapon'
    );
    expect(getTrackerWeaponWarning('missile', 11)).toBeUndefined();
  });
  test.each([
    'none',
    'close',
    'spell-casting',
    'magical-device',
    'turn-undead',
  ] as const)(
    '%s does not require a weapon compatibility warning',
    (action) => {
      expect(getTrackerWeaponWarning(action, 18)).toBeUndefined();
      expect(getTrackerWeaponWarning(action, 57)).toBeUndefined();
    }
  );
  test('does not invent a classification for missing weapons', () => {
    expect(getTrackerWeaponWarning('missile', undefined)).toBeUndefined();
    expect(getTrackerWeaponWarning('charge', -1)).toBeUndefined();
  });
});
