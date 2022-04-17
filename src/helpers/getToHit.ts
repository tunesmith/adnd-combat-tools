import { getThac, getThaco } from "../tables/combatLevel";
import { getGeneralClass, MONSTER } from "../tables/attackerClass";
import { getWeaponAdjustment } from "../tables/weapon";

const getToHit = (
  attackerClass: number,
  attackerLevel: number,
  targetArmorType: number | null,
  targetArmorClass: number,
  attackerWeapon: number
): number => {
  const thaco = getThaco(
    attackerClass === MONSTER ? MONSTER : getGeneralClass(attackerClass),
    attackerLevel
  );

  const adjustment = targetArmorType
    ? getWeaponAdjustment(attackerWeapon, targetArmorType)
    : 0;

  return getThac(targetArmorClass + adjustment, thaco);
  /**
   * Alternatively the below makes the adjustment to the die instead of the AC. This is how
   * the combat calculator wheel works, but the wheel is wrong. Dragon #74 refers to applying
   * the adjustment to the "to hit" die, but DMG p70 (Balto with the staff) makes clear the
   * adjustment should be applied to the AC.
   */
  // return getThac(targetArmorClass, thaco) - adjustment;
};

export default getToHit;
