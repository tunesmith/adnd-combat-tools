import type { InitiativeScenarioCombatant } from '../../types/initiative';

type MissileTimingCombatant = Pick<
  InitiativeScenarioCombatant,
  'declaredAction' | 'movementRate' | 'missileInitiativeAdjustment'
>;

type InitiativeTimingCombatant = MissileTimingCombatant &
  Pick<InitiativeScenarioCombatant, 'initiative'>;

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

export const compareCombatantInitiative = (
  left: InitiativeScenarioCombatant,
  right: InitiativeScenarioCombatant
): number => getEffectiveInitiative(left) - getEffectiveInitiative(right);
