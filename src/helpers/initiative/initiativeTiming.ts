import type {
  InitiativeScenarioCombatant,
  InitiativeTimingOverride,
} from '../../types/initiative';

export const DEFAULT_MOVEMENT_RATE = 12;
export const DEFAULT_MISSILE_INITIATIVE_ADJUSTMENT = 0;
export const MISSILE_INITIATIVE_ADJUSTMENT_OPTIONS = [
  '-3',
  '-2',
  '-1',
  '0',
  '+1',
  '+2',
  '+3',
];

type MissileTimingCombatant = Pick<
  InitiativeScenarioCombatant,
  'declaredAction' | 'movementRate' | 'missileInitiativeAdjustment'
>;

type InitiativeTimingCombatant = MissileTimingCombatant &
  Pick<InitiativeScenarioCombatant, 'initiative' | 'initiativeTiming'>;

export const movementSuppressesPositiveReactionInitiativeBonuses = (
  movementRate: number
): boolean => movementRate < DEFAULT_MOVEMENT_RATE;

export const parseMovementRate = (value: string): number | undefined => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const parseMissileInitiativeAdjustment = (value: string): number => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return DEFAULT_MISSILE_INITIATIVE_ADJUSTMENT;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_MISSILE_INITIATIVE_ADJUSTMENT;
  }

  return Math.max(-3, Math.min(3, Math.trunc(parsed)));
};

export const formatMissileInitiativeAdjustment = (value: number): string =>
  value > 0 ? `+${value}` : value.toString();

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
