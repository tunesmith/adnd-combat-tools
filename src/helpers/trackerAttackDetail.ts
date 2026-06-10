import { getGeneralClass, MONSTER } from '../tables/attackerClass';
import { expandedArmorTypes } from '../tables/armorType';
import { getThac, getThaco } from '../tables/combatLevel';
import { getWeaponAdjustment, getWeaponInfo } from '../tables/weapon';
import type { TrackerCombatant } from '../types/tracker';

export interface TrackerAttackDetail {
  attackerName: string;
  targetName: string;
  weaponName: string;
  targetArmorDescription: string;
  targetArmorClass: number;
  targetArmorType: number | null;
  thaco: number;
  weaponAdjustment: number;
  adjustedArmorClass: number;
  unadjustedToHit: number;
  toHit: number;
}

const getCombatantName = (
  combatant: TrackerCombatant,
  fallback: string
): string => combatant.name || fallback;

export const buildTrackerAttackDetail = (
  attacker: TrackerCombatant,
  target: TrackerCombatant,
  attackerFallbackName: string,
  targetFallbackName: string
): TrackerAttackDetail => {
  const targetArmor = expandedArmorTypes.find(
    (armorProps) => armorProps.key === target.armorType
  );
  const targetArmorType = targetArmor?.armorType ?? null;
  const thaco = getThaco(
    attacker.class === MONSTER ? MONSTER : getGeneralClass(attacker.class),
    attacker.level
  );
  const weaponAdjustment =
    targetArmorType === null
      ? 0
      : getWeaponAdjustment(attacker.weapon, targetArmorType);
  const adjustedArmorClass = target.armorClass + weaponAdjustment;

  return {
    attackerName: getCombatantName(attacker, attackerFallbackName),
    targetName: getCombatantName(target, targetFallbackName),
    weaponName: getWeaponInfo(attacker.weapon)?.name || 'Unknown weapon',
    targetArmorDescription:
      targetArmor?.armorDescription || 'Unknown armor type',
    targetArmorClass: target.armorClass,
    targetArmorType,
    thaco,
    weaponAdjustment,
    adjustedArmorClass,
    unadjustedToHit: getThac(target.armorClass, thaco),
    toHit: getThac(adjustedArmorClass, thaco),
  };
};
