import type {
  InitiativeScenarioCombatant,
  InitiativeTimingOverride,
} from '../../types/initiative';

type MissileTimingCombatant = Pick<
  InitiativeScenarioCombatant,
  'declaredAction' | 'movementRate' | 'missileInitiativeAdjustment'
>;

type InitiativeTimingCombatant = MissileTimingCombatant &
  Pick<InitiativeScenarioCombatant, 'initiative' | 'initiativeTiming'>;

export const movementSuppressesPositiveReactionInitiativeBonuses = (
  movementRate: number
): boolean => movementRate < 12;

export const getAppliedMissileInitiativeAdjustment = (
  combatant: MissileTimingCombatant
): number =>
  combatant.declaredAction === 'missile'
    ? movementSuppressesPositiveReactionInitiativeBonuses(
        combatant.movementRate
      )
      ? Math.min(combatant.missileInitiativeAdjustment, 0)
      : combatant.missileInitiativeAdjustment
    : 0;

export const getEffectiveInitiative = (
  combatant: InitiativeTimingCombatant
): number =>
  combatant.initiative + getAppliedMissileInitiativeAdjustment(combatant);

export const getInitiativeTimingOverrideRank = (
  initiativeTiming: InitiativeTimingOverride | undefined
): number => {
  if (initiativeTiming === 'wins-initiative') {
    return 1;
  }

  if (initiativeTiming === 'loses-initiative') {
    return -1;
  }

  return 0;
};

export const compareCombatantInitiative = (
  left: InitiativeScenarioCombatant,
  right: InitiativeScenarioCombatant
): number => {
  const timingRankDifference =
    getInitiativeTimingOverrideRank(left.initiativeTiming) -
    getInitiativeTimingOverrideRank(right.initiativeTiming);

  return timingRankDifference !== 0
    ? timingRankDifference
    : getEffectiveInitiative(left) - getEffectiveInitiative(right);
};
