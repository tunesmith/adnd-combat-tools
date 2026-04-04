import type { InitiativeScenarioCombatant } from '../../types/initiative';

const getMissileInitiativeAdjustment = (
  combatant: InitiativeScenarioCombatant
): number =>
  combatant.declaredAction === 'missile'
    ? combatant.missileInitiativeAdjustment
    : 0;

const getEffectiveInitiative = (
  combatant: InitiativeScenarioCombatant
): number => combatant.initiative + getMissileInitiativeAdjustment(combatant);

export const compareCombatantInitiative = (
  left: InitiativeScenarioCombatant,
  right: InitiativeScenarioCombatant
): number => getEffectiveInitiative(left) - getEffectiveInitiative(right);
