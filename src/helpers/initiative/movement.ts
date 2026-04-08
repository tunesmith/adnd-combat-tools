import type {
  InitiativeChargeFirstStrike,
  InitiativeMovementResolution,
  InitiativeScenarioCombatant,
} from '../../types/initiative';

const STRIKING_DISTANCE_INCHES = 1;
const SEGMENTS_PER_ROUND = 10;

const getInchesPerSegment = (
  combatant: InitiativeScenarioCombatant
): number => {
  if (combatant.declaredAction === 'charge') {
    return (combatant.movementRate * 2) / SEGMENTS_PER_ROUND;
  }

  if (combatant.declaredAction === 'close') {
    return combatant.movementRate / SEGMENTS_PER_ROUND;
  }

  return 0;
};

const getChargeFirstStrike = (
  attacker: InitiativeScenarioCombatant,
  target: InitiativeScenarioCombatant
): InitiativeChargeFirstStrike => {
  if (
    target.declaredAction === 'set-vs-charge' &&
    target.targetDeclarations.length === 1 &&
    target.targetDeclarations[0]?.targetId === attacker.id
  ) {
    return 'target';
  }

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

const getRelativeClosingInchesPerSegment = (
  attacker: InitiativeScenarioCombatant,
  target: InitiativeScenarioCombatant
): number | undefined => {
  const attackerInchesPerSegment = getInchesPerSegment(attacker);

  if (attackerInchesPerSegment <= 0) {
    return undefined;
  }

  const targetIsMovingTowardAttacker =
    (target.declaredAction === 'close' || target.declaredAction === 'charge') &&
    target.targetDeclarations.length === 1 &&
    target.targetDeclarations[0]?.targetId === attacker.id;

  if (targetIsMovingTowardAttacker) {
    return attackerInchesPerSegment + getInchesPerSegment(target);
  }

  if (target.declaredAction === 'close' || target.declaredAction === 'charge') {
    return undefined;
  }

  return attackerInchesPerSegment;
};

const isTargetMovingTowardAttacker = (
  attacker: InitiativeScenarioCombatant,
  target: InitiativeScenarioCombatant
): boolean =>
  (target.declaredAction === 'close' || target.declaredAction === 'charge') &&
  target.targetDeclarations.length === 1 &&
  target.targetDeclarations[0]?.targetId === attacker.id;

const isInvalidOpenMeleeOpposition = (
  attacker: InitiativeScenarioCombatant,
  target: InitiativeScenarioCombatant
): boolean =>
  attacker.declaredAction === 'close' &&
  target.declaredAction === 'open-melee' &&
  target.targetIds.includes(attacker.id);

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

  if (targetDeclaration.distanceInches === undefined) {
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
      distanceInches: targetDeclaration.distanceInches,
      sameRoundAttack: false,
    };
  }

  if (isInvalidOpenMeleeOpposition(attacker, target)) {
    return {
      combatantId: attacker.id,
      targetId,
      action: attacker.declaredAction,
      reason: 'invalid-open-melee-target',
      distanceInches: targetDeclaration.distanceInches,
      sameRoundAttack: false,
    };
  }

  const closingInchesPerSegment = getRelativeClosingInchesPerSegment(
    attacker,
    target
  );
  if (closingInchesPerSegment === undefined) {
    return {
      combatantId: attacker.id,
      targetId,
      action: attacker.declaredAction,
      reason: 'target-moving-elsewhere',
      distanceInches: targetDeclaration.distanceInches,
      sameRoundAttack: false,
    };
  }

  const distanceInches = targetDeclaration.distanceInches;
  const contactSegment = Math.max(
    1,
    Math.ceil(
      Math.max(distanceInches - STRIKING_DISTANCE_INCHES, 0) /
        closingInchesPerSegment
    )
  );
  const maximumDistanceCovered = closingInchesPerSegment * SEGMENTS_PER_ROUND;

  if (distanceInches > STRIKING_DISTANCE_INCHES + maximumDistanceCovered) {
    return {
      combatantId: attacker.id,
      targetId,
      action: attacker.declaredAction,
      reason: 'no-contact',
      distanceInches,
      closingInchesPerSegment,
      remainingDistanceInches:
        distanceInches - STRIKING_DISTANCE_INCHES - maximumDistanceCovered,
      sameRoundAttack: false,
    };
  }

  return {
    combatantId: attacker.id,
    targetId,
    action: attacker.declaredAction,
    reason: 'contact',
    distanceInches,
    closingInchesPerSegment,
    contactSegment,
    remainingDistanceInches: 0,
    sameRoundAttack:
      attacker.declaredAction === 'charge' ||
      (attacker.declaredAction === 'close' &&
        target.declaredAction === 'charge' &&
        isTargetMovingTowardAttacker(attacker, target)),
    firstStrike:
      attacker.declaredAction === 'charge'
        ? getChargeFirstStrike(attacker, target)
        : undefined,
  };
};

export const resolveSetAgainstChargeResponse = (
  attacker: InitiativeScenarioCombatant,
  targetById: Map<string, InitiativeScenarioCombatant>,
  movementResolutionByCombatantId: Map<string, InitiativeMovementResolution>
): InitiativeMovementResolution | undefined => {
  if (attacker.declaredAction !== 'set-vs-charge') {
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

  const target = targetById.get(targetId);
  const targetMovementResolution =
    movementResolutionByCombatantId.get(targetId);

  if (
    !target ||
    target.declaredAction !== 'charge' ||
    target.targetDeclarations.length !== 1 ||
    target.targetDeclarations[0]?.targetId !== attacker.id ||
    targetMovementResolution?.reason !== 'contact' ||
    !targetMovementResolution.sameRoundAttack ||
    targetMovementResolution.targetId !== attacker.id ||
    targetMovementResolution.contactSegment === undefined
  ) {
    return {
      combatantId: attacker.id,
      targetId,
      action: attacker.declaredAction,
      reason: 'set-not-triggered',
      sameRoundAttack: false,
    };
  }

  return {
    combatantId: attacker.id,
    targetId,
    action: attacker.declaredAction,
    reason: 'contact',
    distanceInches: targetMovementResolution.distanceInches,
    closingInchesPerSegment: targetMovementResolution.closingInchesPerSegment,
    contactSegment: targetMovementResolution.contactSegment,
    remainingDistanceInches: 0,
    sameRoundAttack: true,
    firstStrike: 'attacker',
    damageMultiplier: 2,
  };
};
