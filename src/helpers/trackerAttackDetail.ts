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

const NATURAL_ARMOR_DESCRIPTION = 'Natural armor (Monster)';

const formatSignedNumber = (value: number): string =>
  value > 0 ? `+${value}` : String(value);

const getCombatantName = (
  combatant: TrackerCombatant,
  fallback: string
): string => combatant.name || fallback;

export const getTrackerWeaponAdjustmentSummary = (
  detail: TrackerAttackDetail
): string => {
  if (
    detail.targetArmorType === null &&
    detail.targetArmorDescription === NATURAL_ARMOR_DESCRIPTION
  ) {
    return 'Natural armor; none';
  }

  if (detail.weaponAdjustment === 0) {
    return 'None';
  }

  const difference = detail.toHit - detail.unadjustedToHit;

  if (difference > 0) {
    return `${formatSignedNumber(
      detail.weaponAdjustment
    )} to AC, making this ${difference} harder to hit.`;
  }

  if (difference < 0) {
    return `${formatSignedNumber(
      detail.weaponAdjustment
    )} to AC, making this ${Math.abs(difference)} easier to hit.`;
  }

  return `${formatSignedNumber(detail.weaponAdjustment)} to AC, no net change.`;
};

export const shouldShowTrackerEffectiveArmorClass = (
  detail: TrackerAttackDetail
): boolean => detail.adjustedArmorClass !== detail.targetArmorClass;

export const buildTrackerAttackDetail = (
  attacker: TrackerCombatant,
  target: TrackerCombatant,
  attackerFallbackName: string,
  targetFallbackName: string,
  weapon: number = attacker.weapon
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
    targetArmorType === null ? 0 : getWeaponAdjustment(weapon, targetArmorType);
  const adjustedArmorClass = target.armorClass + weaponAdjustment;

  return {
    attackerName: getCombatantName(attacker, attackerFallbackName),
    targetName: getCombatantName(target, targetFallbackName),
    weaponName: getWeaponInfo(weapon)?.name || 'Unknown weapon',
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
