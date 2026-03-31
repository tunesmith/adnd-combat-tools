import type {
  InitiativeChargeFirstStrike,
  InitiativeMovementResolution,
  InitiativeScenarioCombatant,
} from '../../types/initiative';

const STRIKING_DISTANCE_FEET = 10;
const SEGMENTS_PER_ROUND = 10;

const getFeetPerSegment = (combatant: InitiativeScenarioCombatant): number => {
  if (combatant.declaredAction === 'charge') {
    return combatant.movementRate * 2;
  }

  if (combatant.declaredAction === 'close') {
    return combatant.movementRate;
  }

  return 0;
};

const getChargeFirstStrike = (
  attacker: InitiativeScenarioCombatant,
  target: InitiativeScenarioCombatant
): InitiativeChargeFirstStrike => {
  if (
    attacker.weaponLength === undefined ||
    target.weaponLength === undefined ||
    attacker.weaponType === 'missile' ||
    target.weaponType === 'missile'
  ) {
    return 'undetermined';
  }

  if (attacker.weaponLength > target.weaponLength) {
    return 'attacker';
  }

  if (target.weaponLength > attacker.weaponLength) {
    return 'target';
  }

  return 'simultaneous';
};

const getRelativeClosingFeetPerSegment = (
  attacker: InitiativeScenarioCombatant,
  target: InitiativeScenarioCombatant
): number | undefined => {
  const attackerFeetPerSegment = getFeetPerSegment(attacker);

  if (attackerFeetPerSegment <= 0) {
    return undefined;
  }

  const targetIsMovingTowardAttacker =
    (target.declaredAction === 'close' || target.declaredAction === 'charge') &&
    target.targetDeclarations.length === 1 &&
    target.targetDeclarations[0]?.targetId === attacker.id;

  if (targetIsMovingTowardAttacker) {
    return attackerFeetPerSegment + getFeetPerSegment(target);
  }

  if (target.declaredAction === 'close' || target.declaredAction === 'charge') {
    return undefined;
  }

  return attackerFeetPerSegment;
};

export const resolveMovementAgainstTarget = (
  attacker: InitiativeScenarioCombatant,
  targetById: Map<string, InitiativeScenarioCombatant>
): InitiativeMovementResolution | undefined => {
  if (
    attacker.declaredAction !== 'close' &&
    attacker.declaredAction !== 'charge'
  ) {
    return undefined;
  }

  if (attacker.targetDeclarations.length === 0) {
    return {
      combatantId: attacker.id,
      action: attacker.declaredAction,
      reason: 'missing-target',
      sameRoundAttack: false,
    };
  }

  if (attacker.targetDeclarations.length > 1) {
    return {
      combatantId: attacker.id,
      action: attacker.declaredAction,
      reason: 'multiple-targets',
      sameRoundAttack: false,
    };
  }

  const targetDeclaration = attacker.targetDeclarations[0];
  const targetId = targetDeclaration?.targetId;
  if (!targetId) {
    return {
      combatantId: attacker.id,
      action: attacker.declaredAction,
      reason: 'missing-target',
      sameRoundAttack: false,
    };
  }

  if (targetDeclaration.distance === undefined) {
    return {
      combatantId: attacker.id,
      targetId,
      action: attacker.declaredAction,
      reason: 'missing-distance',
      sameRoundAttack: false,
    };
  }

  const target = targetById.get(targetId);
  if (!target) {
    return {
      combatantId: attacker.id,
      targetId,
      action: attacker.declaredAction,
      reason: 'missing-target',
      distance: targetDeclaration.distance,
      sameRoundAttack: false,
    };
  }

  const closingFeetPerSegment = getRelativeClosingFeetPerSegment(
    attacker,
    target
  );
  if (closingFeetPerSegment === undefined) {
    return {
      combatantId: attacker.id,
      targetId,
      action: attacker.declaredAction,
      reason: 'target-moving-elsewhere',
      distance: targetDeclaration.distance,
      sameRoundAttack: false,
    };
  }

  const distance = targetDeclaration.distance;
  const contactSegment = Math.max(
    1,
    Math.ceil(
      Math.max(distance - STRIKING_DISTANCE_FEET, 0) / closingFeetPerSegment
    )
  );
  const maximumDistanceCovered = closingFeetPerSegment * SEGMENTS_PER_ROUND;

  if (distance > STRIKING_DISTANCE_FEET + maximumDistanceCovered) {
    return {
      combatantId: attacker.id,
      targetId,
      action: attacker.declaredAction,
      reason: 'no-contact',
      distance,
      closingFeetPerSegment,
      remainingDistance:
        distance - STRIKING_DISTANCE_FEET - maximumDistanceCovered,
      sameRoundAttack: false,
    };
  }

  return {
    combatantId: attacker.id,
    targetId,
    action: attacker.declaredAction,
    reason: 'contact',
    distance,
    closingFeetPerSegment,
    contactSegment,
    remainingDistance: 0,
    sameRoundAttack: attacker.declaredAction === 'charge',
    firstStrike:
      attacker.declaredAction === 'charge'
        ? getChargeFirstStrike(attacker, target)
        : undefined,
  };
};
