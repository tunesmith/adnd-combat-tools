import { getWeaponInfo } from '../tables/weapon';
import type { InitiativeDeclaredAction } from '../types/initiative';

export const getTrackerWeaponWarning = (
  action: InitiativeDeclaredAction,
  weaponId: number | undefined
): string | undefined => {
  const weapon = weaponId === undefined ? undefined : getWeaponInfo(weaponId);
  if (!weapon) return undefined;

  if (action === 'missile' && weapon.weaponType !== 'missile') {
    return `${weapon.name} is not a missile weapon. Check the weapon or action selection.`;
  }
  if (
    (action === 'open-melee' || action === 'charge') &&
    weapon.weaponType === 'missile'
  ) {
    return `${weapon.name} is a missile weapon, but the action is ${
      action === 'charge' ? 'Charge' : 'Open melee'
    }. Check the weapon or action selection.`;
  }
  return undefined;
};
