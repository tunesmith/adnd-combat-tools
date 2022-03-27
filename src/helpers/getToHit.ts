import { getThac, getThaco } from "../tables/combatLevel";
import { classMap } from "../tables/attackerClass";
import { getWeaponAdjustment } from "../tables/weapon";

const getToHit = (
  attackerClass,
  attackerLevel,
  targetArmorType,
  targetArmorClass,
  attackerWeapon
): number => {
  const thaco = getThaco(
    attackerClass === "monster" ? "monster" : classMap[attackerClass],
    attackerLevel
  );

  const adjustment = targetArmorType.trim()
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
